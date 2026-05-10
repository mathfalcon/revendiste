import {Pool} from 'pg';

export type EventLookupRow = {
  id: string;
  slug: string;
  name: string;
  eventStartDate: string;
  city?: string | null;
};

let pool: Pool | null = null;

function getPool(): Pool | null {
  const url = process.env.MAIN_DATABASE_URL;
  if (!url) {
    return null;
  }
  if (!pool) {
    pool = new Pool({connectionString: url, max: 2});
  }
  return pool;
}

/**
 * Read-only search on main Revendiste `events` (Postgres).
 */
export async function lookupEventsByQuery(
  query: string,
): Promise<EventLookupRow[] | {error: string}> {
  const p = getPool();
  if (!p) {
    return {
      error:
        'MAIN_DATABASE_URL is not set — event.lookup is disabled. Set it to your apps/backend Postgres URL.',
    };
  }
  const q = `%${query.trim()}%`;
  const res = await p.query(
    `
    SELECT e.id, e.slug, e.name, e.event_start_date AS "eventStartDate", v.city
    FROM events e
    LEFT JOIN event_venues v ON v.id = e.venue_id
    WHERE e.deleted_at IS NULL
      AND (e.slug ILIKE $1 OR e.name ILIKE $1)
    ORDER BY e.event_start_date ASC
    LIMIT 10
    `,
    [q],
  );
  return res.rows as EventLookupRow[];
}
