# Ticket Document Upload Setup

## Overview

The Ticket Documents controller enables sellers to upload PDF or image documents for their sold tickets. This document outlines the setup required for file upload functionality.

## Installation Required

### 1. Install Multer Dependencies

```bash
pnpm add multer
pnpm add -D @types/multer
```

### 2. How TSOA Handles File Uploads

**No additional TSOA configuration needed!** TSOA automatically:
- Detects `@UploadedFile()` decorator in controllers
- Generates routes with multer middleware
- Uses disk storage by default (OS temp folder)
- Accepts files via `multipart/form-data`

The files are temporarily stored during upload, then our service layer:
- Reads them from memory (via `file.buffer`)
- Validates file type and size
- Uploads to our storage provider (local/S3)
- Temp files are automatically cleaned up

### 3. Optional: Custom Multer Configuration

If you want to customize multer behavior (storage, size limits, etc.), you can configure it in `server.ts`:

```typescript
import multer from 'multer';
import { RegisterRoutes } from './routes';

// Optional: Override default multer config
const upload = multer({
  storage: multer.memoryStorage(), // Or diskStorage
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Then apply to specific routes if needed
```

**Note:** Our service layer already validates file size (10MB) and type, so custom multer config is optional.

## API Endpoints

### POST /ticket-listings/tickets/:ticketId/document

Upload a document for a ticket (initial upload).

**Requirements:**
- User must be authenticated
- User must own the listing that contains the ticket
- Ticket must be sold
- Event must not have ended
- File must be PDF, PNG, JPG, or JPEG
- File size max 10MB

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response:**
```json
{
  "ticketId": "uuid",
  "documentId": "uuid",
  "version": 1,
  "uploadedAt": "2024-01-01T00:00:00.000Z",
  "storagePath": "tickets/event-id/ticket-uuid-timestamp.pdf"
}
```

### PUT /ticket-listings/tickets/:ticketId/document

Update/replace a ticket document (creates a new version).

**Requirements:** Same as POST endpoint

**Behavior:**
- Creates a new document version
- Previous versions are kept for audit trail
- Old document is marked as "replaced"
- Old file is deleted from storage

**Response:** Same as POST endpoint

## Business Rules

1. **Ownership Validation**: Only the seller who created the listing can upload documents
2. **Event Timing**: Documents can only be uploaded before the event ends
3. **Ticket Status**: Documents can only be uploaded for sold tickets
4. **Versioning**: Each upload creates a new version, previous versions are retained in the database
5. **File Types**: Only PDF, PNG, JPG, and JPEG are accepted
6. **File Size**: Maximum 10MB per file
7. **Audit Trail**: Old documents are never deleted from the database, only marked as replaced

## Storage

Documents are stored using the configured storage provider:
- **Local**: Files stored in `uploads/` directory
- **S3**: Files stored in configured S3 bucket

See `docs/s3-migration-guide.md` for S3 setup.

## Database Schema

Documents are stored in the `ticket_documents` table:

```sql
CREATE TABLE ticket_documents (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES listing_tickets(id),
  storage_path VARCHAR(500),
  file_name VARCHAR(255),
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  document_type VARCHAR(50) DEFAULT 'ticket',
  version INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'verified',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

## Error Handling

| Status | Error | Description |
|--------|-------|-------------|
| 400 | BadRequestError | No file uploaded |
| 401 | UnauthorizedError | Not authenticated or not ticket owner |
| 404 | NotFoundError | Ticket not found |
| 422 | ValidationError | Event ended, ticket not sold, invalid file type, file too large |

## Frontend Integration

Example using FormData:

```typescript
const formData = new FormData();
formData.append('file', file);

await fetch(`/api/ticket-listings/tickets/${ticketId}/document`, {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## Testing

To test the endpoints:

1. Create a listing with tickets
2. Complete an order to mark tickets as sold
3. Use Postman or curl to upload a file:

```bash
curl -X POST \
  http://localhost:8080/api/ticket-listings/tickets/{ticketId}/document \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

## Notes

- TSOA will automatically generate routes with multer middleware
- The `@UploadedFile()` decorator tells TSOA to expect a file upload
- Files are buffered in memory for direct upload to storage
- No temporary files are created on disk

