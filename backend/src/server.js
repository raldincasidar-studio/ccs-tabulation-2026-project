import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { sendError, sendSuccess } from './utils/response.js';

import authRouter from './routes/authRoutes.js';
import configurationRouter from './routes/configurationRoutes.js';
import judgeRouter from './routes/judgeRoutes.js';
import userRouter from './routes/userRoutes.js';
import categoryRouter from './routes/categoryRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Route Modules
app.use('/api/v1', authRouter);
app.use('/api/v1-mock', authRouter);
app.use('/api/v1', configurationRouter);
app.use('/api/v1-mock', configurationRouter);
app.use('/api/v1', judgeRouter);
app.use('/api/v1-mock', judgeRouter);
app.use('/api/v1', categoryRouter);
app.use('/api/v1-mock', categoryRouter);
app.use('/api', userRouter);

// Root Endpoint
app.get('/', (req, res) => {
  return sendSuccess(res, { status: 'ok' }, 'API is running', 200);
});

// 404 Handler
app.use((req, res) => {
  return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Route not found', []);
});

app.use((err, req, res, next) => {
  if (err?.name === 'ValidationError') {
    return sendError(res, 400, 'VALIDATION_ERROR', err.message, []);
  }

  if (err?.name === 'CastError') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
  }

  if (err?.code === 11000) {
    return sendError(res, 409, 'DUPLICATE_KEY', 'Duplicate value', []);
  }

  console.error(err);
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Something went wrong', []);
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

export default app;