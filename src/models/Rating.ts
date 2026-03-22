import { Schema, model, Document, Types } from "mongoose";

export interface IRating extends Document {
  userId: Types.ObjectId;
  specialMenuId: Types.ObjectId;
  rating: number;
  review?: string;
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    specialMenuId: { type: Schema.Types.ObjectId, ref: 'SpecialMenu', required: true },
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

RatingSchema.index({ userId: 1, specialMenuId: 1 }, { unique: true });

export const Rating = model<IRating>('Rating', RatingSchema);
