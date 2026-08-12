import { BookingStatus } from "../platform/domain/enums";

/**
 * Booking.status enum values — sourced from platform/domain/enums.ts, the enum
 * actually enforced by ChefPlatformBookingModel (the model that writes to the
 * shared `bookings` collection). Kept here so dashboard/list aggregations across
 * admin/chef/customer controllers stay in sync with each other and the real enum.
 */
export const ACTIVE_BOOKING_STATUSES = [BookingStatus.CHEF_ASSIGNED, BookingStatus.IN_PROGRESS];
export const CLOSED_BOOKING_STATUSES = [BookingStatus.COMPLETED, BookingStatus.CANCELLED];
export const OPEN_BOOKING_STATUSES = [
  BookingStatus.SUBMITTED,
  BookingStatus.ADMIN_REVIEW,
  BookingStatus.QUOTATION_SENT,
  BookingStatus.PAYMENT_PENDING,
  BookingStatus.PAID,
];

/** `pricingSnapshot.estimatedTotalMinor` is stored in kobo — divide by 100 for Naira (matches the mobile app's convention). */
export const minorToNaira = (minor: number): number => Math.round((minor || 0) / 100);

/**
 * `bookingData` is a freeform blob whose shape depends on the workflow (dinner
 * party, event catering, residential, ...) — these pull a handful of common keys
 * on a best-effort basis rather than assuming one fixed contract.
 */
export const bestEffortGuestCount = (bookingData: any): number | null => {
  const value = bookingData?.numberOfGuests ?? bookingData?.guestCount ?? bookingData?.familySize;
  return typeof value === "number" ? value : null;
};

export const bestEffortBookingDate = (booking: any): Date => {
  return booking.startDate || booking.bookingData?.bookingDate || booking.bookingData?.eventDate || booking.createdAt;
};
