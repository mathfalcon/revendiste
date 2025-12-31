import type {Kysely} from 'kysely';
import {sql} from 'kysely';

/**
 * Add 'status_synced' to payment_event_type enum
 *
 * This event type is used to track manual payment status syncs (when we poll the provider),
 * as opposed to 'webhook_received' which is used when the provider calls our webhook.
 * This distinction is important for audit trails and debugging.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Add new enum value to payment_event_type
  await sql`ALTER TYPE payment_event_type ADD VALUE IF NOT EXISTS 'status_synced'`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  // PostgreSQL doesn't support removing enum values directly
  // We would need to recreate the enum type, which is complex and risky
  // Leaving this as a no-op since the value being present doesn't cause issues
}
