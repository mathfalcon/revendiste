import {sql, type Kysely} from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Remove the global unique constraint on external_id
  // Ticket wave IDs are not globally unique - they can be reused across different events
  // We keep the composite unique constraint on (event_id, external_id) for proper upsert functionality
  await sql`
    ALTER TABLE event_ticket_waves 
    DROP CONSTRAINT IF EXISTS event_ticket_waves_external_id_key
  `.execute(db);
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // Restore the global unique constraint on external_id
  // Note: This may fail if there are duplicate external_ids in the database
  await sql`
    ALTER TABLE event_ticket_waves 
    ADD CONSTRAINT event_ticket_waves_external_id_key UNIQUE (external_id)
  `.execute(db);
}
