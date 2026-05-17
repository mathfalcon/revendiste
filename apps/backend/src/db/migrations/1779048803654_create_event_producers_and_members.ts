import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DO $$
    BEGIN
      CREATE TYPE event_producer_member_role AS ENUM ('owner', 'manager', 'viewer');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END
    $$;
  `.execute(db);

  await db.schema
    .createTable('event_producers')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'text', col => col.notNull())
    .addColumn('slug', 'text', col => col.notNull().unique())
    .addColumn('legal_name', 'text')
    .addColumn('tax_id', 'text')
    .addColumn('contact_email', 'text')
    .addColumn('contact_phone', 'text')
    .addColumn('country', 'text')
    .addColumn('default_buyer_commission_rate', sql`numeric(5,4)`)
    .addColumn('default_producer_fee_amount', sql`numeric(10,2)`)
    .addColumn('default_producer_fee_currency', sql`event_ticket_currency`)
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await sql`
    ALTER TABLE event_producers
    ADD CONSTRAINT event_producers_default_fee_pair_chk
    CHECK (
      (default_producer_fee_amount IS NULL AND default_producer_fee_currency IS NULL)
      OR (default_producer_fee_amount IS NOT NULL AND default_producer_fee_currency IS NOT NULL)
    )
  `.execute(db);

  await db.schema
    .createTable('event_producer_members')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('event_producer_id', 'uuid', col =>
      col.notNull().references('event_producers.id').onDelete('cascade'),
    )
    .addColumn('user_id', 'uuid', col =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('role', sql`event_producer_member_role`, col =>
      col.notNull().defaultTo('viewer'),
    )
    .addColumn('invited_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('accepted_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await sql`
    CREATE UNIQUE INDEX event_producer_members_active_membership_uniq
    ON event_producer_members (event_producer_id, user_id)
    WHERE deleted_at IS NULL
  `.execute(db);

  await db.schema
    .createIndex('event_producer_members_user_id_idx')
    .on('event_producer_members')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('event_producer_members_user_id_idx')
    .on('event_producer_members')
    .ifExists()
    .execute();

  await sql`DROP INDEX IF EXISTS event_producer_members_active_membership_uniq`.execute(
    db,
  );

  await db.schema.dropTable('event_producer_members').ifExists().execute();

  await sql`
    ALTER TABLE event_producers
    DROP CONSTRAINT IF EXISTS event_producers_default_fee_pair_chk
  `.execute(db);
  await db.schema.dropTable('event_producers').ifExists().execute();

  await sql`DROP TYPE IF EXISTS event_producer_member_role`.execute(db);
}
