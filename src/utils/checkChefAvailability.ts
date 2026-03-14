import { Booking } from "../models/Booking";

export const isChefAvailable = async (
  chefId: string,
  startDate: Date,
  endDate: Date
) => {

  const conflict = await Booking.findOne({
    chefId,
    status: { $in: ["confirmed", "ongoing"] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate }
  });

  return !conflict;
};