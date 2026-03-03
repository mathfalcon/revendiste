import type { Kysely } from 'kysely';

/**
 * Add send_via_job to notifications.
 * true = delivery must go through send-notification job; false = can call sendNotification directly.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('notifications')
    .addColumn('send_via_job', 'boolean', col =>
      col.notNull().defaultTo(false),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('notifications')
    .dropColumn('send_via_job')
    .execute();
}
