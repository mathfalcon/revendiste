import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create seller_earnings_status enum
  await sql`CREATE TYPE seller_earnings_status AS ENUM ('pending', 'available', 'retained', 'paid_out')`.execute(
    db,
  );

  // Create payout_type enum (MVP: only uruguayan_bank)
  await sql`CREATE TYPE payout_type AS ENUM ('uruguayan_bank')`.execute(db);

  // Create payout_status enum
  await sql`CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled')`.execute(
    db,
  );

  // Create payout_event_type enum
  await sql`CREATE TYPE payout_event_type AS ENUM (
    'payout_requested',
    'status_change',
    'admin_processed',
    'transfer_initiated',
    'transfer_completed',
    'transfer_failed',
    'cancelled'
  )`.execute(db);

  // Create PAYOUT_METHODS table (no dependencies on other payout tables)
  await db.schema
    .createTable('payout_methods')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', col =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('payout_type', sql`payout_type`, col => col.notNull())
    .addColumn('account_holder_name', 'varchar(255)', col => col.notNull())
    .addColumn('account_holder_surname', 'varchar(255)', col => col.notNull())
    .addColumn('currency', sql`event_ticket_currency`, col => col.notNull())
    .addColumn('is_default', 'boolean', col => col.defaultTo(false).notNull())
    .addColumn('metadata', 'jsonb', col => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create PAYOUTS table (depends on payout_methods)
  await db.schema
    .createTable('payouts')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('seller_user_id', 'uuid', col =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('payout_method_id', 'uuid', col =>
      col.notNull().references('payout_methods.id').onDelete('restrict'),
    )
    .addColumn('status', sql`payout_status`, col =>
      col.defaultTo('pending').notNull(),
    )
    .addColumn('amount', 'numeric', col => col.notNull())
    .addColumn('currency', sql`event_ticket_currency`, col => col.notNull())
    .addColumn('processing_fee', 'numeric') // Admin fills this when processing transfer
    .addColumn('requested_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('processed_at', 'timestamptz')
    .addColumn('processed_by', 'uuid', col =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('completed_at', 'timestamptz')
    .addColumn('failed_at', 'timestamptz')
    .addColumn('failure_reason', 'text')
    .addColumn('transaction_reference', 'varchar(255)')
    .addColumn('notes', 'text')
    .addColumn('metadata', 'jsonb', col => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create SELLER_EARNINGS table (depends on payouts for foreign key)
  await db.schema
    .createTable('seller_earnings')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('seller_user_id', 'uuid', col =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('listing_ticket_id', 'uuid', col =>
      col.notNull().references('listing_tickets.id').onDelete('cascade'),
    )
    .addColumn('seller_amount', 'numeric', col => col.notNull())
    .addColumn('currency', sql`event_ticket_currency`, col => col.notNull())
    .addColumn('hold_until', 'timestamptz', col => col.notNull())
    .addColumn('status', sql`seller_earnings_status`, col =>
      col.defaultTo('pending').notNull(),
    )
    .addColumn('payout_id', 'uuid', col =>
      col.references('payouts.id').onDelete('set null'),
    )
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create PAYOUT_EVENTS table (immutable audit log)
  await db.schema
    .createTable('payout_events')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('payout_id', 'uuid', col =>
      col.notNull().references('payouts.id').onDelete('cascade'),
    )
    .addColumn('event_type', sql`payout_event_type`, col => col.notNull())
    .addColumn('from_status', sql`payout_status`)
    .addColumn('to_status', sql`payout_status`)
    .addColumn('event_data', 'jsonb', col => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_by', 'uuid', col =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('ip_address', 'varchar(45)')
    .addColumn('user_agent', 'text')
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Indexes for seller_earnings
  await db.schema
    .createIndex('seller_earnings_seller_user_id_status_idx')
    .on('seller_earnings')
    .columns(['seller_user_id', 'status'])
    .execute();

  await db.schema
    .createIndex('seller_earnings_hold_until_idx')
    .on('seller_earnings')
    .column('hold_until')
    .execute();

  await db.schema
    .createIndex('seller_earnings_payout_id_idx')
    .on('seller_earnings')
    .column('payout_id')
    .execute();

  await db.schema
    .createIndex('seller_earnings_listing_ticket_id_idx')
    .on('seller_earnings')
    .column('listing_ticket_id')
    .execute();

  // Indexes for payout_methods
  await db.schema
    .createIndex('payout_methods_user_id_is_default_idx')
    .on('payout_methods')
    .columns(['user_id', 'is_default'])
    .execute();

  await db.schema
    .createIndex('payout_methods_user_id_payout_type_idx')
    .on('payout_methods')
    .columns(['user_id', 'payout_type'])
    .execute();

  // Indexes for payouts
  await db.schema
    .createIndex('payouts_seller_user_id_status_idx')
    .on('payouts')
    .columns(['seller_user_id', 'status'])
    .execute();

  await db.schema
    .createIndex('payouts_status_requested_at_idx')
    .on('payouts')
    .columns(['status', 'requested_at'])
    .execute();

  await db.schema
    .createIndex('payouts_processed_by_idx')
    .on('payouts')
    .column('processed_by')
    .execute();

  // Indexes for payout_events
  await db.schema
    .createIndex('payout_events_payout_id_created_at_idx')
    .on('payout_events')
    .columns(['payout_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables
  await db.schema.dropTable('payout_events').ifExists().execute();
  await db.schema.dropTable('payouts').ifExists().execute();
  await db.schema.dropTable('payout_methods').ifExists().execute();
  await db.schema.dropTable('seller_earnings').ifExists().execute();

  // Drop enums
  await sql`DROP TYPE IF EXISTS payout_event_type`.execute(db);
  await sql`DROP TYPE IF EXISTS payout_status`.execute(db);
  await sql`DROP TYPE IF EXISTS payout_type`.execute(db);
  await sql`DROP TYPE IF EXISTS seller_earnings_status`.execute(db);
}
