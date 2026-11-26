import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITermsAndCon extends Document {
  /** Heading shown above the clause. Required for new clauses; older ones may not have one. */
  title?: string;
  description: string;
  termsUrl?: string;
  serviceId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  specialMenuId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TermsAndConSchema = new Schema<ITermsAndCon>(
  {
    title: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    termsUrl: { type: String, trim: true },
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
