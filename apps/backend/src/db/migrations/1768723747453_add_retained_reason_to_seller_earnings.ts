import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create enum for retention reasons
  await sql`
    CREATE TYPE seller_earnings_retained_reason AS ENUM (
      'missing_document',
      'dispute',
      'fraud',
      'other'
    )
  `.execute(db);

  // Add column (nullable - only set when status = 'retained')
  await sql`
    ALTER TABLE seller_earnings 
    ADD COLUMN retained_reason seller_earnings_retained_reason
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove column
  await sql`
    ALTER TABLE seller_earnings 
    DROP COLUMN IF EXISTS retained_reason
  `.execute(db);

  // Drop enum
  await sql`DROP TYPE IF EXISTS seller_earnings_retained_reason`.execute(db);
}
