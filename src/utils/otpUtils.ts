// utils/otpUtils.ts

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateStaffId = (): string => {
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const number = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

  return `RAC-${month}-${number}`;
};


export const formatNigerianPhoneNumber = (phoneNumber: string): string => {
  // Remove spaces, dashes, brackets, etc.
  let phone = phoneNumber.replace(/\D/g, "");

  // Handle +234 format
  if (phone.startsWith("234")) {
    return `+${phone}`;
  }

  // Handle 0XXXXXXXXXX format
  if (phone.startsWith("0")) {
    return `+234${phone.slice(1)}`;
  }

  // Handle 8XXXXXXXXX, 9XXXXXXXXX, 7XXXXXXXXX format
  if (/^[789]\d{9}$/.test(phone)) {
    return `+234${phone}`;
  }

  // Invalid format
  throw new Error("Invalid Nigerian phone number");
};