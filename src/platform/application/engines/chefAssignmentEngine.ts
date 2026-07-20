import { BookingStatus } from '../../domain/enums';
import { IBookingRepository, IChefRepository } from '../contracts/repositories';

export class ChefAssignmentEngine {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly chefRepository: IChefRepository,
  ) {}

  async autoAssignChef(bookingId: string, actorId: string) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) return null;
    if (!booking.chefLevel) return null;
    if (!booking.serviceId) return null;

    const candidates = await this.chefRepository.findAssignableChefs({
      chefLevel: booking.chefLevel,
      serviceId: booking.serviceId,
    });

    if (!candidates.length) return null;

    const selected = candidates[0];

    await this.bookingRepository.updateById(booking.id, {
      assignedChefId: selected.id,
      status: BookingStatus.CHEF_ASSIGNED,
      timeline: [
        ...booking.timeline,
        {
          status: BookingStatus.CHEF_ASSIGNED,
          changedBy: actorId,
          changedAt: new Date(),
        },
      ],
    });

    return selected;
  }
}
