import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE payout_provider AS ENUM ('manual_bank', 'manual_paypal')`.execute(
    db,
  );

  await db.schema
    .alterTable('payouts')
    .addColumn('payout_provider', sql`payout_provider`, col =>
      col.notNull().defaultTo('manual_bank'),
    )
    .execute();

  await sql`
    UPDATE payouts p
    SET payout_provider = 'manual_paypal'
    FROM payout_methods pm
    WHERE p.payout_method_id = pm.id
      AND pm.payout_type = 'paypal'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('payouts')
    .dropColumn('payout_provider')
    .execute();

  await sql`DROP TYPE payout_provider`.execute(db);
}
