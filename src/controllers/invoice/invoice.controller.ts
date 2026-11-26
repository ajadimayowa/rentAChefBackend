import { Request, Response } from "express";
import { sendInvoiceEmail } from "../../services/email/rentAChef/invoiceEmail";

const MAX_ROWS = 30;
const MAX_TEXT = 300;
const COOLDOWN_MS = 60_000;

/** One invoice email per customer per minute, so the button can't be used to spam an inbox. */
const lastSentAt = new Map<string, number>();

const text = (value: unknown): string => String(value ?? "").trim().slice(0, MAX_TEXT);

const naira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

const invoiceNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

/**
 * POST /bookings/invoice — emails the signed-in customer an invoice for the booking
 * they're reviewing (before payment). Sent to their registered email only.
 * Body: { serviceName, details: [{label, value}], lines: [{label, hint?, amount}], total }
 */
export const sendBookingInvoice = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    if (!user?.email) {
      return res.status(400).json({ success: false, message: "There's no email address on your account." });
    }

    const userId = String(user._id);
    const last = lastSentAt.get(userId) ?? 0;
    if (Date.now() - last < COOLDOWN_MS) {
      return res.status(429).json({ success: false, message: "An invoice was just sent. Please wait a minute before requesting another." });
    }

    const body = req.body ?? {};
    const serviceName = text(body.serviceName) || "Your booking";
    const rawDetails: any[] = Array.isArray(body.details) ? body.details : [];
    const rawLines: any[] = Array.isArray(body.lines) ? body.lines : [];

    if (rawLines.length === 0 || rawLines.length > MAX_ROWS || rawDetails.length > MAX_ROWS) {
      return res.status(400).json({ success: false, message: "The invoice has no prices to send." });
    }

    const lines = [];
    let sum = 0;
    for (const line of rawLines) {
      const amount = Number(line?.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ success: false, message: "Every price on the invoice must be a valid amount." });
      }
      sum += amount;
      lines.push({ label: text(line?.label) || "Item", hint: text(line?.hint) || undefined, amount: naira(amount) });
    }

    const total = Number(body.total);
    if (!Number.isFinite(total) || Math.abs(total - sum) > 0.01) {
      return res.status(400).json({ success: false, message: "The invoice total doesn't match its prices. Please go back and try again." });
    }

    const details = rawDetails
      .map((d) => ({ label: text(d?.label), value: text(d?.value) || "—" }))
      .filter((d) => d.label);

    const number = invoiceNumber();
    await sendInvoiceEmail({
      email: user.email,
      firstName: text(user.fullName).split(" ")[0] || "there",
      invoiceNumber: number,
      issuedOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      serviceName,
      details,
      lines,
      total: naira(total),
    });

    lastSentAt.set(userId, Date.now());
    return res.status(200).json({ success: true, message: "Invoice sent", payload: { invoiceNumber: number } });
  } catch (error) {
    console.error("sendBookingInvoice error:", error);
    return res.status(502).json({ success: false, message: "We couldn't send the invoice right now. Please try again." });
  }
};
