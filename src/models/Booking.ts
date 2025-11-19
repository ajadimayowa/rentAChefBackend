import { Schema, model, Document, Types } from 'mongoose';


export interface IBooking extends Document {
user: Types.ObjectId; // who booked (nullable for guest? we'll require user for booking)
chef: Types.ObjectId;
menu: Types.ObjectId;
date: Date;
address: string;
guestsCount: number;
totalPrice: number;
paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
createdAt: Date;
}


const BookingSchema = new Schema<IBooking>({
user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
chef: { type: Schema.Types.ObjectId, ref: 'Chef', required: true },
menu: { type: Schema.Types.ObjectId, ref: 'Menu', required: true },
date: { type: Date, required: true },
address: { type: String, required: true },
guestsCount: { type: Number, default: 1 },
totalPrice: { type: Number, required: true },
paymentStatus: { type: String, default: 'pending' },
createdAt: { type: Date, default: Date.now }
});


export default model<IBooking>('Booking', BookingSchema);