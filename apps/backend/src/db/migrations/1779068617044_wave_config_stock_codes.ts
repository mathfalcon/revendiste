import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DO $$
    BEGIN
      CREATE TYPE ticket_wave_availability_mode AS ENUM (
        'always',
        'scheduled',
        'after_previous'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END
    $$;
  `.execute(db);

  await sql`
    DO $$
    BEGIN
      CREATE TYPE wave_rrpp_issuance_type AS ENUM (
        'invitation',
        'off_platform_sale',
        'both'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END
    $$;
  `.execute(db);

  await sql`
    DO $$
    BEGIN
      CREATE TYPE ticket_ownership_transfer_type AS ENUM (
        'primary_sale',
        'resale',
        'rrpp_invitation',
        'rrpp_off_platform_sale'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END
    $$;
  `.execute(db);

  await db.schema
    .alterTable('listings')
    .addColumn('is_house_listing', 'boolean', col =>
      col.notNull().defaultTo(false),
    )
    .execute();

  await db.schema
    .alterTable('listing_tickets')
    .addColumn('current_owner_user_id', 'uuid', col =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('original_order_id', 'uuid', col =>
      col.references('orders.id').onDelete('set null'),
    )
    .addColumn('entry_used_at', 'timestamptz')
    .addColumn('entry_used_by_user_id', 'uuid', col =>
      col.references('users.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .createIndex('listing_tickets_current_owner_user_id_idx')
    .on('listing_tickets')
    .column('current_owner_user_id')
    .execute();

  await db.schema
    .createTable('event_ticket_wave_configs')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('event_ticket_wave_id', 'uuid', col =>
      col.notNull().references('event_ticket_waves.id').onDelete('cascade'),
    )
    .addColumn('stock', 'integer', col => col.notNull())
    .addColumn('availability_mode', sql`ticket_wave_availability_mode`, col =>
      col.notNull().defaultTo('always'),
    )
    .addColumn('available_from', 'timestamptz')
    .addColumn('available_until', 'timestamptz')
    .addColumn('previous_wave_id', 'uuid', col =>
      col.references('event_ticket_waves.id').onDelete('set null'),
    )
    .addColumn('is_hidden_from_sale', 'boolean', col =>
      col.notNull().defaultTo(false),
    )
    .addColumn('rrpp_issuable', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('rrpp_issuance_type', sql`wave_rrpp_issuance_type`, col =>
      col.notNull().defaultTo('off_platform_sale'),
    )
    .addColumn('display_order', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('house_listing_id', 'uuid', col =>
      col.references('listings.id').onDelete('set null'),
    )
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('event_ticket_wave_configs_event_ticket_wave_id_unique_idx')
    .on('event_ticket_wave_configs')
    .column('event_ticket_wave_id')
    .unique()
    .execute();

  await db.schema
    .createIndex('event_ticket_wave_configs_wave_display_order_idx')
    .on('event_ticket_wave_configs')
    .columns(['event_ticket_wave_id', 'display_order'])
    .execute();

  await sql`
    CREATE UNIQUE INDEX event_ticket_wave_configs_house_listing_id_unique_idx
    ON event_ticket_wave_configs (house_listing_id)
    WHERE house_listing_id IS NOT NULL
  `.execute(db);

  await db.schema
    .createTable('ticket_codes')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('listing_ticket_id', 'uuid', col =>
      col.notNull().references('listing_tickets.id').onDelete('cascade'),
    )
    .addColumn('secret', 'bytea', col => col.notNull())
    .addColumn('generation', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('window_seconds', 'integer', col => col.notNull().defaultTo(300))
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('ticket_codes_listing_ticket_id_unique_idx')
    .on('ticket_codes')
    .column('listing_ticket_id')
    .unique()
    .execute();

  await db.schema
    .createTable('ticket_ownership_transfers')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('listing_ticket_id', 'uuid', col =>
      col.notNull().references('listing_tickets.id').onDelete('cascade'),
    )
    .addColumn('from_user_id', 'uuid', col =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('to_user_id', 'uuid', col =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('from_order_id', 'uuid', col =>
      col.references('orders.id').onDelete('set null'),
    )
    .addColumn('to_order_id', 'uuid', col =>
      col.references('orders.id').onDelete('set null'),
    )
    .addColumn('transfer_type', sql`ticket_ownership_transfer_type`, col =>
      col.notNull(),
    )
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('ticket_ownership_transfers_listing_ticket_created_at_idx')
    .on('ticket_ownership_transfers')
    .columns(['listing_ticket_id', 'created_at'])
    .execute();

  await db.schema
    .createIndex('ticket_ownership_transfers_to_user_created_at_idx')
    .on('ticket_ownership_transfers')
    .columns(['to_user_id', 'created_at'])
    .execute();

  await db.schema
    .createIndex('ticket_ownership_transfers_to_order_created_at_idx')
    .on('ticket_ownership_transfers')
    .columns(['to_order_id', 'created_at'])
    .execute();

  await sql`
    CREATE UNIQUE INDEX ticket_ownership_transfers_order_transfer_uniq
    ON ticket_ownership_transfers (listing_ticket_id, to_order_id, transfer_type)
    WHERE to_order_id IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS ticket_ownership_transfers_order_transfer_uniq`.execute(
    db,
  );
  await db.schema
    .dropIndex('ticket_ownership_transfers_to_order_created_at_idx')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('ticket_ownership_transfers_to_user_created_at_idx')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('ticket_ownership_transfers_listing_ticket_created_at_idx')
    .ifExists()
    .execute();
  await db.schema.dropTable('ticket_ownership_transfers').ifExists().execute();

  await db.schema
    .dropIndex('ticket_codes_listing_ticket_id_unique_idx')
    .ifExists()
    .execute();
  await db.schema.dropTable('ticket_codes').ifExists().execute();

  await sql`DROP INDEX IF EXISTS event_ticket_wave_configs_house_listing_id_unique_idx`.execute(
    db,
  );
  await db.schema
    .dropIndex('event_ticket_wave_configs_wave_display_order_idx')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('event_ticket_wave_configs_event_ticket_wave_id_unique_idx')
    .ifExists()
    .execute();
  await db.schema.dropTable('event_ticket_wave_configs').ifExists().execute();

  await db.schema
    .dropIndex('listing_tickets_current_owner_user_id_idx')
    .ifExists()
    .execute();

  await db.schema
    .alterTable('listing_tickets')
    .dropColumn('entry_used_by_user_id')
    .dropColumn('entry_used_at')
    .dropColumn('original_order_id')
    .dropColumn('current_owner_user_id')
    .execute();

  await db.schema.alterTable('listings').dropColumn('is_house_listing').execute();

  await sql`DROP TYPE IF EXISTS ticket_ownership_transfer_type`.execute(db);
  await sql`DROP TYPE IF EXISTS wave_rrpp_issuance_type`.execute(db);
  await sql`DROP TYPE IF EXISTS ticket_wave_availability_mode`.execute(db);
}
