import {z} from 'zod';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';

export const AdminDashboardQuerySchema = z
  .object({
    period: z.enum(['today', '7d', '30d', 'all']).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    const hasFrom = data.from !== undefined && data.from !== '';
    const hasTo = data.to !== undefined && data.to !== '';
    if (hasFrom !== hasTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DASHBOARD_RANGE_INCOMPLETE,
        path: ['from'],
      });
    }
    if (hasFrom && hasTo) {
      const from = new Date(data.from!);
      const to = new Date(data.to!);
      if (from > to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_MESSAGES.DASHBOARD_RANGE_INVALID_ORDER,
          path: ['from'],
        });
      }
    }
  });

export const AdminDashboardRouteSchema = z.object({
  query: AdminDashboardQuerySchema,
});

export type AdminDashboardQuery = z.infer<typeof AdminDashboardQuerySchema>;

/** Resolved range for SQL filters. `null` means no date filter (all time). */
export type DashboardDateRange = {from: Date; to: Date} | null;

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function endOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

/**
 * Converts dashboard query params into a date range, or null for all-time.
 * Custom `from`/`to` take precedence over `period`.
 */
export function resolveDashboardDateRange(
  query: AdminDashboardQuery,
): DashboardDateRange {
  if (query.from && query.to) {
    return {from: new Date(query.from), to: new Date(query.to)};
  }

  const period = query.period ?? '7d';
  const now = new Date();

  if (period === 'all') {
    return null;
  }

  if (period === 'today') {
    return {from: startOfUtcDay(now), to: endOfUtcDay(now)};
  }

  const days = period === '7d' ? 7 : 30;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {from, to: now};
}

const TIME_SERIES_ALL_TIME_DAYS = 365;

/**
 * Date range used for dashboard time-series SQL (bounded when query is all-time).
 */
export function resolveDashboardTimeSeriesRange(
  range: DashboardDateRange,
): {from: Date; to: Date} {
  if (range !== null) {
    return range;
  }
  const to = new Date();
  return {
    from: new Date(to.getTime() - TIME_SERIES_ALL_TIME_DAYS * 24 * 60 * 60 * 1000),
    to,
  };
}
