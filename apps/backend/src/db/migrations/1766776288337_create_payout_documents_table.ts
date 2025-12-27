import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('payout_documents')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('payout_id', 'uuid', col =>
      col.notNull().references('payouts.id').onDelete('cascade'),
    )
    // Document storage info
    .addColumn('storage_path', 'varchar(500)', col => col.notNull())
    .addColumn('file_name', 'varchar(255)', col => col.notNull())
    .addColumn('original_name', 'varchar(255)', col => col.notNull())
    .addColumn('mime_type', 'varchar(100)', col => col.notNull())
    .addColumn('size_bytes', 'integer', col => col.notNull())
    // Document metadata
    .addColumn('document_type', 'varchar(50)', col =>
      col.notNull().defaultTo('voucher'),
    )
    // Timestamps
    .addColumn('uploaded_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('uploaded_by', 'uuid', col =>
      col.notNull().references('users.id'),
    )
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create indexes for performance
  await db.schema
    .createIndex('idx_payout_documents_payout_id')
    .on('payout_documents')
    .column('payout_id')
    .execute();

  // Create partial index for active documents
  await sql`
    CREATE INDEX idx_payout_documents_active
    ON payout_documents (payout_id)
    WHERE deleted_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('idx_payout_documents_active')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_payout_documents_payout_id')
    .ifExists()
    .execute();

  await db.schema.dropTable('payout_documents').ifExists().execute();
}
