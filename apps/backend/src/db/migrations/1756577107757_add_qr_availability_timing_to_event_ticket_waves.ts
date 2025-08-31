import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create QR availability timing enum
  await sql`CREATE TYPE qr_availability_timing AS ENUM ('6h', '12h', '24h', '48h', '72h')`.execute(
    db,
  );

  // Add QR availability timing to event_ticket_waves table
  await sql`
    ALTER TABLE event_ticket_waves
    ADD COLUMN qr_availability_timing qr_availability_timing
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove QR availability timing column from event_ticket_waves
  await sql`
    ALTER TABLE event_ticket_waves
    DROP COLUMN qr_availability_timing
  `.execute(db);

  // Drop enum
  await sql`DROP TYPE qr_availability_timing`.execute(db);
}
