import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Add QR availability timing column to events table
  await sql`
    ALTER TABLE events
    ADD COLUMN qr_availability_timing qr_availability_timing
  `.execute(db);

  // 2. Copy existing timing data from event_ticket_waves to events
  // Take the first non-null value from any ticket wave for each event
  await sql`
    UPDATE events
    SET qr_availability_timing = subquery.qr_availability_timing
    FROM (
      SELECT DISTINCT ON (event_id) 
        event_id, 
        qr_availability_timing
      FROM event_ticket_waves
      WHERE qr_availability_timing IS NOT NULL
      ORDER BY event_id, created_at ASC
    ) AS subquery
    WHERE events.id = subquery.event_id
  `.execute(db);

  // 3. Remove QR availability timing column from event_ticket_waves
  await sql`
    ALTER TABLE event_ticket_waves
    DROP COLUMN qr_availability_timing
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // 1. Add QR availability timing column back to event_ticket_waves
  await sql`
    ALTER TABLE event_ticket_waves
    ADD COLUMN qr_availability_timing qr_availability_timing
  `.execute(db);

  // 2. Copy timing data back from events to event_ticket_waves
  await sql`
    UPDATE event_ticket_waves
    SET qr_availability_timing = events.qr_availability_timing
    FROM events
    WHERE event_ticket_waves.event_id = events.id
      AND events.qr_availability_timing IS NOT NULL
  `.execute(db);

  // 3. Remove QR availability timing column from events
  await sql`
    ALTER TABLE events
    DROP COLUMN qr_availability_timing
  `.execute(db);
}
