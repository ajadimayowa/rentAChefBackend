import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export type UserType = 'Admin' | 'Customer' | 'Chef';

export type Gender = 'Male' | 'Female';

export type MaritalStatus =
  | 'Single'
  | 'Married'
  | 'Divorced'
  | 'Widowed';

export type AdminRole = 'super_admin' | 'admin';

/**
 * ============================================================
 * COMMON SUB-INTERFACES
 * ============================================================
 */

export interface IUserAddress {
  homeAddress?: string;
  officeAddress?: string;
  stateId?: string;
  stateName?: string;
  city?: string;
  long?: string;
  lat?: string;
}

export interface IUserKyc {
  idType?: string;
  idNumber?: string;
  idPicture?: string;
  isVerified?: boolean;
}

export interface IUserNok {
  fullName?: string;
  phone?: string;
  relationship?: string;
}

/**
 * ============================================================
 * CHEF INTERFACES
 * ============================================================
 */

export interface IChefAvailability {
  start: Date;
  end: Date;
  isBooked: boolean;
  zone?: string;
}

export interface IChefDetails {
  staffId?: string;
  rating?: number;
  yearsOfExperience?: number;
  specialties?: string[];
  bio?: string;

  chefLevel?: Types.ObjectId;

  chefMenus?: Types.ObjectId[];

  servicesOffered?: Types.ObjectId[];

  availability?: IChefAvailability[];

  isPasswordUpdated?: boolean;

  certifications?: string[];
}

/**
 * ============================================================
 * ADMIN INTERFACE
 * ============================================================
 */

export interface IAdminDetails {
  role?: AdminRole;
}

/**
 * ============================================================
 * CUSTOMER INTERFACE
 * ============================================================
 */

export interface IHealthInformation {
  allergies?: string[];
  healthDetails?: string;
}

export interface ICustomerDetails {
  healthInformation?: IHealthInformation;
}

/**
 * ============================================================
 * USER INTERFACE
 * ============================================================
 */

export interface IUser extends Document {
  /**
   * ----------------------------------------------------------
   * COMMON USER INFORMATION
   * ----------------------------------------------------------
   */

  userType: UserType;

  fullName: string;
  firstName: string;
  email: string;
  phoneNumber?: string;

  gender?: Gender;
  dob?: Date;
  profilePic?: string;

  /**
   * ----------------------------------------------------------
   * COMMON PERSONAL INFORMATION
   * ----------------------------------------------------------
   */

  maritalStatus?: MaritalStatus;
  address?: IUserAddress;
  kyc?: IUserKyc;
  nok?: IUserNok;

  /**
   * ----------------------------------------------------------
   * AUTHENTICATION
   * ----------------------------------------------------------
   */

  password?: string | null;

  loginOtp?: string;
  loginOtpExpires?: Date;

  emailVerificationOtp?: string;
  emailVerificationOtpExpires?: Date;

  /**
   * ----------------------------------------------------------
   * ACCOUNT STATUS
   * ----------------------------------------------------------
   */

  isActive: boolean;
  isEmailVerified: boolean;

  /**
   * ----------------------------------------------------------
   * ROLE-SPECIFIC INFORMATION
   * ----------------------------------------------------------
   */

  adminDetails?: IAdminDetails;
  chefDetails?: IChefDetails;
  customerDetails?: ICustomerDetails;

  /**
   * ----------------------------------------------------------
   * METHODS
   * ----------------------------------------------------------
   */

  comparePassword(password: string): Promise<boolean>;
}

/**
 * ============================================================
 * USER SCHEMA
 * ============================================================
 */

