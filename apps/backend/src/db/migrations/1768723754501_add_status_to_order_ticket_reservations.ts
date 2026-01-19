import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create enum for reservation/order item status
  await sql`
    CREATE TYPE order_ticket_reservation_status AS ENUM (
      'active',
      'cancelled',
      'refund_pending',
      'refunded'
    )
  `.execute(db);

  // Add column (defaults to 'active' for existing records)
  await sql`
    ALTER TABLE order_ticket_reservations
    ADD COLUMN status order_ticket_reservation_status NOT NULL DEFAULT 'active'
  `.execute(db);

  // Create index for filtering by status
  await db.schema
    .createIndex('order_ticket_reservations_status_idx')
    .on('order_ticket_reservations')
    .column('status')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop index
  await db.schema
    .dropIndex('order_ticket_reservations_status_idx')
    .ifExists()
    .execute();

  // Remove column
  await sql`
    ALTER TABLE order_ticket_reservations 
    DROP COLUMN IF EXISTS status
  `.execute(db);

  // Drop enum
  await sql`DROP TYPE IF EXISTS order_ticket_reservation_status`.execute(db);
}
