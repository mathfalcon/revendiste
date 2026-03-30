import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import {PORT, STORAGE_LOCAL_PATH, APP_BASE_URL, NODE_ENV} from './config/env';
import {shutdownPostHog} from './lib/posthog';
import {initOtel, shutdownOtel} from './lib/otel';
import {apiRateLimitMiddleware} from './middleware/rateLimit';
import {
  errorHandler,
  optionalAuthMiddleware,
  requestIdMiddleware,
} from './middleware';
import {registerSwaggerRoutes} from './swagger';
import {RegisterRoutes} from './routes';
import {logger} from './utils';
import {clerkMiddleware} from '@clerk/express';
import {startSyncPaymentsAndExpireOrdersJob} from './cronjobs/sync-payments-and-expire-orders';
import {startNotifyUploadAvailabilityJob} from './cronjobs/notify-upload-availability';
import {startCheckPayoutHoldPeriodsJob} from './cronjobs/check-payout-hold-periods';
import {startProcessPendingNotificationsJob} from './cronjobs/process-pending-notifications';
import {
  initializeJobQueue,
  startProcessPendingJobsJob,
} from './cronjobs/process-pending-jobs';
import {ValidationService} from '@mathfalcon/tsoa-runtime';

// Initialize OpenTelemetry before any logging so the OTel transport is active
initOtel();

// Initialize job queue early so getJobQueueService() is available when controllers load
initializeJobQueue();
logger.info('Job queue initialized');

const app: express.Application = express();

// CORS configuration
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.2.1:3000',
      'https://192.168.2.1:3000',
      'http://192.168.0.127:3000',
      'https://192.168.0.127:3000',
      'https://192.168.68.115:3000',
      'https://192.168.56.1:3000',
      APP_BASE_URL,
      'https://revendiste.com',
    ].filter(Boolean), // Remove any undefined values
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json());

app.use(requestIdMiddleware);

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

if (NODE_ENV !== 'test') {
  router.use(apiRateLimitMiddleware);
}

ValidationService.prototype.ValidateParam = (
  property,
  rawValue,
  name = '',
  fieldErrors,
  parent = false,
  minimalSwaggerConfig,
) => {
  return rawValue;
};

RegisterRoutes.prototype.getValidatedArgs = (
  args: any,
  request: any,
  response: any,
) => Object.keys(args);

// Custom multer with 50MB limit for all file uploads (supports video uploads in ticket reports)
const uploadConfig = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 50 * 1024 * 1024}, // 50 MB
});

registerSwaggerRoutes(router);
RegisterRoutes(router, {multer: uploadConfig});

app.use('/api', router);

if (NODE_ENV === 'local') {
  const storagePath = path.resolve(process.cwd(), STORAGE_LOCAL_PATH);
  app.use(
    '/uploads',
    express.static(storagePath, {
      setHeaders: (res, filePath) => {
        // Only serve images and cache them for 1 year, immutable
        const ext = path.extname(filePath).toLowerCase();
        const imageExtensions = [
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          '.svg',
          '.bmp',
          '.avif',
          '.tiff',
          '.ico',
        ];
        if (imageExtensions.includes(ext)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Forbid non-image files
          res.statusCode = 403;
          res.end('Forbidden');
        }
      },
    }),
  );
}

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 API listening on http://localhost:${PORT}/api`);

  // Start scheduled jobs only in development/local environments
  // In production, jobs run via EventBridge + ECS RunTask using scripts/run-job.ts
  if (NODE_ENV === 'local' || NODE_ENV === 'development') {
    logger.info('Starting cronjob schedulers (dev/local mode)...');
    startSyncPaymentsAndExpireOrdersJob();
    startNotifyUploadAvailabilityJob();
    startCheckPayoutHoldPeriodsJob();
    startProcessPendingNotificationsJob();
    startProcessPendingJobsJob();
  } else {
    logger.info(
      'Cronjobs disabled in production (using EventBridge + ECS RunTask)',
    );
  }
});

process.on('SIGINT', async () => {
  await Promise.all([shutdownPostHog(), shutdownOtel()]);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await Promise.all([shutdownPostHog(), shutdownOtel()]);
  process.exit(0);
});

export default app;
