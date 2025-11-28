# Ticket Document Upload Availability

## Overview

The system implements platform-specific logic to determine when sellers can upload ticket documents. This ensures users are only prompted to upload documents when they're actually available from the event platform.

## Platform-Specific Rules

### Entraste Platform

- **Upload Window**: Documents can only be uploaded starting 12 hours before the event
- **Reason**: Entraste QR codes are generated and made available to ticket holders 12 hours prior to event start
- **User Experience**: Sellers see a "Próximamente" (Coming Soon) button with a tooltip explaining when documents will be available

### Future Platforms

Additional platforms can be easily added to the `canUploadDocumentForPlatform` helper function in `apps/backend/src/services/ticket-listings/platform-helpers.ts`.

## Implementation Details

### Backend

#### 1. Repository Layer (`apps/backend/src/repositories/ticket-listings/index.ts`)

The `getListingsWithTicketsByUserId` method was enhanced to include:
- `event.platform` - The platform the event belongs to
- `ticket.document` - Document information (id, status, uploadedAt) if exists

```typescript
jsonObjectFrom(
  eb
    .selectFrom('ticketDocuments')
    .select([
      'ticketDocuments.id',
      'ticketDocuments.status',
      'ticketDocuments.uploadedAt',
    ])
    .whereRef('ticketDocuments.ticketId', '=', 'listingTickets.id')
    .where('ticketDocuments.isPrimary', '=', true)
    .where('ticketDocuments.deletedAt', 'is', null),
).as('document')
```

#### 2. Service Layer (`apps/backend/src/services/ticket-listings/index.ts`)

The `getUserListingsWithTickets` method enriches each ticket with:
- `hasDocument: boolean` - Whether a document exists
- `canUploadDocument: boolean` - Whether upload is currently allowed based on platform rules
- `uploadUnavailableReason?: string` - Reason code if upload is not available ('too_early', 'event_ended')

#### 3. Platform Helpers (`apps/backend/src/services/ticket-listings/platform-helpers.ts`)

Core logic for determining upload availability:

```typescript
export function canUploadDocumentForPlatform(
  platform: string,
  eventStartDate: Date,
  eventEndDate: Date,
  hasDocument: boolean,
): UploadAvailability
```

**Rules Applied:**
1. Can't upload after event has ended
2. Platform-specific timing windows (e.g., 12 hours for Entraste)
3. Default behavior allows upload anytime if no specific rules exist

### Frontend

#### 1. ListingCard Component (`apps/frontend/src/components/ListingCard/index.tsx`)

For each sold ticket, the component displays a button with different states:

| State | Icon | Color | Text | Behavior |
|-------|------|-------|------|----------|
| **Upload Not Available** | Timer ⏲️ | Gray | "Próximamente" | Disabled, shows tooltip |
| **No Document (Can Upload)** | Upload 📤 | Orange | "Subir ticket" | Opens upload modal |
| **Has Document** | FileCheck ✅ | Green | "Editar" | Opens modal to replace |
| **Needs Attention** | AlertCircle ⚠️ | Yellow | "Revisar" | Opens modal (future use) |

```typescript
const hasDocument = ticket.hasDocument;
const canUpload = ticket.canUploadDocument;
```

#### 2. PublicacionesView (`apps/frontend/src/features/user-account/PublicacionesView.tsx`)

The modal now correctly reflects whether the operation is an upload or update:

```typescript
<TicketDocumentUploadModal
  ticketId={ticketToUpload.id}
  hasExistingDocument={ticketToUpload.hasDocument || false}
  open={!!search.subirTicket}
  onOpenChange={...}
/>
```

## User Experience Flow

### Scenario 1: Event Starts in 2 Days (Entraste Platform)

1. Seller navigates to "Mis publicaciones"
2. Sees sold tickets with gray "Próximamente" buttons
3. Hovering shows: "Los tickets estarán disponibles 12 horas antes del evento"
4. Button is disabled, preventing premature upload attempts

### Scenario 2: Within Upload Window (12 Hours Before Event)

1. Seller sees orange "Subir ticket" button for tickets without documents
2. Clicking opens upload modal
3. After successful upload, button changes to green "Editar"
4. Seller can update/replace document anytime before event ends

### Scenario 3: After Event Ends

1. Upload becomes unavailable (`canUploadDocument: false`)
2. Existing documents remain viewable but not editable
3. Maintains audit trail integrity

## API Response Structure

```typescript
{
  id: string;
  event: {
    id: string;
    name: string;
    platform: string; // "entraste", etc.
    eventStartDate: string;
    eventEndDate: string;
    // ...
  };
  tickets: [{
    id: string;
    ticketNumber: number;
    soldAt: string | null;
    document: {
      id: string;
      status: string;
      uploadedAt: string;
    } | null;
    hasDocument: boolean; // Computed
    canUploadDocument: boolean; // Computed based on platform rules
    uploadUnavailableReason?: string; // 'too_early' | 'event_ended'
  }];
}
```

## Testing Scenarios

### Backend Tests

1. **Platform Rule Validation**
   - Event 13 hours away → can't upload (Entraste)
   - Event 11 hours away → can upload (Entraste)
   - Event ended → can't upload (all platforms)
   - Unknown platform → default behavior (allow upload)

2. **Document Status**
   - No document exists → `hasDocument: false`
   - Document exists → `hasDocument: true`, includes document details

### Frontend Tests

1. **Button State Rendering**
   - Correct icon and color for each state
   - Disabled state when `canUpload: false`
   - Tooltip displays on hover for disabled state

2. **Modal Behavior**
   - Opens with correct mode (upload vs update)
   - Deep linking works with `?subirTicket=ID`
   - Closes properly and invalidates cache

## Adding New Platforms

To add a new platform with custom upload rules:

1. **Update `platform-helpers.ts`**:

```typescript
case 'new_platform': {
  // Define your custom logic
  const customWindow = /* your logic */;
  
  if (now < customWindow) {
    return {
      canUpload: false,
      reason: 'too_early',
    };
  }
  
  return { canUpload: true };
}
```

2. **Update frontend messages** (if needed):

```typescript
export function getUploadUnavailableMessage(
  reason: string,
  platform: string,
  eventStartDate: Date,
): string {
  switch (reason) {
    case 'too_early':
      if (platform.toLowerCase() === 'new_platform') {
        return 'Custom message for your platform';
      }
      // ...
  }
}
```

3. **Redeploy** - No database migrations required!

## Benefits

✅ **User-Centric**: Only prompts when documents are actually available  
✅ **Flexible**: Easy to add new platforms with different rules  
✅ **Performant**: Computed server-side, cached on client  
✅ **Maintainable**: Centralized logic in platform-helpers  
✅ **Audit-Friendly**: Clear upload/edit history maintained  

