import { Schema, model, Document, Types } from "mongoose";

export interface IChef extends Document {
  userId?: Types.ObjectId;
  staffId?: string;
  name: string;
  gender?: 'm' | 'f';
  email: string;
  bio?: string;
  dob?: Date;
  yearsOfExperience?: number;
  rating?: number;
  specialties?: string[];
  category?: Types.ObjectId;
  phoneNumber?: number;
  location?: string;
  state?: string;
  stateId?: number;
  profilePic?: string;
  menus?: Types.ObjectId[];
  level?: 'JUNIOR' | 'SENIOR' | 'EXECUTIVE';
  servicesOffered?: Types.ObjectId[];
  availability?: Array<{
    start: Date;
    end: Date;
    isBooked: boolean;
    zone?: string;
  }>;
  password?: string | null;
  loginOtp?: string;
  loginOtpExpires?: Date;
  isPasswordUpdated: boolean;
  isActive: boolean;
  experienceYears?: number;
  certifications?: string[];
}

const ChefSchema = new Schema<IChef>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  staffId: { type: String },
  name: { type: String },
  gender: {
    type: String,
    enum: ['m', 'f'],
  },
  email: { type: String, index: true },
  bio: { type: String },
  specialties: { type: [String], default: [] },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
  phoneNumber: { type: Number },
  location: { type: String },
  state: { type: String },
  stateId: { type: Number },
  profilePic: { type: String },
  menus: [{ type: Schema.Types.ObjectId, ref: "Menu" }],
  level: { type: String, enum: ['JUNIOR', 'SENIOR', 'EXECUTIVE'], index: true },
  servicesOffered: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  availability: [
    {
      start: { type: Date, index: true },
      end: { type: Date, index: true },
      isBooked: { type: Boolean, default: false },
      zone: { type: String },
    },
  ],
  loginOtp: { type: String },
  loginOtpExpires: { type: Date },
  password: { type: String, default: null },
  isPasswordUpdated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  dob: { type: Date },
  yearsOfExperience: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  experienceYears: { type: Number, default: 0 },
  certifications: [{ type: String }],
}, {
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
});

ChefSchema.index({ level: 1, isActive: 1 });
ChefSchema.index({ servicesOffered: 1, level: 1 });
export default model<IChef>("Chef", ChefSchema);