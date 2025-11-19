import { Schema, model, Document, Types } from 'mongoose';


export interface IPayment extends Document {
booking: Types.ObjectId;
amount: number;
method: string; // e.g. 'card', 'wallet'
providerResponse?: any;
status: 'pending' | 'success' | 'failed';
createdAt: Date;
}


const PaymentSchema = new Schema<IPayment>({
booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
amount: { type: Number, required: true },
method: { type: String, required: true },
providerResponse: { type: Schema.Types.Mixed },
status: { type: String, default: 'pending' },
createdAt: { type: Date, default: Date.now }
});


export default model<IPayment>('Payment', PaymentSchema);