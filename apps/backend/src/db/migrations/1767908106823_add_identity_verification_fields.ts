import type {Kysely} from 'kysely';
import {sql} from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Create enum for document types
  await db.schema
    .createType('document_type_enum')
    .asEnum(['ci_uy', 'dni_ar', 'passport'])
    .execute();

  // Create enum for verification status
  await db.schema
    .createType('verification_status_enum')
    .asEnum(['pending', 'completed', 'requires_manual_review', 'failed'])
    .execute();

  // Add new columns to users table
  await db.schema
    .alterTable('users')
    .addColumn('document_type', sql`document_type_enum`)
    .addColumn('document_number', 'varchar(50)')
    .addColumn('document_country', 'varchar(3)') // ISO 3166-1 alpha-3 code for passports
    .addColumn('document_verified', 'boolean', col => col.defaultTo(false))
    .addColumn('verification_status', sql`verification_status_enum`, col =>
      col.defaultTo('pending'),
    )
    .addColumn('document_verified_at', 'timestamptz')
    .addColumn('verification_session_id', 'varchar(255)')
    .addColumn('verification_confidence_scores', 'jsonb') // Stores text, face match, liveness scores
    .addColumn('document_image_path', 'varchar(500)') // R2 path for document (encrypted at rest)
    .addColumn('selfie_image_path', 'varchar(500)') // R2 path for selfie (encrypted at rest)
    .addColumn('verification_metadata', 'jsonb') // Additional audit data
    .addColumn('manual_review_reason', 'text') // Reason for manual review if needed
    .addColumn('verification_attempts', 'integer', col => col.defaultTo(0)) // Track verification attempts
    .execute();

  // Create indexes for efficient lookups
  await db.schema
    .createIndex('idx_users_document_verified')
    .on('users')
    .column('document_verified')
    .execute();

  // Create unique partial index for verified documents
  await db.schema
    .createIndex('idx_users_document_number')
    .on('users')
    .columns(['document_type', 'document_number', 'document_country'])
    .unique()
    // @ts-expect-error - Kysely's migration builder does not support partial indexes directly: use raw SQL for unique partial index
    .where('document_verified', '=', true)
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema.dropIndex('idx_users_document_number').execute();
  await db.schema.dropIndex('idx_users_document_verified').execute();

  // Drop columns from users table
  await db.schema
    .alterTable('users')
    .dropColumn('verification_attempts')
    .dropColumn('manual_review_reason')
    .dropColumn('verification_metadata')
    .dropColumn('selfie_image_path')
    .dropColumn('document_image_path')
    .dropColumn('verification_confidence_scores')
    .dropColumn('verification_session_id')
    .dropColumn('document_verified_at')
    .dropColumn('verification_status')
    .dropColumn('document_verified')
    .dropColumn('document_country')
    .dropColumn('document_number')
    .dropColumn('document_type')
    .execute();

  // Drop enums
  await db.schema.dropType('verification_status_enum').execute();
  await db.schema.dropType('document_type_enum').execute();
}
