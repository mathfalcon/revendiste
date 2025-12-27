import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add 'paypal' to payout_type enum
  await sql`ALTER TYPE payout_type ADD VALUE 'paypal'`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // PostgreSQL doesn't support removing enum values directly
  // This would require recreating the enum and updating all references
  // For now, we'll leave it as a no-op with a comment
  // In production, you would need to:
  // 1. Create a new enum without 'paypal'
  // 2. Update all columns using payout_type to use the new enum
  // 3. Drop the old enum
  // 4. Rename the new enum to payout_type
  throw new Error(
    'Cannot remove enum value directly. Manual migration required.',
  );
}
