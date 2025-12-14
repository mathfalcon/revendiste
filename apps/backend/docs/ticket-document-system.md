# Ticket Document System

## Overview

The ticket document system allows sellers to upload physical ticket documents (PDFs, images, etc.) after their listings are sold. Buyers can then download these documents to access their purchased tickets.

## Architecture

### Storage Abstraction Layer

The system uses an abstraction layer to decouple storage implementation from business logic. This allows easy migration from local file storage to cloud storage (e.g., AWS S3) in the future.

```
IStorageProvider (Interface)
    ├── LocalStorageProvider (Current Implementation)
    └── S3StorageProvider (Future Implementation)
```

#### Key Components:

1. **`IStorageProvider`** - Interface defining storage operations

   - `upload()` - Upload a file
   - `delete()` - Delete a file
   - `getUrl()` - Get public URL for a file
   - `exists()` - Check if file exists
   - `getBuffer()` - Download file buffer

2. **`LocalStorageProvider`** - Local filesystem implementation

   - Stores files in `./uploads` directory (configurable)
   - Generates unique filenames using UUID
   - Supports multiple file types (PDF, JPEG, PNG, WebP)

3. **`StorageFactory`** - Factory pattern for provider instantiation
   - Creates appropriate provider based on `STORAGE_TYPE` env var
   - Singleton pattern for efficiency

### Database Schema

### New `ticket_documents` Table

Separate table for managing ticket documents with versioning support:

| Column          | Type         | Description                                 |
| --------------- | ------------ | ------------------------------------------- |
| `id`            | uuid         | Primary key                                 |
| `ticket_id`     | uuid         | Foreign key to listing_tickets              |
| `storage_path`  | varchar(500) | Path to document in storage                 |
| `file_name`     | varchar(255) | Filename in storage                         |
| `original_name` | varchar(255) | Original filename from upload               |
| `mime_type`     | varchar(100) | MIME type (e.g., 'application/pdf')         |
| `size_bytes`    | integer      | File size in bytes                          |
| `document_type` | varchar(50)  | Document category (default: 'ticket')       |
| `version`       | integer      | Document version number                     |
| `is_primary`    | boolean      | Whether this is the primary/active document |
| `status`        | varchar(50)  | Document status (verified, replaced, etc.)  |
| `verified_at`   | timestamptz  | When document was verified                  |
| `verified_by`   | uuid         | User who verified the document              |
| `uploaded_at`   | timestamptz  | When document was uploaded                  |
| `created_at`    | timestamptz  | Record creation timestamp                   |
| `updated_at`    | timestamptz  | Last update timestamp                       |
| `deleted_at`    | timestamptz  | Soft delete timestamp                       |

**Indexes:**

- `idx_ticket_documents_ticket_id` - Fast lookup by ticket
- `idx_ticket_documents_primary` - Fast lookup of primary documents
- `idx_ticket_documents_status` - Filter by status
- `idx_ticket_documents_active` - Active (non-deleted) documents
- `idx_ticket_documents_one_primary_per_ticket` - Ensures only one primary per ticket

**Benefits of Separate Table:**

- ✅ **Document versioning** - Keep history of all uploads
- ✅ **Multiple documents** - Support for additional documents per ticket
- ✅ **Better workflow** - Document status tracking and approval
- ✅ **Cleaner schema** - Ticket data separate from document metadata
- ✅ **Easier to extend** - Add features without cluttering main table

### Repository Layer

**`TicketDocumentsRepository`** provides:

- `create()` - Create new document record
- `getPrimaryDocument()` - Get the primary document for a ticket
- `getAllDocuments()` - Get all documents including versions
- `getById()` - Get document by ID
- `update()` - Update document metadata
- `softDelete()` - Soft delete a document
- `replacePrimaryDocument()` - Mark old as replaced, set new as primary
- `getTicketsWithoutDocuments()` - Find tickets needing uploads
- `verifyDocument()` - Mark document as verified
- `rejectDocument()` - Mark document as rejected
- `getDocumentCount()` - Count documents for a ticket

### Service Layer

**`TicketDocumentService`** provides the following methods (with versioning support):

#### For Sellers:

- `uploadTicketDocument(ticketId, userId, file)` - Upload document (creates new version if exists)
- `deleteTicketDocument(ticketId, userId)` - Soft delete the primary document
- `getTicketsRequiringUpload(userId)` - List sold tickets without documents
- `getTicketInfo(ticketId, userId)` - Get ticket with document status and version history

#### For Buyers:

- `getTicketDocument(ticketId, userId, orderId)` - Download purchased ticket document (primary version)

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Storage Configuration
STORAGE_TYPE=local                    # Options: 'local' or 's3'
STORAGE_LOCAL_PATH=./uploads          # Path for local storage
STORAGE_BASE_URL=/uploads             # Base URL for accessing files
```

### File Storage Location

By default, files are stored in `./uploads` directory relative to the backend root. This directory is gitignored.

Structure:

```
uploads/
  └── tickets/
      └── {event-id}/
          └── ticket-{ticket-id}.{ext}
