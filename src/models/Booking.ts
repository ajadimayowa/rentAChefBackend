import { Schema, model, Types, Document } from "mongoose";

export interface IBooking extends Document {
  clientId: Types.ObjectId;
  chefId?: Types.ObjectId;
  serviceId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  subCategoryId?: Types.ObjectId;
  specialMenuId?: Types.ObjectId;

  clientNote:string,

  startDate: Date;
  endDate: Date;

  bookingFeePaid: boolean;
  procurementPaid: boolean;

  bookingFeeAmount: number;
  numberOfPeople: number;
  procurementAmount: number;
  totalAmount: number;

  bookingType: "special-menu" | "chef";

  status: "pending" | "confirmed" | "ongoing" | "completed" | "cancelled";

  paymentChannel?: "paystack" | "invoice";
  paymentReference?: string;

  cancellationReason?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bookingType: {
      type: String,
      enum: ["special-menu", "chef"],
      required: true,
    },

    clientNote: {
      type: String,
      required: true,
    },

    chefId: {
      type: Schema.Types.ObjectId,
      ref: "Chef",
      required: function () {
        return this.bookingType === "chef";
      },
    },

    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: function () {
        return this.bookingType === "chef";
      },
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },

    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
    },

    specialMenuId: {
      type: Schema.Types.ObjectId,
      ref: "SpecialMenu",
      required: function () {
        return this.bookingType === "special-menu";
      },
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (v: Date) {
          return v > this.startDate;
        },
        message: "End date must be after the start date.",
      },
    },

    bookingFeePaid: {
      type: Boolean,
      default: true,
    },

    procurementPaid: {
      type: Boolean,
      default: false,
    },

    bookingFeeAmount: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },

    numberOfPeople: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },

    procurementAmount: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentChannel: {
      type: String,
      enum: ["paystack", "invoice"],
    },

    paymentReference: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "ongoing", "completed", "cancelled"],
      default: "confirmed",
      index: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },
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

/* Fast chef availability lookup */
BookingSchema.index({
  chefId: 1,
  startDate: 1,
  endDate: 1,
  status: 1,
});

/* Client booking history */
BookingSchema.index({
  clientId: 1,
  createdAt: -1,
});


/* Prevent duplicate booking for same chef + time slot */
BookingSchema.index(
  { chefId: 1, startDate: 1, endDate: 1 },
  {
    unique: true,
    partialFilterExpression: {
      chefId: { $exists: true },
      status: { $in: ["confirmed", "ongoing"] }
    }
  }
);


export const Booking = model<IBooking>("Booking", BookingSchema);