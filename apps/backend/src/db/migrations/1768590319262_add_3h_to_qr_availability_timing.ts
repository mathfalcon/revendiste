import type {Kysely} from 'kysely';
import {sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add '3h' value to the qr_availability_timing enum
  await sql`ALTER TYPE qr_availability_timing ADD VALUE IF NOT EXISTS '3h' BEFORE '6h'`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  // Note: PostgreSQL doesn't support removing enum values directly
  // To properly rollback, you would need to:
  // 1. Create a new enum without '3h'
  // 2. Update all columns to use the new enum
  // 3. Drop the old enum
  // For simplicity, we'll leave this as a no-op since removing enum values is rarely needed
}
