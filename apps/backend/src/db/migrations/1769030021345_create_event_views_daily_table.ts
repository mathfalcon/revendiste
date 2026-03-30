import type {Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('eventViewsDaily')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(db.fn('gen_random_uuid')),
    )
    .addColumn('eventId', 'uuid', col =>
      col.notNull().references('events.id').onDelete('cascade'),
    )
    .addColumn('date', 'date', col => col.notNull())
    .addColumn('viewCount', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'timestamptz', col =>
      col.notNull().defaultTo(db.fn('now')),
    )
    .addColumn('updatedAt', 'timestamptz', col =>
      col.notNull().defaultTo(db.fn('now')),
    )
    .addUniqueConstraint('unique_event_date', ['eventId', 'date'])
    .execute();

  // Index for trending queries (getting top events by views in a date range)
  await db.schema
    .createIndex('idx_event_views_daily_date')
    .on('eventViewsDaily')
    .column('date')
    .execute();

  // Index for getting views for a specific event
  await db.schema
    .createIndex('idx_event_views_daily_event_id')
    .on('eventViewsDaily')
    .column('eventId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_event_views_daily_event_id').execute();
  await db.schema.dropIndex('idx_event_views_daily_date').execute();
  await db.schema.dropTable('eventViewsDaily').execute();
}
