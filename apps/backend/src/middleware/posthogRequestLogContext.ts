import {NextFunction, Request, Response} from 'express';
import {posthogRequestLogContext} from '~/utils/posthogRequestLogContext';

/** Client sends these (see `apps/frontend/src/lib/api/index.ts`). */
export const POSTHOG_SESSION_HEADER = 'x-posthog-session-id';
export const POSTHOG_DISTINCT_HEADER = 'x-posthog-distinct-id';

const MAX_HEADER_LEN = 256;

function sanitizeHeader(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const t = value.trim();
  if (!t) return undefined;
  return t.length > MAX_HEADER_LEN ? t.slice(0, MAX_HEADER_LEN) : t;
}

/**
 * Reads PostHog session / distinct id from request headers and stores them in
 * AsyncLocalStorage so Winston → OTel → PostHog Logs can attach `sessionId` and
 * `posthogDistinctId` on every log line for this request.
 */
export function posthogRequestLogContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const sessionId = sanitizeHeader(req.get(POSTHOG_SESSION_HEADER));
  const fromHeader = sanitizeHeader(req.get(POSTHOG_DISTINCT_HEADER));
  const posthogDistinctId =
    fromHeader ||
    (req.user?.id ? sanitizeHeader(String(req.user.id)) : undefined);

  posthogRequestLogContext.enterWith({
    ...(sessionId && {sessionId}),
    ...(posthogDistinctId && {posthogDistinctId}),
  });

  next();
}
