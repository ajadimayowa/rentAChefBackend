import { Request, Response } from "express";
import mongoose from "mongoose";
import { BookingModel } from "../../models/Booking";
import { BookingStatus } from "../../platform/domain/enums";
import { formatNigerianPhoneNumber } from "../../utils/otpUtils";
import { notifyAdmins } from "../../services/adminNotifications";
import { notifyUser } from "../../services/userNotifications";
import { EventTypeModel } from "../../models/SettingsCatalogue";
import { ServiceRateModel } from "../../models/ServiceRate";

/** Once a booking is under way or closed, the customer can't change it. */
const LOCKED_STATUSES: string[] = [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.CANCELLED];

/** Chef needs this long between arriving and serving (same rule as the booking flow). */
const PREP_MINUTES = 150;
const LAGOS_OFFSET_MINUTES = 60; // WAT, no daylight saving

const OCCASIONS: Record<string, string> = {
  anniversary: "Anniversary",
  proposal: "Proposal",
  birthday: "Birthday",
  romantic_dinner: "Romantic dinner",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DAILY_MENU_CLASSES = ["continental", "intercontinental", "national"];

class BadRequest extends Error {}

const toDate = (value: unknown, label: string): Date => {
  const d = new Date(String(value));
  if (!value || Number.isNaN(d.getTime())) throw new BadRequest(`${label} is not a valid date.`);
  return d;
};

/** Minutes past midnight in Lagos. */
const lagosMinutes = (d: Date) => (d.getUTCHours() * 60 + d.getUTCMinutes() + LAGOS_OFFSET_MINUTES) % 1440;

const phone = (value: unknown, label: string): string => {
  try {
    return formatNigerianPhoneNumber(String(value ?? ""));
  } catch {
    throw new BadRequest(`${label} must be a valid Nigerian number.`);
  }
};

const text = (value: unknown, label: string, { min = 0, max }: { min?: number; max: number }): string => {
  const t = String(value ?? "").trim();
  if (t.length < min) throw new BadRequest(min > 1 ? `${label} is too short.` : `${label} is required.`);
  if (t.length > max) throw new BadRequest(`${label} must be ${max} characters or fewer.`);
  return t;
};

/** "a, b" or ["a", "b"] → ["a", "b"] */
const list = (value: unknown, label: string): string[] => {
  const items = Array.isArray(value) ? value : String(value ?? "").split(",");
  const cleaned = items.map((i) => String(i ?? "").trim()).filter(Boolean);
  if (cleaned.length > 30 || cleaned.some((i) => i.length > 80)) throw new BadRequest(`${label} has too many or too long items.`);
  return cleaned;
};

/**
 * PUT /bookings/:id — the customer edits their own booking's details. Price-setting
 * choices (guests, menu, chef level) can't change here because they've been paid for.
 * Only the fields sent are changed. Admins and the assigned chef are notified.
 */
export const updateCustomerBooking = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const booking = await BookingModel.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const requester = (req as any).user;
    if (String(booking.customerId) !== String(requester?._id)) {
      return res.status(403).json({ success: false, message: "You can only edit your own bookings" });
    }
    if (LOCKED_STATUSES.includes(String(booking.status))) {
      return res.status(409).json({ success: false, message: `This booking is ${String(booking.status).toLowerCase()} and can no longer be edited.` });
    }

    const body = req.body ?? {};
    const current: Record<string, any> = (booking.bookingData as any) || {};
    const set: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    if (body.fullName !== undefined) set.fullName = text(body.fullName, "Full name", { min: 2, max: 120 });
    if (body.phoneNumber !== undefined) set.phoneNumber = phone(body.phoneNumber, "Phone number");
    if (body.alternativePhoneNumber !== undefined) {
      if (String(body.alternativePhoneNumber).trim()) set.alternativePhoneNumber = phone(body.alternativePhoneNumber, "Alternative phone number");
      else unset.alternativePhoneNumber = "";
    }
    const mainPhone = (set.phoneNumber as string) ?? current.phoneNumber;
    if (set.alternativePhoneNumber && set.alternativePhoneNumber === mainPhone) {
      throw new BadRequest("Use a different alternative phone number from your main number.");
    }
    if (body.email !== undefined) {
      const email = text(body.email, "Email", { min: 1, max: 200 });
      if (!EMAIL.test(email)) throw new BadRequest("Enter a valid email address.");
      set.email = email;
    }

    if (body.startDate !== undefined) {
      const date = toDate(body.startDate, "Preferred date");
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (date < yesterday) throw new BadRequest("Preferred date can't be in the past.");
      set.startDate = date.toISOString();
      // Multi-day bookings (Daily Chef) keep their length: move the end date with the start.
      const days = Number(current.numberOfDays);
      if (Number.isInteger(days) && days >= 1) {
        const end = new Date(date);
        end.setDate(end.getDate() + days - 1);
        set.endDate = end.toISOString();
      }
    }
    if (body.addressOfEvent !== undefined) set.addressOfEvent = text(body.addressOfEvent, "Cooking address", { min: 5, max: 300 });
    if (body.occasion !== undefined) {
      const occasion = String(body.occasion ?? "").trim();
      if (!occasion) {
        unset.occasion = "";
        unset.occasionLabel = "";
      } else if (!OCCASIONS[occasion]) {
        throw new BadRequest("Choose a valid occasion.");
      } else {
        set.occasion = occasion;
        set.occasionLabel = OCCASIONS[occasion];
      }
    }

    if (body.arrivalTime !== undefined) set.arrivalTime = toDate(body.arrivalTime, "Chef arrival time").toISOString();
    if (body.serviceTime !== undefined) set.serviceTime = toDate(body.serviceTime, "Serving time").toISOString();
    if (set.arrivalTime || set.serviceTime) {
      const arrival = new Date(String(set.arrivalTime ?? current.arrivalTime));
      const serving = new Date(String(set.serviceTime ?? current.serviceTime));
      if (!Number.isNaN(arrival.getTime()) && !Number.isNaN(serving.getTime()) && lagosMinutes(serving) - lagosMinutes(arrival) < PREP_MINUTES) {
        throw new BadRequest("Serving time must be at least 2 hrs 30 mins after the chef arrives.");
      }
    }

    if (body.allergies !== undefined) set.allergies = list(body.allergies, "Allergies");
    if (body.dietaryPreferences !== undefined) set.dietaryPreferences = list(body.dietaryPreferences, "Dietary preferences");
    if (body.excludedIngredients !== undefined) set.excludedIngredients = list(body.excludedIngredients, "Ingredients you don't eat");
    /* ---- Alase fields ---- */
    if (body.eventAddress !== undefined) set.eventAddress = text(body.eventAddress, "Event location", { min: 5, max: 300 });
    if (body.eventTypeId !== undefined) {
      const eventTypeId = String(body.eventTypeId ?? "").trim();
      if (!mongoose.Types.ObjectId.isValid(eventTypeId)) throw new BadRequest("Select the type of event.");
      const eventType = await EventTypeModel.findOne({ _id: eventTypeId, isActive: true });
      if (!eventType) throw new BadRequest("That type of event is no longer available.");
      set.eventTypeId = String(eventType._id);
      set.eventType = eventType.name;
    }
    if (body.guestRangeId !== undefined) {
      // The guest range sets the price, so it's fixed once the booking is paid.
      if (String(booking.paymentStatus) === "Paid") throw new BadRequest("The number of guests can't change after payment. Message us to change it.");
      const rateId = String(body.guestRangeId ?? "").trim();
      if (!mongoose.Types.ObjectId.isValid(rateId)) throw new BadRequest("Select the number of guests.");
      const rate = await ServiceRateModel.findOne({ _id: rateId, serviceId: (booking as any).serviceId, isActive: true });
      if (!rate) throw new BadRequest("That guest range is no longer available.");
      set.guestRange = {
        id: String(rate._id),
        minGuests: rate.minGuests,
        maxGuests: rate.maxGuests ?? null,
        pricingType: rate.pricingType ?? "fixed",
        ratePerStaff: rate.ratePerStaff ?? null,
      };
    }
    if (body.menuText !== undefined) {
      const menuText = text(body.menuText, "Menu", { max: 4000 });
      if (menuText) set.menuText = menuText;
      else unset.menuText = "";
    }
    if (body.menuPdfUrl !== undefined) {
      const url = String(body.menuPdfUrl ?? "").trim();
      if (url) {
        // Only links to menus uploaded through the app are accepted.
        if (!/^https:\/\/[^\s]+\/documents\/customer-menus\/[^\s]+\.pdf$/i.test(url)) throw new BadRequest("Upload your menu PDF again.");
        set.menuPdfUrl = url;
        set.menuPdfName = text(body.menuPdfName || "menu.pdf", "Menu file name", { max: 200 });
      } else {
        unset.menuPdfUrl = "";
        unset.menuPdfName = "";
      }
    }
    // A menu must remain — typed or uploaded.
    if (body.menuText !== undefined || body.menuPdfUrl !== undefined) {
      const hasText = set.menuText !== undefined ? true : unset.menuText === undefined && !!String(current.menuText ?? "").trim();
      const hasPdf = set.menuPdfUrl !== undefined ? true : unset.menuPdfUrl === undefined && !!current.menuPdfUrl;
      const isAlase = current.menuText !== undefined || current.menuPdfUrl !== undefined || set.menuText !== undefined || set.menuPdfUrl !== undefined;
      if (isAlase && !hasText && !hasPdf) throw new BadRequest("Type your menu or upload it as a PDF.");
    }
    if (body.killingCow !== undefined) {
      if (body.killingCow !== true && body.killingCow !== false) throw new BadRequest("Let us know if you'll be killing a cow.");
      set.killingCow = body.killingCow;
    }
    if (body.specialRequirements !== undefined) {
      const special = text(body.specialRequirements, "Special requirements", { max: 1000 });
      if (special) set.specialRequirements = special;
      else unset.specialRequirements = "";
    }

    /* ---- Daily Chef fields ---- */
    if (body.noOfResidents !== undefined) {
      const n = Number(body.noOfResidents);
      if (!Number.isInteger(n) || n < 1 || n > 50) throw new BadRequest("Number of residents must be between 1 and 50.");
      set.noOfResidents = n;
    }
    if (body.menuClass !== undefined) {
      if (!DAILY_MENU_CLASSES.includes(String(body.menuClass))) throw new BadRequest("Choose a valid menu class.");
      set.menuClass = String(body.menuClass);
    }
    if (body.preferredChefGender !== undefined) {
      if (!["male", "female"].includes(String(body.preferredChefGender))) throw new BadRequest("Choose a valid chef gender.");
      set.preferredChefGender = String(body.preferredChefGender);
    }
    if (body.mealTimes !== undefined) {
      const meals = body.mealTimes ?? {};
      const times = {
        breakfast: toDate(meals.breakfast, "Breakfast time"),
        lunch: toDate(meals.lunch, "Lunch time"),
        dinner: toDate(meals.dinner, "Dinner time"),
      };
      if (lagosMinutes(times.lunch) <= lagosMinutes(times.breakfast)) throw new BadRequest("Lunch should be after breakfast.");
      if (lagosMinutes(times.dinner) <= lagosMinutes(times.lunch)) throw new BadRequest("Dinner should be after lunch.");
      set.mealTimes = {
        breakfast: times.breakfast.toISOString(),
        lunch: times.lunch.toISOString(),
        dinner: times.dinner.toISOString(),
      };
    }
    if (body.gatedEstate !== undefined) {
      if (body.gatedEstate !== true && body.gatedEstate !== false) throw new BadRequest("Let us know if you live in a gated estate.");
      set.gatedEstate = body.gatedEstate;
      if (body.gatedEstate) {
        set.estateName = text(body.estateName, "Estate name", { min: 2, max: 120 });
        set.gateAccessInstructions = text(body.gateAccessInstructions, "Gate code or access instructions", { min: 1, max: 500 });
        if (body.gateCodesSentToSecurity !== true && body.gateCodesSentToSecurity !== false) {
          throw new BadRequest("Let us know if security has the gate codes.");
        }
        set.gateCodesSentToSecurity = body.gateCodesSentToSecurity;
      } else {
        unset.estateName = "";
        unset.gateAccessInstructions = "";
        unset.gateCodesSentToSecurity = "";
      }
    }
    if (body.spiceLevel !== undefined) {
      if (!["mild", "medium", "hot", "indifferent"].includes(String(body.spiceLevel))) throw new BadRequest("Choose a spice level.");
      set.spiceLevel = String(body.spiceLevel);
    }
    if (body.leftoverStorage !== undefined) set.leftoverStorage = text(body.leftoverStorage, "Leftover storage preference", { min: 1, max: 300 });

    if (body.chefNotes !== undefined) {
      const notes = text(body.chefNotes, "Notes for the chef", { max: 1000 });
      if (notes) set.chefNotes = notes;
      else unset.chefNotes = "";
    }

    if (Object.keys(set).length === 0 && Object.keys(unset).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update." });
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length) update.$set = Object.fromEntries(Object.entries(set).map(([k, v]) => [`bookingData.${k}`, v]));
    if (Object.keys(unset).length) update.$unset = Object.fromEntries(Object.keys(unset).map((k) => [`bookingData.${k}`, ""]));
    const updated = await BookingModel.findByIdAndUpdate(id, update, { new: true });

    const bookingNumber = (booking as any).bookingNumber || String(booking._id);
    await notifyAdmins({
      type: "booking-updated",
      title: `Booking ${bookingNumber} updated by the customer`,
      message: "The customer changed their booking details.",
      link: `/admin/bookings/${booking._id}`,
      metadata: { bookingId: String(booking._id), fields: [...Object.keys(set), ...Object.keys(unset)] },
    });
    if (booking.chefId) {
      await notifyUser({
        userId: String(booking.chefId),
        type: "booking-status-update",
        title: `Booking ${bookingNumber} updated`,
        message: "The client changed the booking details. Please review them.",
        link: `/chef/bookings/${booking._id}`,
        resourceId: String(booking._id),
      });
    }

    return res.status(200).json({ success: true, message: "Booking updated", payload: updated?.bookingData ?? {} });
  } catch (error) {
    if (error instanceof BadRequest) return res.status(400).json({ success: false, message: error.message });
    console.error("updateCustomerBooking error:", error);
    return res.status(500).json({ success: false, message: "Could not update the booking" });
  }
};
