import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create payment provider enum (future-proof for multiple providers)
  await sql`CREATE TYPE payment_provider AS ENUM ('dlocal', 'stripe', 'paypal', 'mercadopago')`.execute(
    db,
  );

  // Create payment status enum (standardized across providers)
  await sql`CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled', 'expired', 'refunded', 'partially_refunded')`.execute(
    db,
  );

  // Create payment method enum (what customer used to pay)
  await sql`CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'voucher', 'pix', 'cash', 'other')`.execute(
    db,
  );

  // Create PAYMENTS table - main payment records
  await db.schema
    .createTable('payments')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('order_id', 'uuid', col =>
      col.notNull().references('orders.id').onDelete('cascade'),
    )
    .addColumn('provider', sql`payment_provider`, col => col.notNull())
    .addColumn('provider_payment_id', 'varchar(255)', col => col.notNull()) // e.g., "DP-54364" for dLocal
    .addColumn('status', sql`payment_status`, col =>
      col.defaultTo('pending').notNull(),
    )
    .addColumn('payment_method', sql`payment_method`) // how customer paid (nullable until payment completes)

    // Amount fields - what customer paid
    .addColumn('amount', 'numeric', col => col.notNull())
    .addColumn('currency', 'varchar(3)', col => col.notNull()) // ISO 4217 currency code

    // Balance fields - what merchant receives (after provider fees)
    .addColumn('balance_amount', 'numeric') // amount credited to merchant account
    .addColumn('balance_fee', 'numeric') // provider's commission
    .addColumn('balance_currency', 'varchar(3)') // merchant's settlement currency

    // Payment lifecycle timestamps
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('approved_at', 'timestamptz') // when payment was approved by provider
    .addColumn('failed_at', 'timestamptz') // when payment failed
    .addColumn('cancelled_at', 'timestamptz') // when payment was cancelled
    .addColumn('expired_at', 'timestamptz') // when payment link expired
    .addColumn('refunded_at', 'timestamptz') // when refund was issued

    // Additional metadata
    .addColumn('failure_reason', 'varchar(255)') // e.g., "INSUFFICIENT_FUNDS", "CARD_EXPIRED"
    .addColumn('redirect_url', 'text') // URL to complete payment (for hosted checkouts)
    .addColumn('notification_url', 'text') // webhook URL registered with provider
    .addColumn('success_url', 'text') // where to redirect after success
    .addColumn('back_url', 'text') // where to redirect if user cancels

    // Provider-specific data stored as JSONB (flexible for different providers)
    .addColumn('provider_metadata', 'jsonb', col =>
      col.defaultTo(sql`'{}'::jsonb`),
    )

    // Payer information (captured from payment response)
    .addColumn('payer_email', 'varchar(255)')
    .addColumn('payer_first_name', 'varchar(255)')
    .addColumn('payer_last_name', 'varchar(255)')
    .addColumn('payer_document_type', 'varchar(50)') // e.g., "CI", "CPF", "DNI"
    .addColumn('payer_document', 'varchar(255)')
    .addColumn('payer_country', 'varchar(2)') // ISO 3166-1 alpha-2

    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz') // soft delete
    .execute();

  // Create payment event type enum
  await sql`CREATE TYPE payment_event_type AS ENUM (
    'payment_created',
    'status_change', 
    'webhook_received',
    'refund_initiated',
    'refund_completed',
    'chargeback_received',
    'dispute_opened',
    'dispute_resolved',
    'fraud_check_failed',
    'manual_review_required'
  )`.execute(db);

  // Create PAYMENT_EVENTS table - immutable audit log
  await db.schema
    .createTable('payment_events')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('payment_id', 'uuid', col =>
      col.notNull().references('payments.id').onDelete('cascade'),
    )
    .addColumn('event_type', sql`payment_event_type`, col => col.notNull())
    .addColumn('from_status', sql`payment_status`) // previous status (null for initial events)
    .addColumn('to_status', sql`payment_status`) // new status
    .addColumn('event_data', 'jsonb', col => col.defaultTo(sql`'{}'::jsonb`)) // full webhook payload or event details
    .addColumn('ip_address', 'varchar(45)') // IPv4 or IPv6 address of webhook caller
    .addColumn('user_agent', 'text') // user agent of webhook caller
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Indexes for efficient queries
  await db.schema
    .createIndex('payments_order_id_idx')
    .on('payments')
    .column('order_id')
    .execute();

  await db.schema
    .createIndex('payments_provider_payment_id_idx')
    .on('payments')
    .columns(['provider', 'provider_payment_id'])
    .execute();

  await db.schema
    .createIndex('payments_status_idx')
    .on('payments')
    .column('status')
    .execute();

  await db.schema
    .createIndex('payments_created_at_idx')
    .on('payments')
    .column('created_at')
    .execute();

  await db.schema
    .createIndex('payment_events_payment_id_idx')
    .on('payment_events')
    .column('payment_id')
    .execute();

  await db.schema
    .createIndex('payment_events_created_at_idx')
    .on('payment_events')
    .column('created_at')
    .execute();

  // Add unique constraint for provider + provider_payment_id
  await db.schema
    .createIndex('payments_provider_payment_id_unique')
    .unique()
    .on('payments')
    .columns(['provider', 'provider_payment_id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables
  await db.schema.dropTable('payment_events').ifExists().execute();
  await db.schema.dropTable('payments').ifExists().execute();

  // Drop enums
  await sql`DROP TYPE IF EXISTS payment_event_type`.execute(db);
  await sql`DROP TYPE IF EXISTS payment_method`.execute(db);
  await sql`DROP TYPE IF EXISTS payment_status`.execute(db);
  await sql`DROP TYPE IF EXISTS payment_provider`.execute(db);
}
