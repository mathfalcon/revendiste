import type {Kysely} from 'kysely';

/**
 * Adds exchange_rate column to payments table.
 *
 * This stores the calculated exchange rate when dLocal settles payments:
 * exchange_rate = (balance_amount + balance_fee) / amount
 *
 * Example: For a $53.66 USD payment settled as 2019.94 UYU (after 50.26 UYU fee):
 * exchange_rate = (2019.94 + 50.26) / 53.66 = 38.58
 *
 * The existing columns already store:
 * - balance_amount: Amount credited to our account (settlement amount)
 * - balance_currency: Settlement currency (UYU for us)
 * - balance_fee: dLocal's commission
 * - payer_country: Buyer's country
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('payments')
    .addColumn('exchange_rate', 'numeric(18, 8)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('payments')
    .dropColumn('exchange_rate')
    .execute();
}
