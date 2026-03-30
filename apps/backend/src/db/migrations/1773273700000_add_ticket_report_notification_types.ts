import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_report_created'`.execute(db);
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_report_status_changed'`.execute(db);
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_report_action_added'`.execute(db);
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_report_closed'`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // PostgreSQL does not support removing enum values; these will remain unused if rolled back
}
