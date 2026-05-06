import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('impersonationLogs')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('adminUserId', 'uuid', col =>
      col.notNull().references('users.id').onDelete('restrict'),
    )
    .addColumn('targetUserId', 'uuid', col =>
      col.notNull().references('users.id').onDelete('restrict'),
    )
    .addColumn('reason', 'text')
    .addColumn('ipAddress', 'varchar(255)', col => col.notNull())
    .addColumn('createdAt', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_impersonation_logs_admin_user_id')
    .on('impersonationLogs')
    .column('adminUserId')
    .execute();

  await db.schema
    .createIndex('idx_impersonation_logs_target_user_id')
    .on('impersonationLogs')
    .column('targetUserId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('idx_impersonation_logs_target_user_id')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_impersonation_logs_admin_user_id')
    .ifExists()
    .execute();
  await db.schema.dropTable('impersonationLogs').ifExists().execute();
}
