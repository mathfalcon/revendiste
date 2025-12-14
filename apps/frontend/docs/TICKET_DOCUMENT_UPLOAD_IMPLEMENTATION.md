# Ticket Document Upload - Frontend Implementation

## Overview

This document describes the frontend implementation for sellers to upload ticket documents for sold tickets. The implementation includes a modal-based upload experience that can be triggered via UI buttons or deep links (using search params).

## Features Implemented

### ✅ Components

1. **TicketDocumentUploadModal** (`src/components/TicketDocumentUploadModal/index.tsx`)
   - Modal dialog for uploading/updating ticket documents
   - Drag-and-drop file upload support
   - File validation (PDF, PNG, JPG, max 10MB)
   - Visual file preview
   - Different modes for upload vs update
   - Error handling with user feedback

2. **ListingCard Updates** (`src/components/ListingCard/index.tsx`)
   - Added upload buttons next to sold tickets
   - Color-coded button states:
     - 🟠 Orange: Document missing (needs upload)
     - 🟢 Green: Document uploaded successfully
     - 🟡 Yellow: Document needs attention (rejected/pending verification)
   - Opens modal via search params

### ✅ API Integration

1. **API Methods** (`src/lib/api/ticket-documents/index.ts`)
   - `uploadTicketDocumentMutation(ticketId)` - Upload new document
   - `updateTicketDocumentMutation(ticketId)` - Update existing document
   - Uses FormData for multipart/form-data uploads
   - Automatic query invalidation after successful upload
   - Toast notifications for success/error

### ✅ Routing & State Management

1. **Route Configuration** (`src/routes/cuenta/publicaciones.tsx`)
   - Added search param validation with Zod
   - `subirTicket?: string` - Opens modal for specific ticket (in Spanish for user-facing URLs)

2. **PublicacionesView Updates** (`src/features/user-account/PublicacionesView.tsx`)
   - Manages modal open/close state via search params
   - Finds ticket to upload from listings data
   - Handles navigation to update search params

## Usage Examples

### Opening the Modal via UI

Users can click the "Subir ticket" button next to any sold ticket:

```tsx
// Automatically handled by ListingCard component
<button onClick={() => handleUploadClick(ticket.id)}>
  <Upload /> Subir ticket
</button>
```

### Opening the Modal via Deep Link

The modal can be opened via URL, useful for email links:

```
/cuenta/publicaciones?subirTicket=ticket-id-here
```

Example link from email:

```tsx
<a href="https://yourapp.com/cuenta/publicaciones?subirTicket=abc-123">
  Subir documento del ticket
</a>
```

## File Upload Flow

1. User clicks upload button or visits deep link
2. Modal opens with drag-drop zone
3. User selects/drops file (validates type & size)
4. File preview appears
5. User clicks "Subir" button
6. FormData sent to `/ticket-listings/tickets/:ticketId/document`
7. Success: Modal closes, listings refresh, toast notification
8. Error: Error message shown in modal

## Button States & Colors

```tsx
// Missing document (needs upload)
const needsUpload = !hasDocument;
// Button: Orange background, "Subir ticket" text

// Document uploaded successfully
const uploaded = hasDocument && !documentNeedsAttention;
// Button: Green background, "Subido" text with FileCheck icon

// Document needs attention
const needsAttention = hasDocument && documentNeedsAttention;
// Button: Yellow background, "Revisar" text with AlertCircle icon
```

## TODO: Integration with Backend Document Status

Currently, the document status is hardcoded:

```tsx
// In ListingCard/index.tsx (line ~211)
const hasDocument = false; // TODO: Get from ticket data
const documentNeedsAttention = false; // TODO: Get from ticket data
```

Once the backend provides document status, update the type definition:

```tsx
// Update the generated types to include document status
interface Ticket {
  id: string;
  // ... other fields
  document?: {
    status: 'verified' | 'pending' | 'rejected';
    uploadedAt: string;
  };
}
```

Then update the ListingCard logic:

```tsx
const hasDocument = !!ticket.document;
const documentNeedsAttention = 
  ticket.document?.status === 'rejected' || 
  ticket.document?.status === 'pending';
```

## File Validation

- **Accepted formats**: PDF, PNG, JPG, JPEG
- **Max size**: 10MB
- **Validation**: Client-side (component) and server-side (backend API)

## Error Handling

1. **File validation errors**: Shown immediately in the drop zone
2. **Upload errors**: Shown in modal with error alert
3. **Network errors**: Caught by API interceptor, toast notification
4. **Backend errors**: Error message from backend displayed via toast

## Component Props

### TicketDocumentUploadModal

```tsx
interface TicketDocumentUploadModalProps {
  ticketId: string;              // UUID of the ticket
  hasExistingDocument: boolean;  // true = update mode, false = upload mode
  open: boolean;                 // Modal open state
  onOpenChange: (open: boolean) => void; // Callback when modal opens/closes
}
```

## Search Param Schema

```tsx
const publicacionesSearchSchema = z.object({
  subirTicket: z.string().optional(), // Ticket ID to open upload modal for
});
```

## Dependencies

- `@tanstack/react-query` - Data fetching & mutations
- `@tanstack/react-router` - Routing & search params
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `zod` - Schema validation
- Radix UI Dialog - Modal component

## Future Enhancements

1. **Document preview**: Show uploaded document preview in modal
2. **Document history**: View previous versions of documents
3. **Bulk upload**: Upload multiple tickets at once
4. **Progress indicator**: Show upload progress for large files
5. **Auto-save drafts**: Save selected file temporarily
6. **Document verification status**: Show verification progress
7. **Document download**: Allow sellers to download their uploaded documents

