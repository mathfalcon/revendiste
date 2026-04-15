import {sql, type Kysely} from 'kysely';

/**
 * Payout hold end time is derived from events.event_end_date + PAYOUT_HOLD_PERIOD_HOURS.
 * Removes redundant hold_until column and index.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS seller_earnings_hold_until_idx`.execute(db);
  await db.schema.alterTable('seller_earnings').dropColumn('hold_until').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('seller_earnings')
    .addColumn('hold_until', 'timestamptz', col => col)
    .execute();

  await sql`
    UPDATE seller_earnings se
    SET hold_until = e.event_end_date + (48 * interval '1 hour')
    FROM listing_tickets lt
    INNER JOIN listings l ON l.id = lt.listing_id AND l.deleted_at IS NULL
    INNER JOIN event_ticket_waves etw ON etw.id = l.ticket_wave_id AND etw.deleted_at IS NULL
    INNER JOIN events e ON e.id = etw.event_id
    WHERE se.listing_ticket_id = lt.id
      AND lt.deleted_at IS NULL
  `.execute(db);

  await sql`
    UPDATE seller_earnings
    SET hold_until = created_at + (48 * interval '1 hour')
    WHERE hold_until IS NULL
  `.execute(db);

  await sql`
    ALTER TABLE seller_earnings
    ALTER COLUMN hold_until SET NOT NULL
  `.execute(db);

  await db.schema
    .createIndex('seller_earnings_hold_until_idx')
    .on('seller_earnings')
    .column('hold_until')
    .execute();
}
