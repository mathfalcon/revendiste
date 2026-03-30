import {type Kysely, sql} from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('ticket_report_attachments')
    .addColumn('ticket_report_action_id', 'uuid', col =>
      col.references('ticket_report_actions.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .createIndex('idx_ticket_report_attachments_action')
    .on('ticket_report_attachments')
    .column('ticket_report_action_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .dropIndex('idx_ticket_report_attachments_action')
    .ifExists()
    .execute();

  await db.schema
    .alterTable('ticket_report_attachments')
    .dropColumn('ticket_report_action_id')
    .execute();
}
