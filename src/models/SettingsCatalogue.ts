import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Simple named lists the admin manages in Settings: event types (Wedding,
 * Birthday…) and protein options (Full Cow, Chicken Carton…). Same shape, separate collections.
 */
export interface ICatalogueItem extends Document {
  name: string;
  description?: string;
  /** Protein options only: picture shown in the app instead of an icon. */
  proteinImage?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const buildSchema = (extra: Record<string, unknown> = {}) => {
  const schema = new Schema<ICatalogueItem>(
    {
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      ...extra,
      isActive: { type: Boolean, default: true, index: true },
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
  // Names are unique per list, ignoring case.
  schema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
  return schema;
};

export const EventTypeModel: Model<ICatalogueItem> = mongoose.model<ICatalogueItem>("EventType", buildSchema());
export const ProteinOptionModel: Model<ICatalogueItem> = mongoose.model<ICatalogueItem>(
  "ProteinOption",
  buildSchema({ proteinImage: { type: String, trim: true, default: null } })
);
