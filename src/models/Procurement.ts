import { Schema, model, Types, Document } from 'mongoose';

export interface IProcurementItem {
    title: string;
    description?: string;
    amount: number;
}

export interface IProcurement extends Document {
    bookingId: Types.ObjectId;
    items: IProcurementItem[];
    totalCost: number;
    isProcurementPaid?: boolean;
    paymentChannel?: 'paystack' | 'transfer';
    paymentReference?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProcurementItemSchema = new Schema<IProcurementItem>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
});

const ProcurementSchema = new Schema<IProcurement>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        items: { type: [ProcurementItemSchema], default: [] },
        totalCost: { type: Number, required: true, min: 0, default: 0 },
        isProcurementPaid: { type: Boolean, default: false },
        paymentChannel: { type: String, enum: ['paystack', 'transfer'] },
        paymentReference: { type: String, trim: true },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform(_doc, ret: any) {
                ret.id = ret._id.toString();
                delete ret._id;
                return ret;
            },
        },
    }
);

// Calculate totalCost before save by summing item amounts
ProcurementSchema.pre('save', function (next) {
    try {
        const doc: any = this;
        if (Array.isArray(doc.items)) {
            doc.totalCost = doc.items.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
        } else {
            doc.totalCost = 0;
        }
        next();
    } catch (err) {
        next(err as any);
    }
});

export default model<IProcurement>('Procurement', ProcurementSchema);
