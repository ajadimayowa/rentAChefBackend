import express from 'express';
import multer from 'multer';
import { MAX_UPLOAD_LABEL } from './middleware/upload';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';

import stateRoutes from './routes/stateRoutes'
import authRoutes from './routes/auth'
import adminRoutes from './routes/admin.routes'
import chefRoutes from './routes/chef.route'
import categoryRoutes from './routes/category.routes';
import serviceRoutes from './routes/services.routes';
import serviceCategoryRoutes from './routes/serviceCategory.routes';
import chefServiceRoutes from './routes/chefService.routes';
import servicePricingRoutes from './routes/servicepricing.route';
import userRoutes from './routes/user.routes'
import menuRoutes from './routes/menu.routes';
import paymentRoutes from './routes/payment.routes';
import specialMenuRoutes from './routes/specialmenu.routes';
import quoteRoutes from './routes/quote.routes'
import notificationRoutes from './routes/notification.routes';
import procurementRoutes from './routes/procurement.routes';
import feeRoutes from './routes/fee.routes';
import invoiceRoutes from './routes/invoice.routes';
import settingsRoutes from './routes/settings.routes';
import bookingInvoiceRoutes from './routes/bookingInvoice.routes';
import favoriteRoutes from './routes/favorite.routes';
import ratingRoutes from './routes/rating.routes';
import chefRatingRoutes from './routes/chefRating.routes';
import clientRatingRoutes from './routes/clientRating.routes';
import termsAndConRoutes from './routes/termsAndCon.routes';
import bookingRoutes from './routes/booking.routes';
import residentialTestingSlotRoutes from './routes/residentialTestingSlot.routes';
import packageRoutes from './routes/package.routes';
import menuTypesRoutes from './routes/menuTypes.routes';
import assignedBookingNumberRoutes from './routes/assignedBookingNumber.routes';
import messagingRoutes from './routes/messaging.routes';
import { verifyEmailTransport } from './services/email/emailService';


dotenv.config();

// Connect to DB
connectDB().catch((err) => {
  console.error('Failed to connect to DB:', err.message);
  process.exit(1);
});

// Non-fatal: logs clearly at boot if SMTP auth/connectivity is broken instead of
// only surfacing as a failed send later.
verifyEmailTransport();

const app = express();


// Middlewares
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Websites allowed to call this API from a browser: the Rent A Chef sites below,
// plus any extras in CLIENT_URL (comma-separated, e.g. "http://localhost:5173").
// A bare domain is allowed with and without "www.". If CLIENT_URL is unset, any
// origin is allowed. The mobile app sends no Origin header, so CORS never affects it.
const RENT_A_CHEF_SITES = ['https://rentachefapp.com', 'https://dev.rentachefapp.com'];

const withWwwVariant = (origin: string): string[] => {
  const match = origin.match(/^(https?:\/\/)(www\.)?([^/:]+)(:\d+)?$/i);
  if (!match) return [origin];
  const [, scheme, , host, port = ''] = match;
  // Only bare domains like rentachefapp.com get a www twin — not subdomains, localhost or IPs.
  if (host.split('.').length !== 2) return [origin];
  return [`${scheme}${host}${port}`, `${scheme}www.${host}${port}`];
};

const extraOrigins = (process.env.CLIENT_URL ?? '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [...new Set([...RENT_A_CHEF_SITES, ...extraOrigins].flatMap(withWwwVariant))];

app.use(cors({
  origin: extraOrigins.length === 0 ? true : allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiPrefix = '/api/v1/';

app.use(`${apiPrefix}swagger`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use(apiPrefix, authRoutes);
// Must come before adminRoutes: its catch-all GET/PUT/DELETE /admin/:id would
// otherwise swallow /admin/conversations and /admin/notifications (treating them as admin ids).
app.use(apiPrefix, messagingRoutes);
app.use(apiPrefix, adminRoutes);
app.use(apiPrefix, chefRoutes);
app.use(apiPrefix, categoryRoutes);
app.use(apiPrefix, serviceRoutes);
app.use(apiPrefix, serviceCategoryRoutes);
app.use(apiPrefix, chefServiceRoutes);
app.use(apiPrefix, servicePricingRoutes);
app.use(apiPrefix, userRoutes);
app.use(apiPrefix, menuRoutes);
app.use(apiPrefix, packageRoutes);
app.use(apiPrefix, menuTypesRoutes);
app.use(apiPrefix, quoteRoutes);
app.use(apiPrefix, paymentRoutes);
app.use(apiPrefix, specialMenuRoutes);
app.use(apiPrefix, stateRoutes);
app.use(apiPrefix, notificationRoutes);
app.use(apiPrefix, procurementRoutes);
app.use(apiPrefix, feeRoutes);
app.use(apiPrefix, invoiceRoutes);
app.use(apiPrefix, settingsRoutes);
app.use(apiPrefix, bookingInvoiceRoutes);
app.use(apiPrefix, favoriteRoutes);
app.use(apiPrefix, chefRatingRoutes);
app.use(apiPrefix, ratingRoutes);
app.use(apiPrefix, clientRatingRoutes);
app.use(apiPrefix, termsAndConRoutes);
app.use(apiPrefix, bookingRoutes);
app.use(apiPrefix, residentialTestingSlotRoutes);
app.use(apiPrefix, assignedBookingNumberRoutes);





// Upload errors (file over the 2 MB cap, wrong type) → a clear 400 instead of Express's HTML 500.
const uploadErrorHandler: express.ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `File is too large. The maximum upload size is ${MAX_UPLOAD_LABEL}.`
        : err.message;
    res.status(400).json({ success: false, message });
    return;
  }
  if (typeof err?.message === "string" && /only .*(allowed)/i.test(err.message)) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  next(err);
};
app.use(uploadErrorHandler);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));