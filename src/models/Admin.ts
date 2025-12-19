import mongoose, { Schema, Document } from "mongoose";
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  fullName: string;
  email: string;
  password: string;
  role: "super_admin" | "admin";
  isActive: boolean;
  comparePassword(password: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin"
    },
    isActive: {
      type: Boolean,
      default: true
    }
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

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

AdminSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};
AdminSchema.index({ email: 1 }, { unique: true });
export default mongoose.model<IAdmin>("Admin", AdminSchema);

