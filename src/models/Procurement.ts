import { Schema, model, Types, Document } from 'mongoose';

export interface IProcurementItem {
    title: string;
    description?: string;
    amount: number;
}

export interface IProcurement extends Document {
    bookingId: Types.ObjectId;
    /** Legacy itemised procurements. New ones are a PDF + total instead. */
    items: IProcurementItem[];
    totalCost: number;
    /** Public URL of the procurement PDF the admin uploaded. */
    documentUrl?: string;
    documentName?: string;
    createdBy?: Types.ObjectId;
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
        documentUrl: { type: String, trim: true },
        documentName: { type: String, trim: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

ProcurementSchema.index({ bookingId: 1, createdAt: -1 });

// Itemised (legacy) procurements derive totalCost from their items. PDF procurements
// have no items — their totalCost is the amount the admin entered, so leave it alone.
ProcurementSchema.pre('save', function (next) {
    try {
        const doc: any = this;
        if (Array.isArray(doc.items) && doc.items.length > 0) {
            doc.totalCost = doc.items.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
        }
        next();
    } catch (err) {
        next(err as any);
    }
});

export default model<IProcurement>('Procurement', ProcurementSchema);
