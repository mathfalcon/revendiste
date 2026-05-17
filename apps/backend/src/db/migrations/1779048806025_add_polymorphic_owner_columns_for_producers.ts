import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('listings')
    .addColumn('publisher_event_producer_id', 'uuid', col =>
      col.references('event_producers.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .alterTable('seller_earnings')
    .addColumn('seller_event_producer_id', 'uuid', col =>
      col.references('event_producers.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .alterTable('payouts')
    .addColumn('seller_event_producer_id', 'uuid', col =>
      col.references('event_producers.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .createIndex('listings_publisher_event_producer_id_idx')
    .on('listings')
    .column('publisher_event_producer_id')
    .execute();

  await db.schema
    .createIndex('seller_earnings_seller_event_producer_id_status_idx')
    .on('seller_earnings')
    .columns(['seller_event_producer_id', 'status'])
    .execute();

  await db.schema
    .createIndex('payouts_seller_event_producer_id_status_idx')
    .on('payouts')
    .columns(['seller_event_producer_id', 'status'])
    .execute();

  await db.schema
    .alterTable('listings')
    .alterColumn('publisher_user_id', col => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable('seller_earnings')
    .alterColumn('seller_user_id', col => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable('payouts')
    .alterColumn('seller_user_id', col => col.dropNotNull())
    .execute();

  await sql`
    ALTER TABLE listings
    ADD CONSTRAINT listings_exactly_one_owner_chk
    CHECK ((publisher_user_id IS NOT NULL) <> (publisher_event_producer_id IS NOT NULL))
  `.execute(db);

  await sql`
    ALTER TABLE seller_earnings
    ADD CONSTRAINT seller_earnings_exactly_one_owner_chk
    CHECK ((seller_user_id IS NOT NULL) <> (seller_event_producer_id IS NOT NULL))
  `.execute(db);

  await sql`
    ALTER TABLE payouts
    ADD CONSTRAINT payouts_exactly_one_owner_chk
    CHECK ((seller_user_id IS NOT NULL) <> (seller_event_producer_id IS NOT NULL))
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE payouts
    DROP CONSTRAINT IF EXISTS payouts_exactly_one_owner_chk
  `.execute(db);
  await sql`
    ALTER TABLE seller_earnings
    DROP CONSTRAINT IF EXISTS seller_earnings_exactly_one_owner_chk
  `.execute(db);
  await sql`
    ALTER TABLE listings
    DROP CONSTRAINT IF EXISTS listings_exactly_one_owner_chk
  `.execute(db);

  await db.schema
    .alterTable('payouts')
    .alterColumn('seller_user_id', col => col.setNotNull())
    .execute();
  await db.schema
    .alterTable('seller_earnings')
    .alterColumn('seller_user_id', col => col.setNotNull())
    .execute();
  await db.schema
    .alterTable('listings')
    .alterColumn('publisher_user_id', col => col.setNotNull())
    .execute();

  await db.schema
    .dropIndex('payouts_seller_event_producer_id_status_idx')
    .on('payouts')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('seller_earnings_seller_event_producer_id_status_idx')
    .on('seller_earnings')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('listings_publisher_event_producer_id_idx')
    .on('listings')
    .ifExists()
    .execute();

  await db.schema
    .alterTable('payouts')
    .dropColumn('seller_event_producer_id')
    .execute();
  await db.schema
    .alterTable('seller_earnings')
    .dropColumn('seller_event_producer_id')
    .execute();
  await db.schema
    .alterTable('listings')
    .dropColumn('publisher_event_producer_id')
    .execute();
}
