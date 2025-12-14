import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add unique constraint to prevent the same ticket from being reserved multiple times
  // This constraint only applies to active reservations (not soft-deleted ones)
  // PostgreSQL supports partial unique indexes with WHERE clauses
  await sql`
    CREATE UNIQUE INDEX order_ticket_reservations_unique_active_reservation 
    ON order_ticket_reservations (listing_ticket_id) 
    WHERE deleted_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the unique constraint
  await db.schema
    .dropIndex('order_ticket_reservations_unique_active_reservation')
    .execute();
}
