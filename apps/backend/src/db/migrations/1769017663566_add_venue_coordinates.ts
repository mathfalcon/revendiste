import type {Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('events')
    .addColumn('venueLatitude', 'decimal(10, 8)') // Precision for lat (-90 to 90)
    .addColumn('venueLongitude', 'decimal(11, 8)') // Precision for lng (-180 to 180)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('events')
    .dropColumn('venueLatitude')
    .dropColumn('venueLongitude')
    .execute();
}
