import { Schema, model, Document, Types } from "mongoose";

export interface IChef extends Document {
  staffId: string;
  name: string;
  gender: 'm' | 'f'
  email: string;
  bio?: string;
  specialties: string[];
  category: Types.ObjectId;
  servicesOffered:Types.ObjectId[];
  categoryName: string;
  phoneNumber: number;
  location?: string;
  state: string,
  stateId: number,
  profilePic?: string;
  menus: Types.ObjectId[];
  password?: string | null;
  isPasswordUpdated: boolean;
  isActive: boolean;
  createdAt: Date;
}

const ChefSchema = new Schema<IChef>({
  staffId: { type: String, required: true },
  name: { type: String, required: true },
  gender: {
    type: String,
    enum: ['m', 'f'],
    required: true
  },
  email: { type: String, required: true },
  bio: { type: String },
  specialties: { type: [String], default: [] },
  categoryName: { type: String, required: true },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  servicesOffered: [{ type: Schema.Types.ObjectId, ref: "Service" }],
  phoneNumber: { type: Number, required: true },
  location: { type: String, required: true },
  state: { type: String, required: true },
  stateId: { type: Number, required: true },
  profilePic: { type: String },
  menus: [{ type: Schema.Types.ObjectId, ref: "Menu" }],
  password: { type: String, default: null },
  isPasswordUpdated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
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

ChefSchema.index({ staffId: 1, phoneNumber: 1 }, { unique: true });
export default model<IChef>("Chef", ChefSchema);