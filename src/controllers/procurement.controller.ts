import { Request, Response } from 'express';
import Procurement from '../models/Procurement';
import axios from 'axios';
import { Types } from 'mongoose';
import { BookingModel } from '../models/Booking';
import { notifyUser } from '../services/userNotifications';
import { notifyAdmins } from '../services/adminNotifications';
import User from '../models/User.model';
import { sendBookingNotificationEmail } from '../services/email/rentAChef/bookingEmailNotifications';

const firstNameOf = (fullName?: string) => (fullName || 'there').trim().split(' ')[0];

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/**
 * POST /procurement/create (admin, multipart/form-data)
 *   bookingId   — the booking the procurement belongs to
 *   totalAmount — what the client must pay, in Naira
 *   procurementPdf — the procurement document (PDF, uploaded to S3 by multer)
 * The client is notified (in-app + email) so they can view the PDF and pay.
 */
export const createProcurement = async (req: Request, res: Response): Promise<any> => {
  try {
    const file = (req as any).file as { location?: string; originalname?: string } | undefined;
    const { bookingId } = req.body;
    const rawAmount = String(req.body.totalAmount ?? '').trim();
    const totalAmount = Number(rawAmount);

    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'A valid bookingId is required' });
    }
    if (!file?.location) {
      return res.status(400).json({ success: false, message: 'Upload the procurement PDF' });
    }
    if (!/^\d+(\.\d{1,2})?$/.test(rawAmount) || !(totalAmount > 0)) {
      return res.status(400).json({ success: false, message: 'Enter a valid total amount' });
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const procurement = await Procurement.create({
      bookingId,
      items: [],
      totalCost: totalAmount,
      documentUrl: file.location,
      documentName: file.originalname,
      createdBy: (req as any).user?._id,
    });

    // The procurement is saved — notification/email problems must not fail the request.
    if (booking.customerId) {
      void notifyUser({
        userId: booking.customerId as any,
        type: 'procurement-update',
        title: 'Procurement added to your booking',
        message: `A procurement of ${formatNaira(totalAmount)} was added to booking ${booking.bookingNumber}. View the document and make payment.`,
        link: `/client/bookings/${booking._id}`,
        resourceId: String(booking._id),
        metadata: { bookingId: String(booking._id), procurementId: String(procurement._id) },
      });

      try {
        const customer = await User.findById(booking.customerId).select('fullName email');
        if (customer?.email) {
          await sendBookingNotificationEmail({
            firstName: firstNameOf(customer.fullName),
            email: customer.email,
            heading: 'Procurement added to your booking',
            message: `A procurement of ${formatNaira(totalAmount)} has been added to your booking. Log in to view the procurement document and make payment.`,
            bookingNumber: booking.bookingNumber,
          });
        }
      } catch (err) {
        console.error('createProcurement: customer email failed', err);
      }
    }

    return res.status(201).json({ success: true, payload: procurement });
  } catch (error: any) {
    console.error('createProcurement error', error);
    return res.status(500).json({ success: false, message: 'Failed to create procurement', error: error.message });
  }
};

/**
 * Allow booking customer to pay procurement via paystack and mark as paid
 */
export const userPayProcurement = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { paymentChannel, paymentReference } = req.body;
    if (!paymentChannel || !paymentReference) return res.status(400).json({ success: false, message: 'paymentChannel and paymentReference required' });

    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) return res.status(404).json({ success: false, message: 'Procurement not found' });

    // ensure procurement belongs to a booking owned by user
    const booking = await BookingModel.findById(procurement.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Associated booking not found' });
    if (String(booking.customerId) !== String(user._id)) return res.status(403).json({ success: false, message: 'Not allowed to pay this procurement' });

    // reuse existing mark logic for paystack or transfer
    if (paymentChannel === 'transfer') {
      // user cannot mark transfer as paid
      return res.status(403).json({ success: false, message: 'Transfer marking must be performed by admin' });
    }

    if (procurement.isProcurementPaid) {
      return res.status(409).json({ success: false, message: 'This procurement has already been paid' });
    }

    if (paymentChannel === 'paystack') {
      const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET_KEY) return res.status(500).json({ success: false, message: 'Paystack not configured' });

      // A Paystack reference can only settle one procurement.
      const reused = await Procurement.exists({ _id: { $ne: procurement._id }, paymentReference });
      if (reused) return res.status(409).json({ success: false, message: 'This payment reference has already been used' });

      try {
        const verifyUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;
        const response = await axios.get(verifyUrl, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
        const data = response.data && response.data.data;
        if (!data || data.status !== 'success') return res.status(400).json({ success: false, message: 'Paystack verification failed' });

        const paidAmount = Number(data.amount) / 100;
        if (typeof procurement.totalCost === 'number' && paidAmount < procurement.totalCost) {
          // Record the attempt but leave it unpaid — an underpayment must not settle it.
          procurement.paymentChannel = paymentChannel;
          procurement.paymentReference = paymentReference;
          await procurement.save();
          return res.status(400).json({ success: false, message: 'Payment amount less than procurement total' });
        }

        procurement.isProcurementPaid = true;
        procurement.paymentChannel = paymentChannel;
        procurement.paymentReference = paymentReference;
        await procurement.save();

        if (booking.chefId) {
          void notifyUser({
            userId: booking.chefId as any,
            type: 'payment-receipt',
            title: 'Procurement paid',
            message: `The client paid the procurement for booking ${booking.bookingNumber}.`,
            link: `/chef/bookings/${booking._id}`,
            metadata: { bookingId: String(booking._id), procurementId: String(procurement._id) },
          });
        }
        void notifyAdmins({
          type: 'payment-confirmed',
          title: 'Procurement paid',
          message: `${formatNaira(procurement.totalCost)} procurement paid for booking ${booking.bookingNumber}.`,
          link: `/admin/bookings/${booking._id}`,
        });

        return res.json({ success: true, message: 'Procurement marked as paid', payload: procurement });
      } catch (err: any) {
        console.error('Paystack verification error', err?.response?.data || err.message || err);
        return res.status(500).json({ success: false, message: 'Error verifying Paystack payment' });
      }
    }

    return res.status(400).json({ success: false, message: 'Unsupported payment channel' });
  } catch (error: any) {
    console.error('userPayProcurement error', error);
    return res.status(500).json({ success: false, message: 'Failed to process procurement payment', error: error.message });
  }
};

