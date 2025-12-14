# Ticket Document Upload - Implementation Summary

> **Note:** Document upload endpoints were integrated into the `TicketListingsController` rather than a separate controller, as document management is intrinsically tied to the listing fulfillment workflow. This provides better domain cohesion and a more intuitive API structure.

## ✅ What Was Implemented

### 1. Controller (`apps/backend/src/controllers/ticket-listings/index.ts`)

Added document upload methods to `TicketListingsController`:

- **POST `/ticket-listings/tickets/:ticketId/document`** - Initial document upload
- **PUT `/ticket-listings/tickets/:ticketId/document`** - Update/replace document (creates new version)

**Features:**
- ✅ Authentication required (`requireAuthMiddleware`)
- ✅ Ownership validation (user must own the listing)
- ✅ Event timing validation (can't upload after event ends)
- ✅ File upload via `@UploadedFile()` decorator
- ✅ Comprehensive error responses (401, 404, 400, 422)
- ✅ Full TSOA annotations for OpenAPI documentation

### 2. Service Updates (`apps/backend/src/services/ticket-documents/index.ts`)

Enhanced `uploadTicketDocument` method with:
- ✅ Event end date validation - prevents uploads after event ends
- ✅ Ownership verification - only seller can upload
- ✅ Ticket sold status check - only sold tickets can have documents
- ✅ File type validation (PDF, PNG, JPG, JPEG)
- ✅ File size validation (max 10MB)
- ✅ Automatic versioning
- ✅ Document history preservation (never delete old versions)

### 3. Repository Updates (`apps/backend/src/repositories/listing-tickets/index.ts`)

Updated `getTicketById` to include:
- ✅ `eventEndDate` field for validation

### 4. Configuration Updates

**No TSOA configuration changes needed!**
- ✅ TSOA automatically detects `@UploadedFile()` decorator
- ✅ Generates routes with multer middleware
- ✅ Handles `multipart/form-data` requests

### 5. Documentation

Created comprehensive documentation:
- ✅ `docs/ticket-document-upload-setup.md` - Setup guide
- ✅ `docs/TICKET_DOCUMENT_CONTROLLER_SUMMARY.md` - This summary

## 📋 Next Steps

### Required Installation

Run these commands to complete the setup:

```bash
cd apps/backend
pnpm add multer
pnpm add -D @types/multer
```

### Regenerate TSOA Routes

After installing multer, regenerate routes:

```bash
pnpm tsoa:both
```

## 🔒 Security & Business Rules

1. **Authentication**: All endpoints require valid authentication
2. **Authorization**: Only listing owner can upload documents
3. **Event Timing**: Uploads blocked after event ends
4. **Ticket Status**: Only sold tickets can have documents
5. **File Validation**: Type and size validated before upload
6. **Audit Trail**: All document versions preserved in database
7. **Versioning**: Each upload increments version number
8. **Storage**: Old files deleted from storage, but records remain in DB

## 📊 Database Schema

Documents stored in `ticket_documents` table with:
- Version tracking
- Primary document marking
- Soft deletion support
- Audit fields (verified_at, verified_by, uploaded_at)
- Full history preservation

## 🚀 API Usage

### Upload Document

```bash
curl -X POST \
  http://localhost:8080/api/ticket-listings/tickets/{ticketId}/document \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@document.pdf"
```

### Update Document

```bash
curl -X PUT \
  http://localhost:8080/api/ticket-listings/tickets/{ticketId}/document \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@new-document.pdf"
```

## 🎯 Response Format

```json
{
  "ticketId": "uuid",
  "documentId": "uuid",
  "version": 1,
  "uploadedAt": "2024-01-01T00:00:00.000Z",
  "storagePath": "tickets/event-id/ticket-uuid.pdf"
}
```

## ✨ Key Features

- **Automatic Versioning**: Each upload creates new version
- **History Preservation**: Old versions kept in DB for audit
- **Smart Validation**: Checks ownership, timing, status
- **Storage Agnostic**: Works with local or S3 storage
- **Type Safety**: Full TypeScript typing throughout
- **OpenAPI**: Auto-generated API documentation
- **Error Handling**: Comprehensive error responses

## 🔄 Integration Flow

1. Seller lists tickets and someone purchases them
2. Tickets marked as `soldAt` 
3. Seller uploads document via POST endpoint
4. System validates ownership, timing, file
5. Document uploaded to storage
6. Record created in `ticket_documents` table
7. If seller uploads again (PUT), new version created
8. Old document marked as "replaced" but preserved

## 📝 Notes

- Both POST and PUT use the same service method internally
- Service automatically handles versioning logic
- POST is semantically for initial upload
- PUT is semantically for updates/replacements
- No actual difference in behavior - both create versions

