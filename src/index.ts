import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import morgan from 'morgan';

import stateRoutes from './routes/stateRoutes'
import authRoutes from './routes/auth.routes'
import chefRoutes from './routes/chef.route'
import menuRoutes from './routes/menu.routes'


dotenv.config();

// Connect to DB
connectDB().catch((err) => {
  console.error('Failed to connect to DB:', err.message);
  process.exit(1);
});

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());

const apiPrefix = '/api/v1/';

// Routes
app.use(apiPrefix, authRoutes);
app.use(apiPrefix, chefRoutes);
app.use(apiPrefix, menuRoutes);
app.use(apiPrefix, stateRoutes);




// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));