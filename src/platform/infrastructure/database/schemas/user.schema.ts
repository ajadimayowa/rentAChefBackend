import { model, models, Schema } from 'mongoose';
import { UserRole } from '../../../domain/enums';

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String },
    role: { type: String, enum: Object.values(UserRole), required: true, index: true },
  },
  { timestamps: true },
);

export const ChefPlatformUserModel = models.User || model('User', userSchema);
