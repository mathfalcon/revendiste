import {sql, type Kysely} from 'kysely';

/**
 * Migration to add 'document_uploaded_batch' notification type.
 *
 * This type is used for consolidated notifications when multiple
 * ticket documents are uploaded within a debounce window.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Add new value to the notification_type enum
  await sql`
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'document_uploaded_batch'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Note: PostgreSQL doesn't support removing enum values directly.
  // The down migration would require recreating the enum, which is complex
  // and potentially dangerous. In practice, we leave the enum value in place.
  // If needed, manually handle via:
  // 1. Create new enum without the value
  // 2. Update all columns to use new enum
  // 3. Drop old enum
  // 4. Rename new enum
}
