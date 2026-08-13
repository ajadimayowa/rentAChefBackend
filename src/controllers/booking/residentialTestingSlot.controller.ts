import { Request, Response } from "express";
import { BookingModel } from "../../models/Booking";
import { BookingStatus, BookingWorkflow } from "../../platform/domain/enums";

/**
 * Residential "testing phase" slots — clients pick a 5-day window to have
 * their chef testing take place in. Slots roll forward from today (no admin
 * setup required): the first slot opens 7 days out (matching the "usually
 * within 7 days" chef-matching copy elsewhere in the residential flow), each
 * slot runs 5 days, and there's a 3-day gap between one slot's end and the
 * next slot's start. Capacity is enforced by counting existing residential
 * bookings whose `bookingData.testingSlotStart` matches the slot.
 */
const SLOT_LENGTH_DAYS = 5;
const SLOT_GAP_DAYS = 3;
const FIRST_SLOT_OFFSET_DAYS = 7;
const SLOT_CAPACITY = 5;
const SLOTS_TO_GENERATE = 6;

const toDateKey = (date: Date): string => date.toISOString().split("T")[0];

interface SlotWindow {
  startDate: Date;
  endDate: Date;
}

const generateSlotWindows = (count: number): SlotWindow[] => {
  const slots: SlotWindow[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  start.setDate(start.getDate() + FIRST_SLOT_OFFSET_DAYS);

  for (let i = 0; i < count; i++) {
    const end = new Date(start);
    end.setDate(end.getDate() + SLOT_LENGTH_DAYS - 1);

    slots.push({ startDate: new Date(start), endDate: end });

    start = new Date(end);
    start.setDate(start.getDate() + SLOT_GAP_DAYS);
  }

  return slots;
};

export const getResidentialTestingSlots = async (_req: Request, res: Response): Promise<void> => {
  try {
    const windows = generateSlotWindows(SLOTS_TO_GENERATE);
    const slotKeys = windows.map((window) => toDateKey(window.startDate));

    const counts = await BookingModel.aggregate([
      {
        $match: {
          workflow: BookingWorkflow.HOME_RESIDENCE,
          status: { $ne: BookingStatus.CANCELLED },
          "bookingData.testingSlotStart": { $in: slotKeys },
        },
      },
      {
        $group: {
          _id: "$bookingData.testingSlotStart",
          count: { $sum: 1 },
        },
      },
    ]);

    const countBySlotKey = new Map<string, number>(counts.map((entry) => [entry._id, entry.count]));

    const payload = windows.map((window) => {
      const startKey = toDateKey(window.startDate);
      const bookedCount = countBySlotKey.get(startKey) || 0;
      const remaining = Math.max(SLOT_CAPACITY - bookedCount, 0);

      return {
        startDate: startKey,
        endDate: toDateKey(window.endDate),
        capacity: SLOT_CAPACITY,
        bookedCount,
        remaining,
        isFull: bookedCount >= SLOT_CAPACITY,
      };
    });

    res.status(200).json({ success: true, payload });
  } catch (error) {
    console.error("Error fetching residential testing slots:", error);
    res.status(500).json({ success: false, message: "Error fetching testing slots", error });
  }
};
