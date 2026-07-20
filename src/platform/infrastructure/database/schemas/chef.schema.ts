import { model, models, Schema } from 'mongoose';
import { ChefLevel } from '../../../domain/enums';

const chefSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    level: { type: String, enum: Object.values(ChefLevel), required: true, index: true },
    servicesOffered: [{ type: Schema.Types.ObjectId, ref: 'Service', required: true }],
    availability: [
      {
        start: { type: Date, required: true, index: true },
        end: { type: Date, required: true, index: true },
        isBooked: { type: Boolean, default: false },
        zone: { type: String },
      },
    ],
    ratings: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    experienceYears: { type: Number, default: 0 },
    certifications: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

chefSchema.index({ level: 1, isActive: 1 });
chefSchema.index({ servicesOffered: 1, level: 1 });

export const ChefPlatformChefModel = models.Chef || model('Chef', chefSchema);
