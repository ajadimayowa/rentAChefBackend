import { AdminNotification, AdminNotificationType } from "../models/AdminNotification";

interface NotifyAdminsInput {
  type: AdminNotificationType;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Posts to the admin portal's notification feed. Never throws — a failed
 * notification must not fail the booking/sign-up/payment that triggered it.
 */
export async function notifyAdmins(input: NotifyAdminsInput): Promise<void> {
  try {
    await AdminNotification.create({ ...input, message: input.message ?? "" });
  } catch (error) {
    console.error("notifyAdmins failed:", error);
  }
}
