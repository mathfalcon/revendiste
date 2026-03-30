import type {Kysely} from 'kysely';
import {sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('ticket_report_actions')
    .addColumn('performed_by_admin', 'boolean', col =>
      col.notNull().defaultTo(false),
    )
    .execute();

  // Backfill: mark existing actions as admin if action_type is not 'comment' or 'close'
  // (refund_partial, refund_full, reject are admin-only actions)
  await sql`
    UPDATE ticket_report_actions
    SET performed_by_admin = true
    WHERE action_type IN ('refund_partial', 'refund_full', 'reject')
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('ticket_report_actions')
    .dropColumn('performed_by_admin')
    .execute();
}
