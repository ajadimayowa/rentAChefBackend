import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  bookingNumber: string;
  customerId: Schema.Types.ObjectId;
  specialServiceId?: Schema.Types.ObjectId;
  serviceId?: Schema.Types.ObjectId;
  termsAccepted: boolean;

  chefId?: Schema.Types.ObjectId;
  chefCategory?: Schema.Types.ObjectId;

  workflow?: string;

  bookingType?: 'INSTANT' | 'QUOTATION';
  modeOfPayment?: 'Paystack' | 'Transfer' | 'Unpaid';

  status: BookingStatus;
  paymentStatus: PaymentStatus;
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

  quotationId?: string;
  transactnRef?: string;
}

export type BookingStatus =
  | "Submitted"
  | "Admin review"
  | "Quotation sent"
  | "Chef assigned"
  | "In progress"
  | "Completed"
  | "Cancelled"

export type PaymentStatus =
  | "Unpaid"
  | "Paid"
  | "Failed"

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

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    chefId: { type: Schema.Types.ObjectId, ref: "Chef", index: true },
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
      enum: ["instant", "quotation"],
    },

    modeOfPayment: {
      type: String,
      enum: ['Paystack', 'Transfer', 'Unpaid'],
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Submitted",
        "Admin reviewed",
        "Quotation sent",
        "Chef assigned",
        "In progress",
        "Completed",
        "Cancelled",
      ],
      index: true,
      default: "Submitted",
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Failed"],
      default: "Unpaid",
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
        status: { type: String, required: true },
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