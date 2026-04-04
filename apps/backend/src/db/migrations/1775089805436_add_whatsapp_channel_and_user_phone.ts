import type {Kysely} from 'kysely';
import {sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Add 'whatsapp' to notification_channel enum
  await sql`
    ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'whatsapp'
  `.execute(db);

  // 2. Add phone_number and whatsapp_opted_in to users table
  await db.schema
    .alterTable('users')
    .addColumn('phone_number', 'varchar(20)') // E.164 format, e.g. +59899123456
    .execute();

  await db.schema
    .alterTable('users')
    .addColumn('whatsapp_opted_in', 'boolean', col => col.defaultTo(false).notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('whatsapp_opted_in').execute();
  await db.schema.alterTable('users').dropColumn('phone_number').execute();
  // Note: ALTER TYPE ... REMOVE VALUE is not supported in PostgreSQL.
  // The 'whatsapp' enum value will remain but is harmless.
}
