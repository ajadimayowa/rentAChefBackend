// models/ChefService.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IChefService extends Document {
    chefId: Types.ObjectId;
    serviceId: Types.ObjectId;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ChefServiceSchema = new Schema<IChefService>(
    {
        chefId: { type: Schema.Types.ObjectId, ref: "Chef", required: true },
        serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
        isAvailable: { type: Boolean, default: true },
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

// Prevent duplicate chef-service combinations
ChefServiceSchema.index({ chefId: 1, serviceId: 1 }, { unique: true });

export const ChefService = model<IChefService>("ChefService", ChefServiceSchema);