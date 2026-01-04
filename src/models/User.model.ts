import { Schema, model, Document } from 'mongoose';


export interface IUser extends Document {
  email: string;
  emailVerificationOtp: string;
  isEmailVerified: boolean;
  password: string;
  loginOtp?: string;
  loginOtpExpires: Date | any;
  fullName?: string;
  firstName: string;
  phone?: string;
  isAdmin: boolean;
  createdAt: Date;
}


const UserModel = new Schema<IUser>({
  email: { type: String, required: true, lowercase: true },
  emailVerificationOtp: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  password: { type: String, required: true },
  loginOtp: { type: String },
  loginOtpExpires: { type: Date },
  fullName: { type: String },
  firstName: { type: String },
  phone: { type: String },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
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

UserModel.index({ email: 1 }, { unique: true });
export default model<IUser>('User', UserModel);