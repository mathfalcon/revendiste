import type {Kysely} from 'kysely';
import {sql} from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Add 'rejected' value to verification_status_enum
  await sql`ALTER TYPE verification_status_enum ADD VALUE IF NOT EXISTS 'rejected'`.execute(
    db,
  );

  // Create verification_audit_logs table
  await db.schema
    .createTable('verificationAuditLogs')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('userId', 'uuid', col => col.notNull().references('users.id'))
    .addColumn('action', 'varchar(50)', col => col.notNull())
    .addColumn('previousStatus', 'varchar(50)')
    .addColumn('newStatus', 'varchar(50)')
    .addColumn('confidenceScores', 'jsonb')
    .addColumn('metadata', 'jsonb')
    .addColumn('createdAt', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Create indexes for efficient lookups
  await db.schema
    .createIndex('idx_verification_audit_logs_user_id')
    .on('verificationAuditLogs')
    .column('userId')
    .execute();

  await db.schema
    .createIndex('idx_verification_audit_logs_created_at')
    .on('verificationAuditLogs')
    .column('createdAt')
    .execute();

  await db.schema
    .createIndex('idx_verification_audit_logs_action')
    .on('verificationAuditLogs')
    .column('action')
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema
    .dropIndex('idx_verification_audit_logs_action')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_verification_audit_logs_created_at')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_verification_audit_logs_user_id')
    .ifExists()
    .execute();

  // Drop verification_audit_logs table
  await db.schema.dropTable('verificationAuditLogs').ifExists().execute();

  // Note: Cannot remove enum value in PostgreSQL without recreating the type
  // The 'rejected' value will remain in the enum
}
