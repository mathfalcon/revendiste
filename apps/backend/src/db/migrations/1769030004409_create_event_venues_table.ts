import type {Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create eventVenues table
  await db.schema
    .createTable('eventVenues')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(db.fn('gen_random_uuid')),
    )
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('address', 'text', col => col.notNull())
    .addColumn('city', 'varchar(100)', col => col.notNull())
    .addColumn('country', 'varchar(100)', col => col.notNull().defaultTo('Uruguay'))
    .addColumn('googlePlaceId', 'varchar(255)')
    .addColumn('latitude', 'decimal(10, 8)')
    .addColumn('longitude', 'decimal(11, 8)')
    .addColumn('createdAt', 'timestamptz', col =>
      col.notNull().defaultTo(db.fn('now')),
    )
    .addColumn('updatedAt', 'timestamptz', col =>
      col.notNull().defaultTo(db.fn('now')),
    )
    .addColumn('deletedAt', 'timestamptz')
    .execute();

  // Create unique index on googlePlaceId for deduplication
  await db.schema
    .createIndex('idx_event_venues_google_place_id')
    .on('eventVenues')
    .column('googlePlaceId')
    .unique()
    .where('googlePlaceId', 'is not', null)
    .execute();

  // Create index on city for filtering
  await db.schema
    .createIndex('idx_event_venues_city')
    .on('eventVenues')
    .column('city')
    .execute();

  // Create spatial-like index for coordinate lookups
  await db.schema
    .createIndex('idx_event_venues_coordinates')
    .on('eventVenues')
    .columns(['latitude', 'longitude'])
    .where('latitude', 'is not', null)
    .execute();

  // Add venueId to events table (keeping old columns for now)
  await db.schema
    .alterTable('events')
    .addColumn('venueId', 'uuid', col =>
      col.references('eventVenues.id').onDelete('set null'),
    )
    .execute();

  // Create index on venueId for joins
  await db.schema
    .createIndex('idx_events_venue_id')
    .on('events')
    .column('venueId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop venueId index
  await db.schema.dropIndex('idx_events_venue_id').execute();

  // Drop venueId column
  await db.schema.alterTable('events').dropColumn('venueId').execute();

  // Drop eventVenues indexes
  await db.schema.dropIndex('idx_event_venues_coordinates').execute();
  await db.schema.dropIndex('idx_event_venues_city').execute();
  await db.schema.dropIndex('idx_event_venues_google_place_id').execute();

  // Drop eventVenues table
  await db.schema.dropTable('eventVenues').execute();
}