export const getProcurements = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId } = req.query;
    const query: any = {};
    if (bookingId) query.bookingId = bookingId;

    const items = await Procurement.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, payload: items });
  } catch (error: any) {
    console.error('getProcurements error', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch procurements', error: error.message });
  }
};

export const getProcurement = async (req: Request, res: Response): Promise<any> => {
  try {
    const item = await Procurement.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Procurement not found' });
    return res.json({ success: true, payload: item });
  } catch (error: any) {
    console.error('getProcurement error', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch procurement', error: error.message });
  }
};

export const updateProcurement = async (req: Request, res: Response): Promise<any> => {
  try {
    const { items, isProcurementPaid, paymentChannel, paymentReference } = req.body;
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) return res.status(404).json({ success: false, message: 'Procurement not found' });

    if (items) procurement.items = items;
    if (typeof isProcurementPaid === 'boolean') procurement.isProcurementPaid = isProcurementPaid;
    if (paymentChannel) procurement.paymentChannel = paymentChannel;
    if (paymentReference) procurement.paymentReference = paymentReference;

    await procurement.save(); // pre-save will recalc totalCost

    return res.json({ success: true, message: 'Procurement updated', payload: procurement });
  } catch (error: any) {
    console.error('updateProcurement error', error);
    return res.status(500).json({ success: false, message: 'Failed to update procurement', error: error.message });
  }
};

export const markProcurementPaid = async (req: Request, res: Response): Promise<any> => {
  try {
    const { paymentChannel, paymentReference } = req.body;
    if (!paymentChannel || !paymentReference) {
      return res.status(400).json({ success: false, message: 'paymentChannel and paymentReference are required' });
    }

    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) return res.status(404).json({ success: false, message: 'Procurement not found' });
    // If channel is transfer, only admins should be allowed to mark paid.
    const requester: any = (req as any).user;
    if (paymentChannel === 'transfer') {
      if (!requester || requester.userType !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Only admins can mark transfer payments as paid' });
      }

      procurement.isProcurementPaid = true;
      procurement.paymentChannel = paymentChannel;
      procurement.paymentReference = paymentReference;
      await procurement.save();

      return res.json({ success: true, message: 'Procurement marked as paid (transfer)', payload: procurement });
    }

    // For paystack, verify the transaction with Paystack API before marking paid
    if (paymentChannel === 'paystack') {
      const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET_KEY) {
        return res.status(500).json({ success: false, message: 'Paystack secret key not configured' });
      }

      try {
        const verifyUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;
        const response = await axios.get(verifyUrl, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });

        const data = response.data && response.data.data;
        if (!data || data.status !== 'success') {
          return res.status(400).json({ success: false, message: 'Paystack verification failed' });
        }

        // Optionally check amount: Paystack returns amount in kobo (NGN) or smallest currency unit
        const paidAmount = Number(data.amount) / 100; // convert kobo to Naira
        // If procurement.totalCost is set, ensure paid amount >= totalCost
        if (typeof procurement.totalCost === 'number' && paidAmount < procurement.totalCost) {
          // still save payment info but indicate mismatch
          procurement.paymentChannel = paymentChannel;
          procurement.paymentReference = paymentReference;
          await procurement.save();
          return res.status(400).json({ success: false, message: 'Payment amount is less than procurement total' });
        }

        // Mark as paid
        procurement.isProcurementPaid = true;
        procurement.paymentChannel = paymentChannel;
        procurement.paymentReference = paymentReference;
        await procurement.save();

        return res.json({ success: true, message: 'Procurement marked as paid (paystack)', payload: procurement });
      } catch (err: any) {
        console.error('Paystack verification error', err?.response?.data || err.message || err);
        return res.status(500).json({ success: false, message: 'Error verifying Paystack payment' });
      }
    }

    return res.status(400).json({ success: false, message: 'Unsupported payment channel' });
  } catch (error: any) {
    console.error('markProcurementPaid error', error);
    return res.status(500).json({ success: false, message: 'Failed to mark procurement as paid', error: error.message });
  }
};

