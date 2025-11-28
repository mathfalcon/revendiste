# Ticket Document Refactor - Migration Guide

## Overview

This document outlines the refactoring of ticket document storage from columns in the `listing_tickets` table to a separate `ticket_documents` table.

## Why Refactor?

### Before (Columns in listing_tickets)

- ❌ No document versioning
- ❌ Hard to add multiple documents
- ❌ Clutters the tickets table
- ❌ Limited workflow capabilities
- ❌ Difficult to add features

### After (Separate ticket_documents table)

- ✅ Document versioning support
- ✅ Multiple documents per ticket
- ✅ Clean separation of concerns
- ✅ Workflow and approval states
- ✅ Easy to extend with new features

## Changes Made

### 1. Database Migration

**File**: `apps/backend/src/db/migrations/1763083970470_add_ticket_document_fields.ts`

**Changed from**: Adding columns to `listing_tickets`
**Changed to**: Creating new `ticket_documents` table

### 2. New Repository

**File**: `apps/backend/src/repositories/ticket-documents/index.ts`

Created `TicketDocumentsRepository` with methods for:

- Creating, reading, updating, and soft-deleting documents
- Managing primary documents and versions
- Finding tickets without documents
- Document verification workflow

### 3. Updated Service

**File**: `apps/backend/src/services/ticket-documents/index.ts`

Updated `TicketDocumentService` to:

- Use the new `TicketDocumentsRepository`
- Support document versioning
- Handle primary document replacement
- Return document history

### 4. Updated Documentation

**File**: `apps/backend/docs/ticket-document-system.md`

Updated to reflect new architecture and capabilities.

## Migration Steps

### Step 1: Rollback Existing Migration (if already run)

If you've already run the migration that added columns to `listing_tickets`, you need to rollback:

```bash
cd apps/backend
npm run db:migrate:down
```

### Step 2: Run the New Migration

```bash
npm run db:migrate:latest
```

This will create the `ticket_documents` table with all necessary indexes and constraints.

### Step 3: Verify Database

Check that the new table was created:

```sql
-- List all columns in ticket_documents
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ticket_documents'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ticket_documents';
```

### Step 4: Update Type Definitions

Run the type generation script to update TypeScript types:

```bash
npm run db:generate-types
```

### Step 5: Test the Service

```typescript
// Example: Upload a document
const service = new TicketDocumentService(db);
const result = await service.uploadTicketDocument(ticketId, userId, {
  buffer: fileBuffer,
  originalName: 'ticket.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 12345,
});

// Result includes:
// - document: Full document record with version
// - documentUrl: URL to access the document

// Example: Get ticket info with document history
const info = await service.getTicketInfo(ticketId, userId);
// Returns:
// - document: Primary document details
// - documentHistory: All versions of documents for this ticket
```

## Database Schema

### ticket_documents Table

```sql
CREATE TABLE ticket_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES listing_tickets(id) ON DELETE CASCADE,

  -- Storage info
  storage_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,

  -- Document metadata
  document_type VARCHAR(50) NOT NULL DEFAULT 'ticket',
  version INTEGER NOT NULL DEFAULT 1,
  is_primary BOOLEAN NOT NULL DEFAULT true,

  -- Workflow/status
  status VARCHAR(50) NOT NULL DEFAULT 'verified',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),

  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### Indexes

```sql
-- Fast lookup by ticket
CREATE INDEX idx_ticket_documents_ticket_id ON ticket_documents (ticket_id);

-- Fast lookup of primary documents
CREATE INDEX idx_ticket_documents_primary ON ticket_documents (ticket_id, is_primary);

-- Filter by status
CREATE INDEX idx_ticket_documents_status ON ticket_documents (status);

-- Active (non-deleted) documents
CREATE INDEX idx_ticket_documents_active ON ticket_documents (ticket_id)
WHERE deleted_at IS NULL;

-- Ensure only one primary per ticket
CREATE UNIQUE INDEX idx_ticket_documents_one_primary_per_ticket
ON ticket_documents (ticket_id)
WHERE is_primary = true AND deleted_at IS NULL;
```

## Key Features

### 1. Document Versioning

Every time a seller uploads a new document, it creates a new version:

```typescript
// First upload
const v1 = await service.uploadTicketDocument(...); // version: 1

// Replace document
const v2 = await service.uploadTicketDocument(...); // version: 2
// v1 is marked as 'replaced' and is_primary: false
// v2 is marked as 'verified' and is_primary: true
```

### 2. Document History

View all versions of documents for a ticket:

```typescript
const info = await service.getTicketInfo(ticketId, userId);
console.log(info.documentHistory);
// [
//   { id: '...', version: 2, isPrimary: true, status: 'verified', ... },
//   { id: '...', version: 1, isPrimary: false, status: 'replaced', ... }
// ]
```

### 3. Document Status

Documents can have different statuses:

- `verified` - Approved and ready to use (default)
- `replaced` - Old version replaced by new upload
- `rejected` - Failed verification (future use)
- `pending` - Awaiting verification (future use)

### 4. Soft Deletes

Documents are soft-deleted, preserving history:

```typescript
await service.deleteTicketDocument(ticketId, userId);
// Sets deleted_at timestamp, doesn't physically delete
```

## Future Enhancements

With this new architecture, you can easily add:

1. **Document Approval Workflow**

   ```typescript
   await repository.verifyDocument(documentId, adminUserId);
   await repository.rejectDocument(documentId, adminUserId);
   ```

2. **Multiple Document Types**

   ```typescript
   {
     document_type: 'ticket';
   }
   {
     document_type: 'receipt';
   }
   {
     document_type: 'id_verification';
   }
   ```

3. **Batch Operations**

   ```typescript
   await repository.getTicketsWithoutDocuments();
   // Returns all sold tickets missing documents
   ```

4. **Analytics**
   - Track upload rates
   - Monitor verification times
   - Version history analysis

## Rollback Plan

If you need to rollback to the old structure:

```bash
# Rollback the migration
npm run db:migrate:down

# The old ListingTicketsRepository methods will need to be restored
# Service layer will need to be reverted
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Can upload a document for a sold ticket
- [ ] Can download a document as seller
- [ ] Can download a document as buyer (with orderId)
- [ ] Uploading again creates version 2 and marks version 1 as replaced
- [ ] Can delete a document (soft delete)
- [ ] Can get list of tickets without documents
- [ ] Can get ticket info with document history
- [ ] Primary document constraint works (only one primary per ticket)
- [ ] Cascade delete works (deleting ticket deletes documents)

## Questions or Issues?

See:

- Main documentation: `ticket-document-system.md`
- S3 setup: `s3-quick-setup.md`
- Storage provider interface: `src/services/storage/IStorageProvider.ts`
