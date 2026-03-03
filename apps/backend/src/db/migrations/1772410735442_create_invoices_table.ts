import { sql, type Kysely } from 'kysely';

/**
 * Migration to create invoices table for FEU electronic invoicing.
 * English column names; provider-specific/Spanish data in provider_response JSONB.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TYPE invoice_party AS ENUM ('buyer', 'seller')
  `.execute(db);

  await sql`
    CREATE TYPE invoice_status AS ENUM ('pending', 'issued', 'failed')
  `.execute(db);

  await db.schema
    .createTable('invoices')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('order_id', 'uuid', col =>
      col.notNull().references('orders.id').onDelete('cascade'),
    )
    .addColumn('party', sql`invoice_party`, col => col.notNull())
    .addColumn('status', sql`invoice_status`, col =>
      col.notNull().defaultTo('pending'),
    )
    .addColumn('external_id', 'varchar(255)', col => col.unique().notNull())
    .addColumn('provider', 'varchar(50)', col => col.notNull().defaultTo('FEU'))
    .addColumn('provider_response', 'jsonb')
    .addColumn('pdf_storage_path', 'text')
    .addColumn('base_amount', 'numeric', col => col.notNull())
    .addColumn('vat_amount', 'numeric', col => col.notNull())
    .addColumn('total_amount', 'numeric', col => col.notNull())
    .addColumn('currency', sql`event_ticket_currency`, col => col.notNull())
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('issued_at', 'timestamptz')
    .addColumn('email_sent_at', 'timestamptz')
    .addColumn('last_error', 'text')
    .execute();

  await db.schema
    .createIndex('idx_invoices_order_id')
    .on('invoices')
    .column('order_id')
    .execute();

  await db.schema
    .createIndex('idx_invoices_status')
    .on('invoices')
    .column('status')
    .execute();

  await sql`
    CREATE UNIQUE INDEX idx_invoices_order_party ON invoices (order_id, party)
  `.execute(db);

  await sql`
    CREATE INDEX idx_invoices_provider_response ON invoices USING GIN (provider_response)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_invoices_provider_response`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_invoices_order_party`.execute(db);
  await db.schema.dropIndex('idx_invoices_status').ifExists().execute();
  await db.schema.dropIndex('idx_invoices_order_id').ifExists().execute();
  await db.schema.dropTable('invoices').ifExists().execute();
  await sql`DROP TYPE IF EXISTS invoice_status`.execute(db);
  await sql`DROP TYPE IF EXISTS invoice_party`.execute(db);
}
