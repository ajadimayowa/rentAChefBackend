"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * ============================================================
 * USER SCHEMA
 * ============================================================
 */
const userSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Category',
        },
        chefMenus: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Menu',
            },
        ],
        servicesOffered: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
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
        transform: (_doc, ret) => {
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
});
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
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password') || !this.password) {
            return next();
        }
        this.password = yield bcryptjs_1.default.hash(this.password, 10);
        next();
    });
});
/**
 * ============================================================
 * PASSWORD COMPARISON
 * ============================================================
 */
userSchema.methods.comparePassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.password) {
            return false;
        }
        return bcryptjs_1.default.compare(password, this.password);
    });
};
/**
 * ============================================================
 * MODEL
 * ============================================================
 */
const User = (0, mongoose_1.model)('User', userSchema);
exports.default = User;
