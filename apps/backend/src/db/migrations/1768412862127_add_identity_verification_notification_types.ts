import type {Kysely} from 'kysely';
import {sql} from 'kysely';

/**
 * Add identity verification notification types to notification_type enum
 *
 * Types added:
 * - identity_verification_completed: User verified successfully (auto or admin approved) - sends email
 * - identity_verification_rejected: Admin rejected verification - sends email
 * - identity_verification_failed: System failure (face mismatch, liveness fail) - in_app only
 * - identity_verification_manual_review: Borderline scores, needs admin review - in_app only
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Add new identity verification notification types to the enum
  await sql`
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'identity_verification_completed'
  `.execute(db);

  await sql`
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'identity_verification_rejected'
  `.execute(db);

  await sql`
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'identity_verification_failed'
  `.execute(db);

  await sql`
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'identity_verification_manual_review'
  `.execute(db);
}

// Down migration: Cannot remove enum values in PostgreSQL
// The only way to remove enum values is to recreate the type entirely
// which is complex and risky with existing data.
// This is intentionally left empty - enum values should be considered permanent.
export async function down(_db: Kysely<any>): Promise<void> {
  // Cannot remove enum values in PostgreSQL without recreating the type
  // See: https://www.postgresql.org/docs/current/sql-altertype.html
  console.warn(
    'Down migration for notification_type enum values is not supported. ' +
      'Enum values cannot be removed in PostgreSQL without recreating the type.',
  );
}
