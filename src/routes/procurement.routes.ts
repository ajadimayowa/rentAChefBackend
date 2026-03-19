import { Router } from 'express';
import {
  createProcurement,
  getProcurements,
  getProcurement,
  updateProcurement,
  deleteProcurement,
  markProcurementPaid,
} from '../controllers/procurement.controller';
import { verifyUserToken } from '../middleware/auth.middleware';
import { chefOrAdmin } from '../middleware/chefOrAdmin.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { adminOrBookingChef } from '../middleware/adminOrBookingChef.middleware';

const router = Router();

router.post('/procurement/create',createProcurement);
router.get('/procurements', chefOrAdmin, getProcurements);
router.get('/procurement/:id', chefOrAdmin, getProcurement);
// Admins or the chef who owns the booking can update/delete/mark-paid procurements
router.put('/procurement/:id', adminOrBookingChef, updateProcurement);
router.put('/procurement/:id/mark-paid', adminOrBookingChef, markProcurementPaid);
router.delete('/procurement/:id', adminOrBookingChef, deleteProcurement);

export default router;
