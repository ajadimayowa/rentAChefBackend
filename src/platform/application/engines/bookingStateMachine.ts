import { BookingStatus } from '../../domain/enums';

const transitions: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.SUBMITTED]: [BookingStatus.ADMIN_REVIEW, BookingStatus.PAYMENT_PENDING, BookingStatus.CANCELLED],
  [BookingStatus.ADMIN_REVIEW]: [BookingStatus.QUOTATION_SENT, BookingStatus.CANCELLED],
  [BookingStatus.QUOTATION_SENT]: [BookingStatus.PAYMENT_PENDING, BookingStatus.CANCELLED],
  [BookingStatus.PAYMENT_PENDING]: [BookingStatus.PAID, BookingStatus.CANCELLED],
  [BookingStatus.PAID]: [BookingStatus.CHEF_ASSIGNED, BookingStatus.CANCELLED],
  [BookingStatus.CHEF_ASSIGNED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

export class BookingStateMachine {
  canTransition(from: BookingStatus, to: BookingStatus): boolean {
    return transitions[from].includes(to);
  }

  assertTransition(from: BookingStatus, to: BookingStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid booking transition: ${from} -> ${to}`);
    }
  }
}
