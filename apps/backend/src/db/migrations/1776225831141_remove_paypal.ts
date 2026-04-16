import {sql, type Kysely} from 'kysely';

/**
 * Removes PayPal from payout methods, payout provider, and payment provider enums.
 * Deletes PayPal payout methods and associated payouts (pre-release; no prod data preservation).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE payments
    SET provider = 'dlocal'::payment_provider
    WHERE provider::text = 'paypal'
  `.execute(db);

  await sql`
    UPDATE processor_settlements
    SET payment_provider = 'dlocal'::payment_provider
    WHERE payment_provider::text = 'paypal'
  `.execute(db);

  await sql`
    DELETE FROM payouts p
    WHERE p.payout_provider = 'manual_paypal'::payout_provider
       OR EXISTS (
         SELECT 1 FROM payout_methods pm
         WHERE pm.id = p.payout_method_id AND pm.payout_type = 'paypal'::payout_type
       )
  `.execute(db);

  await sql`
    DELETE FROM payout_methods WHERE payout_type = 'paypal'::payout_type
  `.execute(db);

  await sql`CREATE TYPE payout_type_new AS ENUM ('uruguayan_bank')`.execute(db);
  await sql`
    ALTER TABLE payout_methods
    ALTER COLUMN payout_type TYPE payout_type_new
    USING (payout_type::text::payout_type_new)
  `.execute(db);
  await sql`DROP TYPE payout_type`.execute(db);
  await sql`ALTER TYPE payout_type_new RENAME TO payout_type`.execute(db);

  await sql`CREATE TYPE payout_provider_new AS ENUM ('manual_bank')`.execute(db);
  await sql`
    ALTER TABLE payouts
    ALTER COLUMN payout_provider DROP DEFAULT
  `.execute(db);
  await sql`
    ALTER TABLE payouts
    ALTER COLUMN payout_provider TYPE payout_provider_new
    USING (payout_provider::text::payout_provider_new)
  `.execute(db);
  await sql`DROP TYPE payout_provider`.execute(db);
  await sql`ALTER TYPE payout_provider_new RENAME TO payout_provider`.execute(db);
  await sql`
    ALTER TABLE payouts
    ALTER COLUMN payout_provider SET DEFAULT 'manual_bank'::payout_provider
  `.execute(db);

  await sql`
    CREATE TYPE payment_provider_new AS ENUM ('dlocal', 'stripe', 'mercadopago')
  `.execute(db);
  await sql`
    ALTER TABLE payments
    ALTER COLUMN provider TYPE payment_provider_new
    USING (provider::text::payment_provider_new)
  `.execute(db);
  await sql`
    ALTER TABLE processor_settlements
    ALTER COLUMN payment_provider DROP DEFAULT
  `.execute(db);
  await sql`
    ALTER TABLE processor_settlements
    ALTER COLUMN payment_provider TYPE payment_provider_new
    USING (payment_provider::text::payment_provider_new)
  `.execute(db);
  await sql`DROP TYPE payment_provider`.execute(db);
  await sql`ALTER TYPE payment_provider_new RENAME TO payment_provider`.execute(
    db,
  );
  await sql`
    ALTER TABLE processor_settlements
    ALTER COLUMN payment_provider SET DEFAULT 'dlocal'::payment_provider
  `.execute(db);
}

export async function down(): Promise<void> {
  throw new Error(
    'Down migration not supported: re-adding PayPal enum values requires manual steps.',
  );
}
