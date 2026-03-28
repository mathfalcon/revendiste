import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('ticket_reports')
    .alterColumn('reported_by_user_id', ac => ac.dropNotNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('ticket_reports')
    .alterColumn('reported_by_user_id', ac => ac.setNotNull())
    .execute();
}
