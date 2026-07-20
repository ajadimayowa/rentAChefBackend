import { BookingModel } from "../models/Booking";

export const isChefAvailable = async (
  chefId: string,
  startDate: Date,
  endDate: Date
) => {

  const conflict = await BookingModel.findOne({
    chefId,
    status: { $in: ["confirmed", "ongoing"] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate }
  });

  return !conflict;
};