import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISpecialServiceTermsAndCon extends Document {
  description: string;
  serviceId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialServiceTermsAndConSchema = new Schema<ISpecialServiceTermsAndCon>(
  {
    description: { type: String, required: true, trim: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "SpecialMenu" }
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

export const SpecialServiceTermsAndConModel: Model<ISpecialServiceTermsAndCon> = mongoose.model<ISpecialServiceTermsAndCon>(
  "SpecialServiceTermsAndCon",
  SpecialServiceTermsAndConSchema
);