/** DELETE /procurement/:id (admin) — only while the procurement is still unpaid. */
export const deleteProcurement = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid procurement id' });
    }
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) return res.status(404).json({ success: false, message: 'Procurement not found' });
    if (procurement.isProcurementPaid) {
      return res.status(409).json({ success: false, message: 'A paid procurement cannot be deleted' });
    }

    // Conditional delete so a payment landing at the same moment can't be lost.
    const deleted = await Procurement.findOneAndDelete({ _id: procurement._id, isProcurementPaid: { $ne: true } });
    if (!deleted) {
      return res.status(409).json({ success: false, message: 'A paid procurement cannot be deleted' });
    }

    return res.json({ success: true, message: 'Procurement deleted' });
  } catch (error: any) {
    console.error('deleteProcurement error', error);
    return res.status(500).json({ success: false, message: 'Failed to delete procurement', error: error.message });
  }
};

/**
 * POST /procurements/pay (booking customer)
 *   { bookingId, procurementIds, paymentReference }
 * One Paystack payment settles every listed unpaid procurement on the booking —
 * the client pays the outstanding procurement total in one go. The ids are the
 * ones the client saw when starting checkout, so a procurement the admin adds
 * meanwhile isn't silently included or left short.
 */
export const payOutstandingProcurements = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    const { bookingId, procurementIds, paymentReference } = req.body ?? {};

    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'A valid bookingId is required' });
    }
    if (!Array.isArray(procurementIds) || procurementIds.length === 0 || !procurementIds.every((id) => Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'procurementIds are required' });
    }
    if (!paymentReference || typeof paymentReference !== 'string') {
      return res.status(400).json({ success: false, message: 'paymentReference is required' });
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (String(booking.customerId) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'Not allowed to pay for this booking' });
    }

    const ids = [...new Set(procurementIds.map(String))];
    const procurements = await Procurement.find({ _id: { $in: ids }, bookingId: booking._id });
    if (procurements.length !== ids.length) {
      return res.status(404).json({ success: false, message: 'Some of these procurements no longer exist' });
    }
    const unpaid = procurements.filter((p) => !p.isProcurementPaid);
    if (unpaid.length === 0) {
      return res.status(409).json({ success: false, message: 'These procurements have already been paid' });
    }

    const reused = await Procurement.exists({ _id: { $nin: ids }, paymentReference });
    if (reused) return res.status(409).json({ success: false, message: 'This payment reference has already been used' });

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) return res.status(500).json({ success: false, message: 'Paystack not configured' });

    let paidAmount = 0;
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const data = response.data?.data;
      if (!data || data.status !== 'success') {
        return res.status(400).json({ success: false, message: 'Paystack verification failed' });
      }
      paidAmount = Number(data.amount) / 100;
    } catch (err: any) {
      console.error('Paystack verification error', err?.response?.data || err.message || err);
      return res.status(500).json({ success: false, message: 'Error verifying Paystack payment' });
    }

    const outstanding = unpaid.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
    // Small tolerance for kobo rounding.
    if (paidAmount + 0.005 < outstanding) {
      return res.status(400).json({ success: false, message: 'Payment amount is less than the outstanding procurement total' });
    }

    await Procurement.updateMany(
      { _id: { $in: unpaid.map((p) => p._id) }, isProcurementPaid: { $ne: true } },
      { $set: { isProcurementPaid: true, paymentChannel: 'paystack', paymentReference } }
    );
    const updated = await Procurement.find({ bookingId: booking._id }).sort({ createdAt: -1 });

    if (booking.chefId) {
      void notifyUser({
        userId: booking.chefId as any,
        type: 'payment-receipt',
        title: 'Procurement paid',
        message: `The client paid ${formatNaira(outstanding)} procurement for booking ${booking.bookingNumber}.`,
        link: `/chef/bookings/${booking._id}`,
        metadata: { bookingId: String(booking._id) },
      });
    }
    void notifyAdmins({
      type: 'payment-confirmed',
      title: 'Procurement paid',
      message: `${formatNaira(outstanding)} procurement paid for booking ${booking.bookingNumber}.`,
      link: `/admin/bookings/${booking._id}`,
    });

    return res.json({ success: true, message: 'Procurement paid', payload: updated });
  } catch (error: any) {
    console.error('payOutstandingProcurements error', error);
    return res.status(500).json({ success: false, message: 'Failed to process procurement payment', error: error.message });
  }
};