const userSchema = new Schema<IUser>(
  {
    /**
     * ========================================================
     * COMMON USER INFORMATION
     * ========================================================
     */

    userType: {
      type: String,
      enum: ['Admin', 'Customer', 'Chef'],
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ['Male', 'Female'],
    },

    dob: {
      type: Date,
    },

    profilePic: {
      type: String,
      trim: true,
    },

    /**
     * ========================================================
     * COMMON PERSONAL INFORMATION
     * ========================================================
     */

    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed'],
    },

    address: {
      homeAddress: {
        type: String,
        trim: true,
      },

      officeAddress: {
        type: String,
        trim: true,
      },

      stateId: {
        type: String,
        trim: true,
      },

      stateName: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      long: {
        type: String,
        trim: true,
      },

      lat: {
        type: String,
        trim: true,
      },
    },

    kyc: {
      idType: {
        type: String,
        trim: true,
      },

      idNumber: {
        type: String,
        trim: true,
      },

      idPicture: {
        type: String,
        trim: true,
      },

      isVerified: {
        type: Boolean,
        default: false,
      },
    },

    nok: {
      fullName: {
        type: String,
        trim: true,
      },

      phone: {
        type: String,
        trim: true,
      },

      relationship: {
        type: String,
        trim: true,
      },
    },

    /**
     * ========================================================
     * AUTHENTICATION
     * ========================================================
     */

    password: {
      type: String,
      default: null,
      select: false,
    },

    loginOtp: {
      type: String,
      select: false,
    },

    loginOtpExpires: {
      type: Date,
      select: false,
    },

    emailVerificationOtp: {
      type: String,
      select: false,
    },

    emailVerificationOtpExpires: {
      type: Date,
      select: false,
    },

    /**
     * ========================================================
     * ACCOUNT STATUS
     * ========================================================
     */

    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * ========================================================
     * ADMIN DETAILS
     * ========================================================
     */

    adminDetails: {
      role: {
        type: String,
        enum: ['super_admin', 'admin'],
      },
    },

    /**
     * ========================================================
     * CHEF DETAILS
     * ========================================================
     */

    chefDetails: {
      staffId: {
        type: String,
        trim: true,
      },

      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      yearsOfExperience: {
        type: Number,
        default: 0,
        min: 0,
      },

      specialties: {
        type: [String],
        default: [],
      },

      bio: {
        type: String,
        trim: true,
      },

      chefLevel: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },

      chefMenus: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Menu',
        },
      ],

      servicesOffered: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Service',
        },
      ],

      availability: [
        {
          start: {
            type: Date,
            required: true,
            index: true,
          },

          end: {
            type: Date,
            required: true,
            index: true,
          },

          isBooked: {
            type: Boolean,
            default: false,
            index: true,
          },

          zone: {
            type: String,
            trim: true,
          },
        },
      ],

      isPasswordUpdated: {
        type: Boolean,
        default: false,
      },

      certifications: {
        type: [String],
        default: [],
      },
    },

    /**
     * ========================================================
     * CUSTOMER DETAILS
     * ========================================================
     */

    customerDetails: {
      healthInformation: {
        allergies: {
          type: [String],
          default: [],
        },

        healthDetails: {
          type: String,
          trim: true,
        },
      },
    },
  },

  /**
   * ==========================================================
   * SCHEMA OPTIONS
   * ==========================================================
   */

  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      versionKey: false,

      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();

        delete ret._id;
        delete ret.password;
        delete ret.loginOtp;
        delete ret.loginOtpExpires;
        delete ret.emailVerificationOtp;
        delete ret.emailVerificationOtpExpires;

        return ret;
      },
    },
  },
);

/**
 * ============================================================
 * INDEXES
 * ============================================================
 */

/**
 * Active chefs by chef level
 */
userSchema.index({
  'chefDetails.chefLevel': 1,
  isActive: 1,
});

/**
 * Chefs by service and chef level
 */
userSchema.index({
  'chefDetails.servicesOffered': 1,
  'chefDetails.chefLevel': 1,
});

/**
 * Find chef by staff ID
 */
userSchema.index({
  'chefDetails.staffId': 1,
});

/**
 * Find active users by type
 */
userSchema.index({
  userType: 1,
  isActive: 1,
});

/**
 * ============================================================
 * PASSWORD HASHING
 * ============================================================
 */

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);

  next();
});

/**
 * ============================================================
 * PASSWORD COMPARISON
 * ============================================================
 */

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(password, this.password);
};

/**
 * ============================================================
 * MODEL
 * ============================================================
 */

const User = model<IUser>('User', userSchema);

export default User;