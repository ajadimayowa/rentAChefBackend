import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  emailVerificationOtp: string;
  isEmailVerified: boolean;
  password: string;
  loginOtp?: string;
  loginOtpExpires: Date | any;
  fullName?: string;
  profilePic?: string;  // Made optional
  firstName: string;
  gender:'m'|'f';
  phone?: string;
  maritalStatus?: 'Single'|'Married'|'Divorced'|'Widowed'; // Made optional
  dob?:Date;
  isAdmin: boolean;
  createdAt: Date;
  location?: {  // Made optional
    home: string;
    office: string;
    state: string;
    city: string;
    long: string;
    lat: string;
  };
  kyc?: {  // Made optional
    idType: string;
    idNumber: string;
    idPicture: string;
    isVerified: boolean;
  };
  nok?: {  // Made optional
    fullName: string;
    phone: string;
    relationship: string;
  };
  healthInformation?: {  // Made optional
    allergies: string[];  // Fixed typo from 'allegies' to 'allergies'
    healthDetails: string;
  };
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
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed']},
  gender: { type: String, enum: ['m', 'f']},
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  profilePic: { type: String },  // Added optional profilePic
  dob: { type: Date },  // Added optional profilePic
  location: {
    home: { type: String },
    office: { type: String },
    state: { type: String },
    city: { type: String },
    long: { type: String },
    lat: { type: String },
  },
  kyc: {
    idType: { type: String },
    idNumber: { type: String },
    idPicture: { type: String },
    isVerified: { type: Boolean, default: false }
  },
  nok: {
    fullName: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  healthInformation: {
    allergies: { type: [String] },
    healthDetails: { type: String },
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

UserModel.index({ email: 1 }, { unique: true });
export default model<IUser>('User', UserModel);