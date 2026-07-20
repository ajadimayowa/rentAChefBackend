"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingStateMachine = void 0;
const enums_1 = require("../../domain/enums");
const transitions = {
    [enums_1.BookingStatus.SUBMITTED]: [enums_1.BookingStatus.ADMIN_REVIEW, enums_1.BookingStatus.PAYMENT_PENDING, enums_1.BookingStatus.CANCELLED],
    [enums_1.BookingStatus.ADMIN_REVIEW]: [enums_1.BookingStatus.QUOTATION_SENT, enums_1.BookingStatus.CANCELLED],
    [enums_1.BookingStatus.QUOTATION_SENT]: [enums_1.BookingStatus.PAYMENT_PENDING, enums_1.BookingStatus.CANCELLED],
    [enums_1.BookingStatus.PAYMENT_PENDING]: [enums_1.BookingStatus.PAID, enums_1.BookingStatus.CANCELLED],
    [enums_1.BookingStatus.PAID]: [enums_1.BookingStatus.CHEF_ASSIGNED, enums_1.BookingStatus.CANCELLED],
    [enums_1.BookingStatus.CHEF_ASSIGNED]: [enums_1.BookingStatus.IN_PROGRESS, enums_1.BookingStatus.CANCELLED],
    [enums_1.BookingStatus.IN_PROGRESS]: [enums_1.BookingStatus.COMPLETED, enums_1.BookingStatus.CANCELLED],
    [enums_1.BookingStatus.COMPLETED]: [],
    [enums_1.BookingStatus.CANCELLED]: [],
};
class BookingStateMachine {
    canTransition(from, to) {
        return transitions[from].includes(to);
    }
    assertTransition(from, to) {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid booking transition: ${from} -> ${to}`);
        }
    }
}
exports.BookingStateMachine = BookingStateMachine;
