import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import authRouter from './routes/authRoutes.js';
import configurationRouter from './routes/configurationRoutes.js';
import judgeRouter from './routes/judgeRoutes.js';
import userRouter from './routes/userRoutes.js';

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
app.use('/api', userRouter);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});

export default app;