```

## Security & Validation

### File Type Validation

Allowed file types:

- `application/pdf`
- `image/jpeg`, `image/jpg`
- `image/png`
- `image/webp`

### File Size Limits

- Maximum file size: **10MB**

### Access Control

**Upload (Sellers only):**

- User must own the listing
- Ticket must be sold
- Only one document per ticket (replaces existing)

**Download (Buyers & Sellers):**

- Sellers can download their own tickets
- Buyers can download tickets from confirmed orders only
- Requires order ID for buyer access

## AWS S3 Storage (Implemented ✅)

AWS S3 storage provider is fully implemented and ready to use!

### Quick Setup

1. **Install AWS SDK:**

   ```bash
   pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Update `.env`:**

   ```env
   STORAGE_TYPE=s3
   AWS_S3_BUCKET=your-bucket-name
   AWS_S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=wJal...
   ```

3. **Restart** your application

That's it! See our detailed guides:

- **[S3 Quick Setup Guide](./s3-quick-setup.md)** - Fast track setup (5 minutes)
- **[Complete S3 Migration Guide](./s3-migration-guide.md)** - Detailed instructions with security best practices

### Features Included

✅ Direct S3 upload/download
✅ CloudFront CDN support
✅ Signed URLs for secure access
✅ Automatic MIME type handling
✅ Error handling and logging
✅ Easy rollback to local storage

## Future Enhancements

### 1. Notification System

Implement a notification system to remind sellers to upload tickets before event date:

**Cronjob Implementation:**

```typescript
import cron from 'node-cron';
import {db} from '~/db';
import {ListingTicketsRepository} from '~/repositories';
import {NotificationService} from '~/services/notifications';

// Run every 6 hours
cron.schedule('0 */6 * * *', async () => {
  const ticketsRepo = new ListingTicketsRepository(db);
  const notificationService = new NotificationService();

  // Find tickets needing notification (12 hours before event)
  const tickets = await ticketsRepo.getTicketsNeedingUploadNotification(12);

  for (const ticket of tickets) {
    try {
      await notificationService.sendTicketUploadReminder({
        userId: ticket.publisherUserId,
        ticketId: ticket.id,
        eventName: ticket.eventName,
        eventStartDate: ticket.eventStartDate,
      });

      await ticketsRepo.markTicketAsNotified(ticket.id);
    } catch (error) {
      logger.error('Failed to send ticket upload notification', {
        ticketId: ticket.id,
        error,
      });
    }
  }
});
```

### 2. Document Status Tracking

Add more granular status tracking:

```sql
CREATE TYPE document_status AS ENUM (
  'pending',           -- Awaiting upload
  'uploaded',          -- Document uploaded
  'verified',          -- Document verified (future: OCR/validation)
  'rejected',          -- Document rejected (future: manual review)
  'expired'            -- Event passed, document expired
);

ALTER TABLE listing_tickets
ADD COLUMN document_status document_status DEFAULT 'pending';
```

### 3. Image Processing

For image documents, consider adding:

- Thumbnail generation
- Format conversion (e.g., HEIC to JPEG)
- Compression
- OCR for QR code extraction/validation

### 4. Batch Operations

Allow sellers to upload multiple tickets at once:

- ZIP file upload with automatic extraction
- Bulk upload API endpoint
- Progress tracking

## API Endpoints (To Be Implemented)

When implementing the controller layer, consider these endpoints:

```typescript
// Seller endpoints
POST   /api/tickets/:ticketId/document       // Upload document
GET    /api/tickets/:ticketId/document       // Get document info
DELETE /api/tickets/:ticketId/document       // Delete document
GET    /api/tickets/pending-upload           // List tickets needing upload

// Buyer endpoints
GET    /api/orders/:orderId/tickets/:ticketId/document  // Download ticket
```

## Monitoring & Logging

The system logs the following events:

- `File uploaded to local storage` - Document upload success
- `File deleted from local storage` - Document deletion
- `Ticket document uploaded successfully` - Service-level success
- `Ticket document deleted successfully` - Service-level deletion

Monitor these metrics:

- Number of sold tickets without documents
- Average time from sale to document upload
- Failed upload attempts
- Storage usage

## Testing Considerations

### Unit Tests

Test the following components:

- `LocalStorageProvider` - File operations
- `TicketDocumentService` - Business logic
- `ListingTicketsRepository` - Database queries

### Integration Tests

- End-to-end upload flow
- Access control verification
- File type validation
- File size limits
- Error handling

### Load Tests

- Concurrent uploads
- Large file uploads
- Storage capacity limits

## Troubleshooting

### Issue: Files not persisting

**Cause**: The `./uploads` directory might not have proper permissions or doesn't exist.

**Solution**:

```bash
mkdir -p apps/backend/uploads
chmod 755 apps/backend/uploads
```

### Issue: "File too large" errors

**Cause**: Express body parser might have a size limit.

**Solution**: Update Express configuration:

```typescript
app.use(express.json({limit: '10mb'}));
app.use(express.raw({limit: '10mb', type: 'application/octet-stream'}));
```

### Issue: Cannot find uploaded files

**Cause**: File paths might be stored incorrectly.

**Solution**: Check that `STORAGE_BASE_URL` is configured correctly and matches your static file serving configuration.

## License & Credits

This system was designed with extensibility and maintainability in mind. Feel free to adapt it to your specific needs.
