import { sql, type Kysely } from 'kysely';

/**
 * Add seller_user_id to invoices so we can have one invoice per seller per order.
 * Buyer invoices keep seller_user_id NULL. Unique constraint is (order_id, party, seller_user_id).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('invoices')
    .addColumn('seller_user_id', 'uuid', col =>
      col.references('users.id').onDelete('set null'),
    )
    .execute();

  await sql`DROP INDEX IF EXISTS idx_invoices_order_party`.execute(db);

  await sql`
    CREATE UNIQUE INDEX idx_invoices_order_party_seller
    ON invoices (order_id, party, seller_user_id)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_invoices_order_party_seller`.execute(db);

  await sql`
    CREATE UNIQUE INDEX idx_invoices_order_party ON invoices (order_id, party)
  `.execute(db);

  await db.schema
    .alterTable('invoices')
    .dropColumn('seller_user_id')
    .execute();
}
