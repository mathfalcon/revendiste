import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Enums
  await sql`CREATE TYPE ticket_report_status AS ENUM ('awaiting_support', 'awaiting_customer', 'closed')`.execute(db);
  await sql`CREATE TYPE ticket_report_case_type AS ENUM ('invalid_ticket', 'ticket_not_received', 'problem_with_seller', 'other')`.execute(db);
  await sql`CREATE TYPE ticket_report_entity_type AS ENUM ('order', 'order_ticket_reservation', 'listing', 'listing_ticket')`.execute(db);
  await sql`CREATE TYPE ticket_report_source AS ENUM ('user_report', 'auto_missing_document')`.execute(db);
  await sql`CREATE TYPE ticket_report_action_type AS ENUM ('refund_partial', 'refund_full', 'reject', 'close', 'comment')`.execute(db);
  await sql`CREATE TYPE ticket_report_refund_status AS ENUM ('pending', 'refunded', 'skipped')`.execute(db);

  // ticket_reports
  await db.schema
    .createTable('ticket_reports')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('status', sql`ticket_report_status`, col =>
      col.notNull().defaultTo('awaiting_support'),
    )
    .addColumn('case_type', sql`ticket_report_case_type`, col =>
      col.notNull(),
    )
    .addColumn('entity_type', sql`ticket_report_entity_type`, col =>
      col.notNull(),
    )
    .addColumn('entity_id', 'uuid', col => col.notNull())
    .addColumn('reported_by_user_id', 'uuid', col =>
      col.notNull().references('users.id'),
    )
    .addColumn('description', 'text')
    .addColumn('source', sql`ticket_report_source`, col =>
      col.notNull().defaultTo('user_report'),
    )
    .addColumn('closed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_ticket_reports_reported_by_user_id')
    .on('ticket_reports')
    .column('reported_by_user_id')
    .execute();

  await db.schema
    .createIndex('idx_ticket_reports_status')
    .on('ticket_reports')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_ticket_reports_entity')
    .on('ticket_reports')
    .columns(['entity_type', 'entity_id'])
    .execute();

  // ticket_report_actions
  await db.schema
    .createTable('ticket_report_actions')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('ticket_report_id', 'uuid', col =>
      col.notNull().references('ticket_reports.id').onDelete('cascade'),
    )
    .addColumn('performed_by_user_id', 'uuid', col =>
      col.notNull().references('users.id'),
    )
    .addColumn('action_type', sql`ticket_report_action_type`, col =>
      col.notNull(),
    )
    .addColumn('comment', 'text')
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_ticket_report_actions_ticket_report_id')
    .on('ticket_report_actions')
    .column('ticket_report_id')
    .execute();

  // ticket_report_refunds
  await db.schema
    .createTable('ticket_report_refunds')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('ticket_report_id', 'uuid', col =>
      col.notNull().references('ticket_reports.id').onDelete('cascade'),
    )
    .addColumn('order_ticket_reservation_id', 'uuid', col =>
      col.notNull().references('order_ticket_reservations.id'),
    )
    .addColumn('refund_status', sql`ticket_report_refund_status`, col =>
      col.notNull().defaultTo('pending'),
    )
    .addColumn('refund_amount', 'numeric')
    .addColumn('currency', sql`event_ticket_currency`)
    .addColumn('processed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_ticket_report_refunds_ticket_report_id')
    .on('ticket_report_refunds')
    .column('ticket_report_id')
    .execute();

  await db.schema
    .createIndex('idx_ticket_report_refunds_reservation_id')
    .on('ticket_report_refunds')
    .column('order_ticket_reservation_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_ticket_report_refunds_reservation_id').ifExists().execute();
  await db.schema.dropIndex('idx_ticket_report_refunds_ticket_report_id').ifExists().execute();
  await db.schema.dropTable('ticket_report_refunds').ifExists().execute();

  await db.schema.dropIndex('idx_ticket_report_actions_ticket_report_id').ifExists().execute();
  await db.schema.dropTable('ticket_report_actions').ifExists().execute();

  await db.schema.dropIndex('idx_ticket_reports_entity').ifExists().execute();
  await db.schema.dropIndex('idx_ticket_reports_status').ifExists().execute();
  await db.schema.dropIndex('idx_ticket_reports_reported_by_user_id').ifExists().execute();
  await db.schema.dropTable('ticket_reports').ifExists().execute();

  await sql`DROP TYPE IF EXISTS ticket_report_refund_status`.execute(db);
  await sql`DROP TYPE IF EXISTS ticket_report_action_type`.execute(db);
  await sql`DROP TYPE IF EXISTS ticket_report_source`.execute(db);
  await sql`DROP TYPE IF EXISTS ticket_report_entity_type`.execute(db);
  await sql`DROP TYPE IF EXISTS ticket_report_case_type`.execute(db);
  await sql`DROP TYPE IF EXISTS ticket_report_status`.execute(db);
}
