import { Schema, model, Document, Types } from "mongoose";

export interface IFavorite extends Document {
  userId: Types.ObjectId;
  specialMenuId: Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    specialMenuId: { type: Schema.Types.ObjectId, ref: 'SpecialMenu', required: true },
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

FavoriteSchema.index({ userId: 1, specialMenuId: 1 }, { unique: true });

export const Favorite = model<IFavorite>('Favorite', FavoriteSchema);
