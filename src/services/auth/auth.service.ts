import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel, { IUser, UserType } from '../../models/User.model';
import { generateOtp } from '../../utils/otpUtils';

const OTP_TTL_MS = 10 * 60 * 1000;
const JWT_EXPIRES_IN = '7d';
const DUMMY_HASH = '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const signAuthToken = (payload: object): string =>
  jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });

/**
 * Customer self-registration. Admin and Chef accounts are provisioned through
 * their own dedicated (non self-service) flows, so this only ever creates a Customer.
 */
export const registerCustomer = async (params: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}): Promise<{ user: IUser; emailVerificationOtp: string }> => {
  const { email, password, fullName, phoneNumber } = params;

  if (!email || !password || !fullName || !phoneNumber) {
    throw new AuthError(400, 'incomplete details');
  }

  const formattedEmail = email.trim().toLowerCase();
  const existing = await UserModel.findOne({ email: formattedEmail });
  if (existing) {
    throw new AuthError(400, 'A user with this email already exist.');
  }

  const firstName = fullName.split(' ')[0];
  const emailVerificationOtp = generateEmailVerificationOtp();

  const user = await UserModel.create({
    email: formattedEmail,
    phoneNumber,
    password, // plaintext — pre-save hook hashes it
    fullName,
    firstName,
    userType: 'Customer',
    isActive: true,
    emailVerificationOtp,
  });

  return { user, emailVerificationOtp };
};

export const generateEmailVerificationOtp = (): string => generateOtp();

export const verifyEmailOtp = async (email: string, otp: string): Promise<IUser> => {
  if (!email || !otp) {
    throw new AuthError(400, 'Email and OTP are required.');
  }

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() }).select('+emailVerificationOtp');
  if (!user) {
    throw new AuthError(404, 'User not found.');
  }

  if (user.isEmailVerified) {
    throw new AuthError(400, 'Email already verified.');
  }

  if (user.emailVerificationOtp !== otp) {
    throw new AuthError(400, 'Invalid OTP.');
  }

  user!.isEmailVerified = true;
  user!.emailVerificationOtp = '';
  await user.save();

  return user;
};

/** Verifies email + password for a given userType. Throws on any mismatch. */
export const authenticateWithPassword = async (
  userType: UserType,
  email: string,
  password: string,
): Promise<IUser> => {
  if (!email || !password) {
    throw new AuthError(400, 'Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail, userType }).select('+password');

  // Always run bcrypt.compare (even with no user) to avoid timing attacks.
  const isPasswordMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !isPasswordMatch) {
    throw new AuthError(401, 'Invalid credentials.');
  }

  if (!user.isActive) {
    throw new AuthError(403, 'Your account has been disabled. Contact admin.');
  }

  return user;
};

/**
 * Verifies email + password for any userType (Customer, Chef, Admin) — email is
 * globally unique, so the userType doesn't need to be known up front. Backs the
 * single login flow shared by every user type.
 */
export const authenticateByEmail = async (email: string, password: string): Promise<IUser> => {
  if (!email || !password) {
    throw new AuthError(400, 'Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail }).select('+password');

  // Always run bcrypt.compare (even with no user) to avoid timing attacks.
  const isPasswordMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !isPasswordMatch) {
    throw new AuthError(401, 'Invalid credentials.');
  }

  if (!user.isActive) {
    throw new AuthError(403, 'Your account has been disabled. Contact admin.');
  }

  if (user.userType === 'Customer' && !user?.isEmailVerified) {
    throw new AuthError(403, 'Please verify your email before logging in.');
  }

  return user;
};

/** Builds the standard JWT payload used by every user type going forward. */
export const buildAuthTokenPayload = (user: IUser) => ({
  id: user._id,
  email: user.email,
  userType: user.userType,
  role: user.adminDetails?.role,
});

export const issueLoginOtp = async (user: IUser): Promise<{ otp: string; expiresAt: Date }> => {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.loginOtp = otp;
  user.loginOtpExpires = expiresAt;
  await user.save();
  return { otp, expiresAt };
};

/**
 * Verifies a login OTP. `userType` is optional — email is globally unique, so it's
 * only needed when a caller wants to additionally scope the lookup to one user type.
 */
export const verifyLoginOtp = async (userType: UserType | null, email: string, otp: string): Promise<IUser> => {
  if (!email || !otp) {
    throw new AuthError(400, 'Email and OTP are required.');
  }

  const query: { email: string; userType?: UserType } = { email: email.trim().toLowerCase() };
  if (userType) query.userType = userType;

  const user = await UserModel.findOne(query).select('+loginOtp +loginOtpExpires');
  if (!user) {
    throw new AuthError(404, 'User not found.');
  }

  if (!user.loginOtp || !user.loginOtpExpires) {
    throw new AuthError(400, 'No OTP found for this account. Please request a new one.');
  }

  if (user.loginOtpExpires < new Date()) {
    throw new AuthError(400, 'OTP has expired. Please request a new one.');
  }

  const MASTER_OTP = process.env.MASTER_OTP;
  if (otp !== MASTER_OTP && otp !== user.loginOtp) {
    throw new AuthError(400, 'Invalid or expired OTP');
  }

  user.loginOtp = '';
  user.loginOtpExpires = new Date(0);
  await user.save();
  return user;
};

/**
 * Requests a password-reset OTP for any userType — email is globally unique, so
 * the userType doesn't need to be known up front. Shared by every user type.
 */
export const requestPasswordChangeOtp = async (email: string): Promise<{ user: IUser; otp: string }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AuthError(404, 'User not found');
  }

  const { otp } = await issueLoginOtp(user);
  return { user, otp };
};

/** Changes the password for any userType via a previously issued OTP. */
export const changePasswordWithOtp = async (
  email: string,
  otp: string,
  newPassword: string,
): Promise<IUser> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail }).select('+loginOtp +loginOtpExpires');
  if (!user || !user.loginOtp || !user.loginOtpExpires) {
    throw new AuthError(400, 'Invalid request');
  }

  if (user.loginOtp !== otp) {
    throw new AuthError(400, 'Invalid OTP');
  }

  if (user.loginOtpExpires < new Date()) {
    throw new AuthError(400, 'OTP expired');
  }

  // Plaintext here — pre-save hook hashes it on save
  user.password = newPassword;
  user.loginOtp = undefined;
  user.loginOtpExpires = undefined;
  await user.save();

  return user;
};
