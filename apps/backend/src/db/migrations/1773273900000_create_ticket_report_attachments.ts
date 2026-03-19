import {type Kysely, sql} from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('ticket_report_attachments')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('ticket_report_id', 'uuid', col =>
      col.notNull().references('ticket_reports.id').onDelete('cascade'),
    )
    .addColumn('uploaded_by_user_id', 'uuid', col =>
      col.notNull().references('users.id'),
    )
    .addColumn('storage_path', 'varchar(500)', col => col.notNull())
    .addColumn('file_name', 'varchar(255)', col => col.notNull())
    .addColumn('original_name', 'varchar(255)', col => col.notNull())
    .addColumn('mime_type', 'varchar(100)', col => col.notNull())
    .addColumn('size_bytes', 'integer', col => col.notNull())
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_ticket_report_attachments_report')
    .on('ticket_report_attachments')
    .column('ticket_report_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .dropIndex('idx_ticket_report_attachments_report')
    .ifExists()
    .execute();

  await db.schema.dropTable('ticket_report_attachments').ifExists().execute();
}
