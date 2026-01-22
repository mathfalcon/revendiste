import type {Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Drop old venue columns from events table
  // These are replaced by the venueId foreign key to eventVenues table
  await db.schema
    .alterTable('events')
    .dropColumn('venueName')
    .dropColumn('venueAddress')
    .dropColumn('venueLatitude')
    .dropColumn('venueLongitude')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Re-add the old venue columns
  await db.schema
    .alterTable('events')
    .addColumn('venueName', 'varchar(255)')
    .addColumn('venueAddress', 'text', col => col.notNull().defaultTo(''))
    .addColumn('venueLatitude', 'decimal(10, 8)')
    .addColumn('venueLongitude', 'decimal(11, 8)')
    .execute();
}
