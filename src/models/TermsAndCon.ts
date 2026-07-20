import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITermsAndCon extends Document {
  description: string;
  serviceId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  specialMenuId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TermsAndConSchema = new Schema<ITermsAndCon>(
  {
    description: { type: String, required: true, trim: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    categoryId: { type: Schema.Types.ObjectId, ref: "ServiceCategory" },
    specialMenuId: { type: Schema.Types.ObjectId, ref: "SpecialMenu" },
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

export const TermsAndConModel: Model<ITermsAndCon> = mongoose.model<ITermsAndCon>(
  "TermsAndCon",
  TermsAndConSchema
);
