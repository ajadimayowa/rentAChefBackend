import { Schema, model, Document, Types } from "mongoose";

export interface IChef extends Document {
  staffId: string;
  name: string;
  email: string;
  bio?: string;
  specialties: string[];
  location?: string;
  profilePic?: string;
  menus: Types.ObjectId[];
  password?: string | null;
  isActive: boolean;
  createdAt: Date;
}

const ChefSchema = new Schema<IChef>({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String },
  specialties: { type: [String], default: [] },
  location: { type: String },
  profilePic: { type: String },
  menus: [{ type: Schema.Types.ObjectId, ref: "Menu" }],
  password: { type: String, default: null },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default model<IChef>("Chef", ChefSchema);