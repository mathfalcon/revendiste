import type {Kysely} from 'kysely';
import {sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('otp_verifications')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', col =>
      col.references('users.id').onDelete('cascade').notNull(),
    )
    .addColumn('phone_number', 'varchar(20)', col => col.notNull())
    .addColumn('code_hash', 'varchar(128)', col => col.notNull())
    .addColumn('expires_at', 'timestamptz', col => col.notNull())
    .addColumn('attempts', 'integer', col => col.defaultTo(0).notNull())
    .addColumn('verified', 'boolean', col => col.defaultTo(false).notNull())
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`NOW()`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_otp_verifications_user_created')
    .on('otp_verifications')
    .columns(['user_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_otp_verifications_user_created').execute();
  await db.schema.dropTable('otp_verifications').execute();
}
