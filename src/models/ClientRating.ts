import { Schema, model, Document, Types } from "mongoose";

export interface IClientRating extends Document {
  chefId: Types.ObjectId; // rater
  clientId: Types.ObjectId; // target
  bookingId: Types.ObjectId;
  rating: number;
  review?: string;
  createdAt: Date;
}

const ClientRatingSchema = new Schema<IClientRating>(
  {
    chefId: { type: Schema.Types.ObjectId, ref: 'Chef', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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

// each booking can only be rated once
ClientRatingSchema.index({ bookingId: 1 }, { unique: true });

export const ClientRating = model<IClientRating>('ClientRating', ClientRatingSchema);
