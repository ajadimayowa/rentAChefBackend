import { notifyAdmins } from '../services/adminNotifications';
import mongoose from "mongoose";
import { InvoiceModel } from "../models/Invoice";
import Procurement from "../models/Procurement";
import { Request, Response } from 'express';
import axios from 'axios';
import { buildChefPlatformModule } from '../platform/bootstrap';
import { BookingStatus, BookingWorkflow, ChefLevel, ModeOfPayment, PaymentStatus } from '../platform/domain/enums';
import { AssignedBookingNumberModel } from '../models/AssignedBookingNumber';

const moduleRef = buildChefPlatformModule();

const getActorId = (req: Request): string => {
  const maybeUser = (req as any).user;
  if (maybeUser?.id) return String(maybeUser.id);
  if (req.body?.actorId) return String(req.body.actorId);
  return 'SYSTEM';
};

const normalizeOptionalId = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const parsed = String(value).trim();
  if (!parsed || parsed.toLowerCase() === 'undefined' || parsed.toLowerCase() === 'null') {
    return undefined;
  }
  return parsed;
};

const isValidPaystackTransaction = async (reference: string): Promise<boolean> => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return false;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    return response.data?.status === true && response.data?.data?.status === 'success';
  } catch {
    return false;
  }
};

const attachAssignedBookingNumberToBooking = async (params: {
  assignedBookingNumberId?: string;
  serviceId?: string;
  customerId: string;
  bookingId: string;
}) => {
  const { assignedBookingNumberId, serviceId, customerId, bookingId } = params;

  if (assignedBookingNumberId) {
    const byId = await AssignedBookingNumberModel.findById(assignedBookingNumberId);
    if (byId) {
      byId.bookingId = bookingId as any;
      await byId.save();
      return;
    }
  }

  if (!serviceId) return;

  const latestUnassigned = await AssignedBookingNumberModel.findOne({
    serviceId,
    customerId,
    bookingId: { $in: [null, undefined] },
  }).sort({ assignedNumber: -1, createdAt: -1 });

  if (!latestUnassigned) return;

  latestUnassigned.bookingId = bookingId as any;
  await latestUnassigned.save();
};

