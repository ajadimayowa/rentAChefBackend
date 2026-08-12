import mongoose, { Schema, Document, Model } from "mongoose";
import {
  BookingStatus as PlatformBookingStatus,
  PaymentStatus as PlatformPaymentStatus,
  BookingType as PlatformBookingType,
} from "../platform/domain/enums";

export interface IBooking extends Document {
  bookingNumber: string;
  customerId: Schema.Types.ObjectId;
  specialServiceId?: Schema.Types.ObjectId;
  serviceId?: Schema.Types.ObjectId;
  termsAccepted: boolean;

  chefId?: Schema.Types.ObjectId;
  chefCategory?: Schema.Types.ObjectId;

  workflow?: string;

  bookingType?: PlatformBookingType;
  modeOfPayment?: 'Paystack' | 'Transfer' | 'Cash' | 'Unpaid';

  status: PlatformBookingStatus;
  paymentStatus: PlatformPaymentStatus;
  startDate?: Date;
  endDate?: Date;

  bookingData: Record<string, any>;
  pricingSnapshot?: {
    baseChefFeeMinor: number;
    estimatedTotalMinor: number;
    currency: string;
  };
  timeline?: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
    reason?: string;
  }>;

  menuSelection?: IMenuSelection;
  menuSelectionType?: 'CHEF_MENU' | 'CUSTOMER_UPLOAD';
  chefMenuId?: Schema.Types.ObjectId;
  customerUploadedMenuFileId?: Schema.Types.ObjectId;

  procurement?: IProcurement;

  comments?: Array<{
    text: string;
    authorId: string;
    authorName?: string;
    createdAt: Date;
  }>;

  paymentDetails?: {
    mode: 'Cash' | 'Transfer';
    transactionRef: string;
    bankName?: string;
    accountNumber?: string;
    amount: number;
    date: Date;
    recordedBy: string;
    recordedAt: Date;
  };

  quotationId?: string;
  transactnRef?: string;
}

/**
 * Re-exported from `platform/domain/enums` — this is the enum actually enforced by
 * `ChefPlatformBookingModel` (platform/infrastructure/database/schemas/booking.schema.ts),
 * which writes to the same underlying `bookings` collection as this model. Deriving
 * from the same source keeps the two schemas from drifting out of sync again (they
 * previously disagreed on casing and were missing "Payment Pending"/"Paid").
 */
export { PlatformBookingStatus as BookingStatus, PlatformPaymentStatus as PaymentStatus };

export interface IMenuSelection {
  source: "chef" | "customer";
  chefMenuId?: string;
  uploadedMenuUrl?: string;
  uploadedMenuType?: "pdf" | "docx" | "jpg" | "png";
}

export interface IProcurement {
  option: "customer" | "chef";
  estimatedCost?: number;
  finalCost?: number;
  procurementFee?: number;
}

const MenuSelectionSchema = new Schema<IMenuSelection>({
  source: { type: String, enum: ["chef", "customer"] },
  chefMenuId: { type: Schema.Types.ObjectId, ref: "ChefMenu" },
  uploadedMenuUrl: String,
  uploadedMenuType: String,
});

const ProcurementSchema = new Schema<IProcurement>({
  option: { type: String, enum: ["customer", "chef"] },
  estimatedCost: Number,
  finalCost: Number,
  procurementFee: Number,
});

const PaymentDetailsSchema = new Schema(
  {
    mode: { type: String, enum: ["Cash", "Transfer"], required: true },
    transactionRef: { type: String, required: true },
    bankName: { type: String },
    accountNumber: { type: String },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    recordedBy: { type: String, required: true },
    recordedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    chefId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    specialServiceId: { type: Schema.Types.ObjectId, ref: "SpecialMenu", index: true },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      index: true,
    },

    chefCategory: {
      type: String,
      ref: "Category",
      index: true,
    },
    workflow: { type: String, index: true },

    bookingType: {
      type: String,
      enum: Object.values(PlatformBookingType),
    },

    modeOfPayment: {
      type: String,
      enum: ['Paystack', 'Transfer', 'Cash', 'Unpaid'],
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(PlatformBookingStatus),
      index: true,
      default: PlatformBookingStatus.SUBMITTED,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PlatformPaymentStatus),
      default: PlatformPaymentStatus.UNPAID,
      index: true,
    },

    bookingData: Schema.Types.Mixed,

    pricingSnapshot: {
      baseChefFeeMinor: { type: Number, default: 0 },
      estimatedTotalMinor: { type: Number, default: 0 },
      currency: { type: String, default: 'NGN' },
    },

    timeline: [
      {
        status: { type: String, enum: Object.values(PlatformBookingStatus), required: true },
        changedBy: { type: String, required: true },
        changedAt: { type: Date, required: true },
        reason: { type: String },
      },
    ],

    menuSelection: MenuSelectionSchema,
    menuSelectionType: { type: String, enum: ['CHEF_MENU', 'CUSTOMER_UPLOAD'] },
    chefMenuId: { type: Schema.Types.ObjectId, ref: 'ChefMenu' },
    customerUploadedMenuFileId: { type: Schema.Types.ObjectId, ref: 'UploadedFile' },

    procurement: ProcurementSchema,

    comments: [
      {
        text: { type: String, required: true },
        authorId: { type: String, required: true },
        authorName: { type: String },
        createdAt: { type: Date, required: true, default: Date.now },
      },
    ],

    paymentDetails: PaymentDetailsSchema,

    quotationId: { type: Schema.Types.ObjectId, ref: "Quotation" },

    transactnRef: { type: String, required: true, index: true, default: "" },
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

BookingSchema.index({ customerId: 1, createdAt: -1 });
BookingSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });
BookingSchema.index({ serviceId: 1, chefLevel: 1, status: 1 });

export const BookingModel: Model<IBooking> =
  mongoose.model("Booking", BookingSchema);