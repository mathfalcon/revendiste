import {type Kysely, sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('payouts')
    .addColumn('source_currency', sql`event_ticket_currency`)
    .addColumn('source_amount', 'numeric(20, 6)')
    .addColumn('idempotency_key_hash', 'varchar(64)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('payouts')
    .dropColumn('idempotency_key_hash')
    .dropColumn('source_amount')
    .dropColumn('source_currency')
    .execute();
}