export const getWorkflowDefinitions = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: moduleRef.workflowRegistry.list().map((item) => ({
      code: item.code,
      displayName: item.displayName,
      screenName: item.screenName,
      supportsMenuSelection: item.supportsMenuSelection,
      supportsProcurement: item.supportsProcurement,
    })),
  });
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {

  try {
    const actorId = getActorId(req);
    const serviceId = normalizeOptionalId(req.body.serviceId);
    const specialServiceId = normalizeOptionalId(req.body.specialServiceId ?? req.body.specialMenuId);
    const assignedBookingNumberId = normalizeOptionalId(req.body.assignedBookingNumberId);

    if (!serviceId && !specialServiceId) {
      res.status(400).json({
        success: false,
        message: 'Either serviceId or specialMenuId/specialServiceId is required',
      });
      return;
    }

    if (serviceId && specialServiceId) {
      res.status(400).json({
        success: false,
        message: 'Provide only one target: serviceId or specialMenuId/specialServiceId',
      });
      return;
    }

    const transactnRef = normalizeOptionalId(req.body.transactnRef);
    const hasTransactionRef = Boolean(transactnRef);
    const isVerifiedPayment = transactnRef ? await isValidPaystackTransaction(transactnRef) : false;

    const booking = await moduleRef.customerBookingService.createBooking(
      {
        customerId: String(req.body.customerId),
        serviceId,
        specialServiceId,
        workflow: String(req.body.workflow) as BookingWorkflow,
        paymentStatus: isVerifiedPayment ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        modeOfPayment: hasTransactionRef ? ModeOfPayment.PAYSTACK : ModeOfPayment.UNPAID,
        transactnRef,
        bookingData: req.body.bookingData || {},
      },
      actorId,
    );

    const bookingId = String((booking as any)?.id || (booking as any)?._id || '');
    if (bookingId) {
      await attachAssignedBookingNumberToBooking({
        assignedBookingNumberId,
        serviceId,
        customerId: String(req.body.customerId),
        bookingId,
      });
    }

    if (bookingId) {
      void notifyAdmins({
        type: 'new-booking',
        title: 'New booking',
        message: `A ${String(req.body.workflow || 'service').replace(/_/g, ' ').toLowerCase()} booking was placed${isVerifiedPayment ? ' and paid' : ''}.`,
        link: `/admin/bookings/${bookingId}`,
        metadata: { bookingId },
      });
    }

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedPage = Number(req.query.page);
    const parsedLimit = Number(req.query.limit);

    const rows = await moduleRef.customerBookingService.listBookings({
      customerId: req.query.customerId ? String(req.query.customerId) : undefined,
      workflow: req.query.workflow ? (String(req.query.workflow) as BookingWorkflow) : undefined,
      status: req.query.status ? (String(req.query.status) as BookingStatus) : undefined,
      paymentStatus: req.query.paymentStatus ? (String(req.query.paymentStatus) as PaymentStatus) : undefined,
      bookingNumber: normalizeOptionalId(req.query.bookingNumber),
      search: normalizeOptionalId(req.query.search),
      page: Number.isFinite(parsedPage) ? parsedPage : 1,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 10,
    });

    const items = await withDocumentSummaries(rows.items as any[]);
    res.status(200).json({ success: true, data: items, pagination: rows.pagination });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

interface DocumentSummary {
  count: number;
  paidCount: number;
  /** Naira. */
  total: number;
  outstanding: number;
}

/**
 * Adds `invoiceSummary` and `procurementSummary` to each booking in a list, so
 * booking cards can show whether invoices and procurement are paid. Two grouped
 * queries for the whole page, not one per booking.
 */
const withDocumentSummaries = async (items: any[]): Promise<any[]> => {
  const ids = items.map((b) => b.id ?? b._id).filter((id) => mongoose.Types.ObjectId.isValid(String(id)));
  if (!ids.length) return items;
  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(String(id)));

  const [invoiceGroups, procurementGroups] = await Promise.all([
    InvoiceModel.aggregate([
      { $match: { bookingId: { $in: objectIds } } },
      {
        $group: {
          _id: "$bookingId",
          count: { $sum: 1 },
          paidCount: { $sum: { $cond: [{ $eq: ["$isPaid", true] }, 1, 0] } },
          total: { $sum: "$amount" },
          outstanding: { $sum: { $cond: [{ $eq: ["$isPaid", true] }, 0, "$amount"] } },
        },
      },
    ]),
    Procurement.aggregate([
      { $match: { bookingId: { $in: objectIds } } },
      {
        $group: {
          _id: "$bookingId",
          count: { $sum: 1 },
          paidCount: { $sum: { $cond: [{ $eq: ["$isProcurementPaid", true] }, 1, 0] } },
          total: { $sum: "$totalCost" },
          outstanding: { $sum: { $cond: [{ $eq: ["$isProcurementPaid", true] }, 0, "$totalCost"] } },
        },
      },
    ]),
  ]);

  const toMap = (groups: any[]) =>
    new Map<string, DocumentSummary>(
      groups.map((g) => [String(g._id), { count: g.count, paidCount: g.paidCount, total: g.total, outstanding: g.outstanding }])
    );
  const invoices = toMap(invoiceGroups);
  const procurements = toMap(procurementGroups);

  return items.map((b) => {
    const key = String(b.id ?? b._id);
    return { ...b, invoiceSummary: invoices.get(key) ?? null, procurementSummary: procurements.get(key) ?? null };
  });
};

export const generateQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = getActorId(req);
    const quotation = await moduleRef.adminBookingService.generateQuotation({
      bookingId: String(req.body.bookingId),
      chefFeeMinor: Number(req.body.chefFeeMinor || 0),
      ingredientCostMinor: Number(req.body.ingredientCostMinor || 0),
      procurementFeeMinor: Number(req.body.procurementFeeMinor || 0),
      additionalChargesMinor: Number(req.body.additionalChargesMinor || 0),
      discountMinor: Number(req.body.discountMinor || 0),
      taxMinor: Number(req.body.taxMinor || 0),
      notes: req.body.notes,
      generatedBy: actorId,
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const initializeInstantPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await moduleRef.customerBookingService.initializeInstantPayment({
      bookingId: String(req.body.bookingId),
      customerId: String(req.body.customerId),
      customerEmail: String(req.body.customerEmail),
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const initializeQuotationPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await moduleRef.adminBookingService.initializeQuotationPayment({
      bookingId: String(req.body.bookingId),
      quotationId: String(req.body.quotationId),
      customerId: String(req.body.customerId),
      customerEmail: String(req.body.customerEmail),
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const confirmPaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await moduleRef.adminBookingService.confirmPayment(String(req.params.reference), req.body);
    const paidBookingId = String((payment as any)?.bookingId ?? '');
    // confirmPayment returns null for an unknown reference — nothing was confirmed then.
    if (payment) void notifyAdmins({
      type: 'payment-confirmed',
      title: 'Payment confirmed',
      message: `Payment ${String(req.params.reference)} was confirmed.`,
      link: paidBookingId ? `/admin/bookings/${paidBookingId}` : undefined,
      metadata: { reference: String(req.params.reference), bookingId: paidBookingId || undefined },
    });
    res.status(200).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignChef = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = getActorId(req);
    const result = await moduleRef.adminBookingService.assignChef(String(req.params.bookingId), actorId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createChefMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await moduleRef.menuService.createChefMenu({
      chefId: String(req.body.chefId),
      serviceSubCategoryId: String(req.body.serviceSubCategoryId),
      menuTitle: String(req.body.menuTitle),
      menuDescription: req.body.menuDescription,
      menuItems: Array.isArray(req.body.menuItems) ? req.body.menuItems : [],
      estimatedGuestCount: req.body.estimatedGuestCount,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const registerUploadedMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await moduleRef.menuService.registerUploadedMenu({
      ownerUserId: String(req.body.ownerUserId),
      fileName: String(req.body.fileName),
      mimeType: String(req.body.mimeType),
      extension: String(req.body.extension),
      fileUrl: String(req.body.fileUrl),
      sizeBytes: Number(req.body.sizeBytes),
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
