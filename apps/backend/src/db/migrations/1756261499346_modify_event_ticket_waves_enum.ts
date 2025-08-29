import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  sql`CREATE TYPE event_ticket_currency AS ENUM ('USD', 'UYU')`.execute(db);

  await sql`
    ALTER TABLE event_ticket_waves
    ALTER COLUMN currency TYPE event_ticket_currency
    USING currency::event_ticket_currency
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('event_ticket_waves')
    .alterColumn('currency', col => col.setDataType('varchar(3)'))
    .execute();

  await sql`DROP TYPE event_ticket_currency`.execute(db);
}
