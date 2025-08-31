import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create ticket listing status enum
  await sql`CREATE TYPE ticket_listing_status AS ENUM ('active', 'sold', 'expired', 'cancelled')`.execute(
    db,
  );

  // Create TICKET_LISTINGS table
  await db.schema
    .createTable('ticket_listings')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('publisher_user_id', 'uuid', col =>
      col.notNull().references('users.id'),
    )
    .addColumn('event_id', 'uuid', col => col.notNull().references('events.id'))
    .addColumn('ticket_wave_id', 'uuid', col =>
      col.notNull().references('event_ticket_waves.id'),
    )
    .addColumn('price', 'numeric', col => col.notNull())
    .addColumn('status', sql`ticket_listing_status`, col =>
      col.defaultTo('active').notNull(),
    )
    .addColumn('sold_at', 'timestamptz') // when the ticket was sold
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create composite index for the main query pattern: event page listings
  await db.schema
    .createIndex('ticket_listings_event_status_idx')
    .on('ticket_listings')
    .columns(['event_id', 'status'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema.dropIndex('ticket_listings_event_status_idx').execute();

  // Drop tables
  await db.schema.dropTable('ticket_listings').execute();

  // Drop enum
  await sql`DROP TYPE IF EXISTS ticket_listing_status`.execute(db);
}
