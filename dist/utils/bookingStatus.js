"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bestEffortBookingDate = exports.bestEffortGuestCount = exports.minorToNaira = exports.OPEN_BOOKING_STATUSES = exports.CLOSED_BOOKING_STATUSES = exports.ACTIVE_BOOKING_STATUSES = void 0;
const enums_1 = require("../platform/domain/enums");
/**
 * Booking.status enum values — sourced from platform/domain/enums.ts, the enum
 * actually enforced by ChefPlatformBookingModel (the model that writes to the
 * shared `bookings` collection). Kept here so dashboard/list aggregations across
 * admin/chef/customer controllers stay in sync with each other and the real enum.
 */
exports.ACTIVE_BOOKING_STATUSES = [enums_1.BookingStatus.CHEF_ASSIGNED, enums_1.BookingStatus.IN_PROGRESS];
exports.CLOSED_BOOKING_STATUSES = [enums_1.BookingStatus.COMPLETED, enums_1.BookingStatus.CANCELLED];
exports.OPEN_BOOKING_STATUSES = [
    enums_1.BookingStatus.SUBMITTED,
    enums_1.BookingStatus.ADMIN_REVIEW,
    enums_1.BookingStatus.QUOTATION_SENT,
    enums_1.BookingStatus.PAYMENT_PENDING,
    enums_1.BookingStatus.PAID,
];
/** `pricingSnapshot.estimatedTotalMinor` is stored in kobo — divide by 100 for Naira (matches the mobile app's convention). */
const minorToNaira = (minor) => Math.round((minor || 0) / 100);
exports.minorToNaira = minorToNaira;
/**
 * `bookingData` is a freeform blob whose shape depends on the workflow (dinner
 * party, event catering, residential, ...) — these pull a handful of common keys
 * on a best-effort basis rather than assuming one fixed contract.
 */
const bestEffortGuestCount = (bookingData) => {
    var _a, _b;
    const value = (_b = (_a = bookingData === null || bookingData === void 0 ? void 0 : bookingData.numberOfGuests) !== null && _a !== void 0 ? _a : bookingData === null || bookingData === void 0 ? void 0 : bookingData.guestCount) !== null && _b !== void 0 ? _b : bookingData === null || bookingData === void 0 ? void 0 : bookingData.familySize;
    return typeof value === "number" ? value : null;
};
exports.bestEffortGuestCount = bestEffortGuestCount;
const bestEffortBookingDate = (booking) => {
    var _a, _b;
    return booking.startDate || ((_a = booking.bookingData) === null || _a === void 0 ? void 0 : _a.bookingDate) || ((_b = booking.bookingData) === null || _b === void 0 ? void 0 : _b.eventDate) || booking.createdAt;
};
exports.bestEffortBookingDate = bestEffortBookingDate;
