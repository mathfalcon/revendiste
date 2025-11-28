import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('ticket_documents')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('ticket_id', 'uuid', col =>
      col.notNull().references('listing_tickets.id').onDelete('cascade'),
    )
    // Document storage info
    .addColumn('storage_path', 'varchar(500)', col => col.notNull())
    .addColumn('file_name', 'varchar(255)', col => col.notNull())
    .addColumn('original_name', 'varchar(255)', col => col.notNull())
    .addColumn('mime_type', 'varchar(100)', col => col.notNull())
    .addColumn('size_bytes', 'integer', col => col.notNull())
    // Document metadata
    .addColumn('document_type', 'varchar(50)', col =>
      col.notNull().defaultTo('ticket'),
    )
    .addColumn('version', 'integer', col => col.notNull().defaultTo(1))
    .addColumn('is_primary', 'boolean', col => col.notNull().defaultTo(true))
    // Workflow/status
    .addColumn('status', 'varchar(50)', col =>
      col.notNull().defaultTo('verified'),
    )
    .addColumn('verified_at', 'timestamptz')
    .addColumn('verified_by', 'uuid', col => col.references('users.id'))
    // Timestamps
    .addColumn('uploaded_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
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
  // Note: Composite index (ticket_id, is_primary) can also serve queries on just ticket_id
  await db.schema
    .createIndex('idx_ticket_documents_primary')
    .on('ticket_documents')
    .columns(['ticket_id', 'is_primary'])
    .execute();

  await db.schema
    .createIndex('idx_ticket_documents_status')
    .on('ticket_documents')
    .column('status')
    .execute();

  // Create partial index for active documents
  await sql`
    CREATE INDEX idx_ticket_documents_active
    ON ticket_documents (ticket_id)
    WHERE deleted_at IS NULL
  `.execute(db);

  // Add constraint to ensure only one primary document per ticket
  await sql`
    CREATE UNIQUE INDEX idx_ticket_documents_one_primary_per_ticket
    ON ticket_documents (ticket_id)
    WHERE is_primary = true AND deleted_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the ticket_documents table and all indexes
  await db.schema
    .dropIndex('idx_ticket_documents_one_primary_per_ticket')
    .ifExists()
    .execute();
  await db.schema.dropIndex('idx_ticket_documents_active').ifExists().execute();
  await db.schema.dropIndex('idx_ticket_documents_status').ifExists().execute();
  await db.schema
    .dropIndex('idx_ticket_documents_primary')
    .ifExists()
    .execute();

  await db.schema.dropTable('ticket_documents').ifExists().execute();
}
