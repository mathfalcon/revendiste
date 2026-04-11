import type {Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createIndex('idx_listing_tickets_sold_at')
    .on('listing_tickets')
    .column('sold_at')
    .execute();

  await db.schema
    .createIndex('idx_listing_tickets_listing_id')
    .on('listing_tickets')
    .column('listing_id')
    .execute();

  await db.schema
    .createIndex('idx_listings_ticket_wave_id')
    .on('listings')
    .column('ticket_wave_id')
    .execute();

  await db.schema
    .createIndex('idx_listings_deleted_at')
    .on('listings')
    .column('deleted_at')
    .execute();

  await db.schema
    .createIndex('idx_orders_created_at')
    .on('orders')
    .column('created_at')
    .execute();

  await db.schema
    .createIndex('idx_events_status_event_end_date')
    .on('events')
    .columns(['status', 'event_end_date'])
    .execute();

  await db.schema
    .createIndex('idx_users_verification_status')
    .on('users')
    .column('verification_status')
    .execute();

  await db.schema
    .createIndex('idx_seller_earnings_status')
    .on('seller_earnings')
    .column('status')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_seller_earnings_status').execute();
  await db.schema.dropIndex('idx_users_verification_status').execute();
  await db.schema.dropIndex('idx_events_status_event_end_date').execute();
  await db.schema.dropIndex('idx_orders_created_at').execute();
  await db.schema.dropIndex('idx_listings_deleted_at').execute();
  await db.schema.dropIndex('idx_listings_ticket_wave_id').execute();
  await db.schema.dropIndex('idx_listing_tickets_listing_id').execute();
  await db.schema.dropIndex('idx_listing_tickets_sold_at').execute();
}
