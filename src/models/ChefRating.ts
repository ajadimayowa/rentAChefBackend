import { Schema, model, Document, Types } from "mongoose";

export interface IChefRating extends Document {
  userId: Types.ObjectId;
  chefId: Types.ObjectId;
  bookingId: Types.ObjectId;
  rating: number;
  review?: string;
  createdAt: Date;
}

const ChefRatingSchema = new Schema<IChefRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chefId: { type: Schema.Types.ObjectId, ref: 'Chef', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

/* Ensure a booking can only be rated once */
ChefRatingSchema.index({ bookingId: 1 }, { unique: true });

export const ChefRating = model<IChefRating>('ChefRating', ChefRatingSchema);
