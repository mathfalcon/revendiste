import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {sql} from 'kysely';
import type {ClientRateLimitInfo, Options, Store} from 'express-rate-limit';

/**
 * Postgres-backed store for express-rate-limit.
 * Uses table rate_limit: key (pk), count, reset_time.
 * Safe for multiple app instances (no Redis required).
 */
export class PostgresRateLimitStore implements Store {
  private windowMs = 60_000;

  constructor(private readonly db: Kysely<DB>) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const now = new Date();
    const resetTime = new Date(now.getTime() + this.windowMs);

    await sql`
      INSERT INTO rate_limit (key, count, reset_time)
      VALUES (${key}, 1, ${resetTime})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limit.reset_time <= ${now} THEN 1
          ELSE rate_limit.count + 1
        END,
        reset_time = CASE
          WHEN rate_limit.reset_time <= ${now} THEN ${resetTime}
          ELSE rate_limit.reset_time
        END
    `.execute(this.db);

    const selectResult = await sql<{count: number; reset_time: Date}>`
      SELECT count, reset_time FROM rate_limit WHERE key = ${key}
    `.execute(this.db);

    const rows = (selectResult as unknown as {rows: Array<{count: number; reset_time: Date}>}).rows;
    const row = rows?.[0];
    if (!row) {
      return {totalHits: 1, resetTime};
    }
    return {
      totalHits: Number(row.count),
      resetTime:
        row.reset_time instanceof Date
          ? row.reset_time
          : new Date(row.reset_time),
    };
  }

  async decrement(key: string): Promise<void> {
    await sql`
      UPDATE rate_limit
      SET count = GREATEST(0, count - 1)
      WHERE key = ${key} AND count > 0
    `.execute(this.db);
  }

  async resetKey(key: string): Promise<void> {
    await sql`DELETE FROM rate_limit WHERE key = ${key}`.execute(this.db);
  }
}
