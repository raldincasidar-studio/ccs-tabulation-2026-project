import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { sendError, sendSuccess } from './utils/response.js';

import authRouter from './routes/authRoutes.js';
import configurationRouter from './routes/configurationRoutes.js';
import judgeRouter from './routes/judgeRoutes.js';
import userRouter from './routes/userRoutes.js';
import categoryRouter from './routes/categoryRoutes.js';
import contestantGroupRouter from './routes/contestantGroupRoutes.js';
import contestantRouter from './routes/contestantRoutes.js';
import scoreRouter from './routes/scoreRoutes.js';
import reportRouter from './routes/reportRoutes.js';
import dashboardRouter from './routes/dashboardRoutes.js';

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Readiness is public and never reveals a URI, hostname, password or token.
app.get(['/health', '/api/v1/health', '/api/v1-mock/health'], (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (mongoose.connection.readyState !== 1) {
    res.set('Retry-After', '15');
    return sendError(res, 503, 'DATABASE_UNAVAILABLE', 'API is running, but MongoDB is not connected', []);
  }
  return sendSuccess(res, { status: 'ok', database: 'connected' }, 'API and database are ready');
});

// Avoid buffering requests and displaying misleading zero/empty results
// when the database is disconnected. Startup retries happen in server.js.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.set('Retry-After', '15');
    return sendError(res, 503, 'DATABASE_UNAVAILABLE', 'MongoDB is unavailable. Please try again after the database connection is restored', []);
  }
  return next();
});

// Route Modules — both /api/v1 and /api/v1-mock point to the same
// database-backed handlers. The mock prefix is kept for frontend
// compatibility during transition.
app.use('/api/v1', authRouter);
app.use('/api/v1-mock', authRouter);
app.use('/api/v1', configurationRouter);
app.use('/api/v1-mock', configurationRouter);
app.use('/api/v1', judgeRouter);
app.use('/api/v1-mock', judgeRouter);
app.use('/api/v1', categoryRouter);
app.use('/api/v1-mock', categoryRouter);
app.use('/api/v1', contestantGroupRouter);
app.use('/api/v1-mock', contestantGroupRouter);
app.use('/api/v1', contestantRouter);
app.use('/api/v1-mock', contestantRouter);
app.use('/api/v1', scoreRouter);
app.use('/api/v1-mock', scoreRouter);
app.use('/api/v1', reportRouter);
app.use('/api/v1-mock', reportRouter);
app.use('/api/v1', dashboardRouter);
app.use('/api/v1-mock', dashboardRouter);
app.use('/api', userRouter);

// Root Endpoint
app.get('/', (req, res) => {
  return sendSuccess(res, { status: 'ok' }, 'API is running', 200);
});

// 404 Handler
app.use((req, res) => {
  return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Route not found', []);
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid JSON request body', []);
  }

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

export default app;
