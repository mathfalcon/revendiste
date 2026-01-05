import {Kysely, sql} from 'kysely';

/**
 * Add Clerk authentication notification types to the notification_type enum.
 *
 * These notification types are used for Clerk webhook-triggered auth emails:
 * - auth_verification_code: OTP for email verification
 * - auth_reset_password_code: OTP for password reset
 * - auth_invitation: User invitation email
 * - auth_password_changed: Password change notification
 * - auth_password_removed: Password removal notification
 * - auth_primary_email_changed: Primary email change notification
 * - auth_new_device_sign_in: New device sign-in alert
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Step 1: Convert column to text temporarily
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE text
  `.execute(db);

  // Step 2: Drop the old enum
  await sql`DROP TYPE notification_type`.execute(db);

  // Step 3: Create new enum with all values (including new auth types)
  await sql`
    CREATE TYPE notification_type AS ENUM (
      'ticket_sold_seller',
      'document_reminder',
      'document_uploaded',
      'order_confirmed',
      'order_expired',
      'payment_failed',
      'payment_succeeded',
      'payout_processing',
      'payout_completed',
      'payout_failed',
      'payout_cancelled',
      'auth_verification_code',
      'auth_reset_password_code',
      'auth_invitation',
      'auth_password_changed',
      'auth_password_removed',
      'auth_primary_email_changed',
      'auth_new_device_sign_in'
    )
  `.execute(db);

  // Step 4: Convert column back to use the new enum
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Step 1: Convert column to text temporarily
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE text
  `.execute(db);

  // Step 2: Drop the enum with auth types
  await sql`DROP TYPE notification_type`.execute(db);

  // Step 3: Create enum without auth types
  await sql`
    CREATE TYPE notification_type AS ENUM (
      'ticket_sold_seller',
      'document_reminder',
      'document_uploaded',
      'order_confirmed',
      'order_expired',
      'payment_failed',
      'payment_succeeded',
      'payout_processing',
      'payout_completed',
      'payout_failed',
      'payout_cancelled'
    )
  `.execute(db);

  // Step 4: Delete any auth notification records before converting
  await sql`
    DELETE FROM notifications
    WHERE type IN (
      'auth_verification_code',
      'auth_reset_password_code',
      'auth_invitation',
      'auth_password_changed',
      'auth_password_removed',
      'auth_primary_email_changed',
      'auth_new_device_sign_in'
    )
  `.execute(db);

  // Step 5: Convert column back to use the old enum
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type
  `.execute(db);
}
