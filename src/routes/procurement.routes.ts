import { Router } from 'express';
import {
  createProcurement,
  getProcurements,
  getProcurement,
  updateProcurement,
  deleteProcurement,
  markProcurementPaid,
  userPayProcurement,
  payOutstandingProcurements,
} from '../controllers/procurement.controller';
import { verifyUserToken } from '../middleware/auth.middleware';
import { chefOrAdmin } from '../middleware/chefOrAdmin.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { adminOrBookingChef } from '../middleware/adminOrBookingChef.middleware';
import { requireAdminAuth } from '../middleware/auth/adminAuth.middleware';
import { uploadProcurementPdf, PROCUREMENT_PDF_MAX_BYTES } from '../middleware/upload';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

/** Runs the PDF upload and turns multer errors (too big, not a PDF) into 400s. */
const procurementPdfUpload = (req: Request, res: Response, next: NextFunction) =>
  uploadProcurementPdf.single('procurementPdf')(req, res, (err: any) => {
    if (!err) return next();
    const message =
      err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? `The PDF must be ${PROCUREMENT_PDF_MAX_BYTES / (1024 * 1024)} MB or smaller`
        : err.message || 'Could not upload the PDF';
    return res.status(400).json({ success: false, message });
  });

const router = Router();

// Admins / super admins only: procurement PDF + total amount.
router.post('/procurement/create', requireAdminAuth, procurementPdfUpload, createProcurement);
router.get('/procurements', chefOrAdmin, getProcurements);
router.get('/procurement/:id', chefOrAdmin, getProcurement);
// Admins or the chef who owns the booking can update/delete/mark-paid procurements
router.put('/procurement/:id', adminOrBookingChef, updateProcurement);
router.put('/procurement/:id/mark-paid',markProcurementPaid);
// Allow booking customer to pay procurement using paystack
router.post('/procurement/:id/pay', verifyUserToken, userPayProcurement);
// Customer pays the outstanding total (all unpaid procurements on the booking) in one payment.
router.post('/procurements/pay', verifyUserToken, payOutstandingProcurements);
// Admins / super admins only, and only while unpaid (checked in the controller).
router.delete('/procurement/:id', requireAdminAuth, deleteProcurement);

export default router;
