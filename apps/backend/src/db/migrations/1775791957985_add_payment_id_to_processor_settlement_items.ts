import {sql, type Kysely} from 'kysely';

/**
 * Link settlement line items to buyer payments for reconciliation (provider-agnostic).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE processor_settlement_items
    ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL
  `.execute(db);

  await sql`
    CREATE INDEX idx_processor_settlement_items_payment_id
    ON processor_settlement_items (payment_id)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS idx_processor_settlement_items_payment_id
  `.execute(db);

  await sql`
    ALTER TABLE processor_settlement_items
    DROP COLUMN IF EXISTS payment_id
  `.execute(db);
}
