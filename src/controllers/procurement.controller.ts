import { Request, Response } from 'express';
import Procurement from '../models/Procurement';
import axios from 'axios';
import { Types } from 'mongoose';
import { Booking } from '../models/Booking';
import Notification from '../models/Notification';

export const createProcurement = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId, items, isProcurementPaid, paymentChannel, paymentReference } = req.body;

    if (!bookingId || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'bookingId and items are required' });
    }

    // ensure booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const createPayload: any = { bookingId, items };
    if (typeof isProcurementPaid === 'boolean') createPayload.isProcurementPaid = isProcurementPaid;
    if (paymentChannel) createPayload.paymentChannel = paymentChannel;
    if (paymentReference) createPayload.paymentReference = paymentReference;

    const procurement = await Procurement.create(createPayload);

    // attach procurement to booking
    booking.procurementId = procurement._id as any;
    await booking.save();

    // Notify customer that procurement has been added to their booking
    try {
      await Notification.create({
        userId: booking.clientId,
        type: 'procurement-update',
        title: 'Procurement added to booking',
        message: `Additional procurement items were added to your booking. Total: ${procurement.totalCost}`,
      });
    } catch (err) {
      console.error('Failed to create notification for procurement creation', err);
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
    const booking = await Booking.findById(procurement.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Associated booking not found' });
    if (String(booking.clientId) !== String(user._id)) return res.status(403).json({ success: false, message: 'Not allowed to pay this procurement' });

    // reuse existing mark logic for paystack or transfer
    if (paymentChannel === 'transfer') {
      // user cannot mark transfer as paid
      return res.status(403).json({ success: false, message: 'Transfer marking must be performed by admin' });
    }

    if (paymentChannel === 'paystack') {
      const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET_KEY) return res.status(500).json({ success: false, message: 'Paystack not configured' });

      try {
        const verifyUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;
        const response = await axios.get(verifyUrl, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
        const data = response.data && response.data.data;
        if (!data || data.status !== 'success') return res.status(400).json({ success: false, message: 'Paystack verification failed' });

        const paidAmount = Number(data.amount) / 100;
        if (typeof procurement.totalCost === 'number' && paidAmount < procurement.totalCost) {
          procurement.paymentChannel = paymentChannel;
          procurement.paymentReference = paymentReference;
          procurement.isProcurementPaid = true;
          await procurement.save();
          return res.status(400).json({ success: false, message: 'Payment amount less than procurement total' });
        }

        procurement.isProcurementPaid = true;
        procurement.paymentChannel = paymentChannel;
        procurement.paymentReference = paymentReference;
        await procurement.save();

        // notify chef that procurement has been paid
        try {
          if (booking.chefId) {
            await Notification.create({
              userId: booking.chefId,
              type: 'payment-receipt',
              title: 'Procurement paid',
              message: `Procurement for booking ${booking._id} has been paid by the customer.`,
            });
          }
        } catch (err) {
          console.error('Failed to send notification on procurement paid', err);
        }

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
      if (!requester || !requester.isAdmin) {
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

export const deleteProcurement = async (req: Request, res: Response): Promise<any> => {
  try {
    const procurement = await Procurement.findByIdAndDelete(req.params.id);
    if (!procurement) return res.status(404).json({ success: false, message: 'Procurement not found' });

    // unlink from booking if attached
    try {
      const booking = await Booking.findById(procurement.bookingId);
      if (booking && String(booking.procurementId) === String(procurement._id)) {
        booking.procurementId = undefined as any;
        await booking.save();
      }
    } catch (err) {
      // ignore
    }

    return res.json({ success: true, message: 'Procurement deleted' });
  } catch (error: any) {
    console.error('deleteProcurement error', error);
    return res.status(500).json({ success: false, message: 'Failed to delete procurement', error: error.message });
  }
};
