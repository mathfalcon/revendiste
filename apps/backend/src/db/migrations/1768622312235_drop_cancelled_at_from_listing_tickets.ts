import {Kysely, sql} from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Drop cancelled_at column from listing_tickets table
  // This column was redundant with deleted_at - we use deleted_at for cancelled/removed tickets
  await db.schema
    .alterTable('listing_tickets')
    .dropColumn('cancelled_at')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Re-add cancelled_at column
  await db.schema
    .alterTable('listing_tickets')
    .addColumn('cancelled_at', 'timestamptz')
    .execute();
}
