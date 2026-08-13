import express from 'express';
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

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiPrefix = '/api/v1/';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use(apiPrefix, authRoutes);
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
app.use(apiPrefix, favoriteRoutes);
app.use(apiPrefix, chefRatingRoutes);
app.use(apiPrefix, ratingRoutes);
app.use(apiPrefix, clientRatingRoutes);
app.use(apiPrefix, termsAndConRoutes);
app.use(apiPrefix, bookingRoutes);
app.use(apiPrefix, residentialTestingSlotRoutes);
app.use(apiPrefix, assignedBookingNumberRoutes);





// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));