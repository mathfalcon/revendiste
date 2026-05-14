import rateLimit, {ipKeyGenerator} from 'express-rate-limit';
import {db} from '~/db';
import {PostgresRateLimitStore} from '~/middleware/rateLimitStore';
import {RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX} from '~/config/env';
import {isHealthCheckPath} from '~/utils/logFields';

const postgresStore = new PostgresRateLimitStore(db);

/**
 * Postgres-backed rate limit for /api.
 * Uses RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX from env (defaults: 1 min, 100 req).
 * ipKeyGenerator ensures IPv6 addresses are normalized so users cannot bypass limits.
 */
export const apiRateLimitMiddleware = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: postgresStore,
  keyGenerator: req => ipKeyGenerator(req.ip ?? 'unknown'),
  // Router is mounted at /api — req.path is e.g. /health (not /api/health).
  // Never rate-limit probes: avoids DB writes on every Docker/LB check and
  // prevents store errors from marking the backend unhealthy at boot.
  skip: req => {
    const fullPath = (req.originalUrl ?? '').split('?')[0] ?? '';
    return (
      isHealthCheckPath(req.path) || isHealthCheckPath(fullPath)
    );
  },
