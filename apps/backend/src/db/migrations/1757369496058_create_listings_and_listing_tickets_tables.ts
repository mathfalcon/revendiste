import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create listing status enum
  await sql`CREATE TYPE listing_ticket_status AS ENUM ('available', 'sold', 'cancelled')`.execute(
    db,
  );

  // Create LISTINGS table - groups multiple tickets together
  await db.schema
    .createTable('listings')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('publisher_user_id', 'uuid', col =>
      col.notNull().references('users.id'),
    )
    .addColumn('ticket_wave_id', 'uuid', col =>
      col.notNull().references('event_ticket_waves.id'),
    )
    .addColumn('sold_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create LISTING_TICKETS table - individual tickets within a listing
  await db.schema
    .createTable('listing_tickets')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('listing_id', 'uuid', col =>
      col.notNull().references('listings.id').onDelete('cascade'),
    )
    .addColumn('ticket_number', 'integer', col => col.notNull()) // position within the listing (1, 2, 3, etc.)
    .addColumn('price', 'numeric', col => col.notNull()) // price for this specific ticket
    .addColumn('cancelled_at', 'timestamptz') // when this specific ticket was cancelled
    .addColumn('sold_at', 'timestamptz') // when this specific ticket was sold
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables (order matters due to foreign key constraints)
  await db.schema.dropTable('listing_tickets').execute();
  await db.schema.dropTable('listings').execute();

  // Drop enums
  await sql`DROP TYPE IF EXISTS listing_ticket_status`.execute(db);
}
