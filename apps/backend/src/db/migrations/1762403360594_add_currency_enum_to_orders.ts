import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE orders
    ALTER COLUMN currency TYPE event_ticket_currency
    USING currency::event_ticket_currency
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('orders')
    .alterColumn('currency', col => col.setDataType('varchar(3)'))
    .execute();
}
