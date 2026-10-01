// Load .env before importing handlers. ESM route imports run before the
// module body, so calling dotenv.config() in the body was too late for auth.
import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const RETRY_DELAY_MS = 15000;
let retryTimer;
let isClosing = false;

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET must be set in backend/.env.');
  process.exit(1);
}

// Serve health/readiness checks even if Atlas is temporarily unavailable.
// Database-dependent API requests return 503 until connected; no mock data
// or database credentials are exposed as a fallback.
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

async function connectWithRetry() {
  if (isClosing || mongoose.connection.readyState === 1) return;
  const connected = await connectDB();
  if (!connected && !isClosing) {
    console.warn('MongoDB is unavailable. API requests return 503; retrying the connection in 15 seconds.');
    retryTimer = setTimeout(connectWithRetry, RETRY_DELAY_MS);
    retryTimer.unref();
  }
}

connectWithRetry();

async function shutdown() {
  if (isClosing) return;
  isClosing = true;
  clearTimeout(retryTimer);
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

export default app;
