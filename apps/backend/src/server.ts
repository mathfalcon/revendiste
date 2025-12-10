import express, {NextFunction, Request, Response} from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

import {PORT, STORAGE_LOCAL_PATH, STORAGE_BASE_URL} from './config/env';
import {errorHandler, optionalAuthMiddleware} from './middleware';
import {registerSwaggerRoutes} from './swagger';
import {RegisterRoutes} from './routes';
import {logger} from './utils';
import {clerkMiddleware} from '@clerk/express';
import {startCleanupExpiredReservationsJob} from './jobs/cleanup-expired-reservations';
import {startProcessPendingNotificationsJob} from './jobs/process-pending-notifications';

const app: express.Application = express();

// CORS configuration
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json());

// Preserve original body before TSOA processes it
// TSOA's getValidatedArgs may strip nested Record types, so we store the original
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Store a deep copy of the original body before TSOA processes it
    (req as any).originalBody = JSON.parse(JSON.stringify(req.body));
  }
  next();
});

app.use(clerkMiddleware());

// Optional authentication middleware - populates req.user when available
app.use(optionalAuthMiddleware);

// HTTP request logging with Morgan
// Create a stream object with a 'write' function that will be used by Morgan
const morganStream = {
  write: (message: string) => {
    // Remove trailing newline that Morgan adds
    logger.info(message.trim());
  },
};

// Morgan format: :method :url :status :response-time ms - :res[content-length]
app.use(
  morgan(
    ':method :url :status :response-time ms - :res[content-length] bytes',
    {
      stream: morganStream,
      // Skip logging for health check endpoints to reduce noise (optional)
      skip: (req, res) => req.path === '/api/health',
    },
  ),
);

const router = express.Router();

registerSwaggerRoutes(router);
RegisterRoutes(router);

app.use('/api', router);

// Serve static files from storage directory
// This allows direct access to uploaded files via URL
const storagePath = path.resolve(process.cwd(), STORAGE_LOCAL_PATH);
app.use(STORAGE_BASE_URL, express.static(storagePath));

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 API listening on http://localhost:${PORT}/api`);

  // Start scheduled jobs
  startCleanupExpiredReservationsJob();
  startProcessPendingNotificationsJob();
});

export default app;
