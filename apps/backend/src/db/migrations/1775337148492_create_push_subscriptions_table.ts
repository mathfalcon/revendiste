import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('pushSubscriptions')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('userId', 'uuid', col =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('endpoint', 'text', col => col.notNull())
    .addColumn('p256dh', 'text', col => col.notNull())
    .addColumn('auth', 'text', col => col.notNull())
    .addColumn('userAgent', 'text')
    .addColumn('createdAt', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updatedAt', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_push_subscriptions_endpoint')
    .on('pushSubscriptions')
    .column('endpoint')
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_push_subscriptions_user_id')
    .on('pushSubscriptions')
    .column('userId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pushSubscriptions').execute();
}
