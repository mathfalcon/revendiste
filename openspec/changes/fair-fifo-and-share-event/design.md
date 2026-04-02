# Design: fair-fifo-and-share-event

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| FIFO ordering column | `updatedAt` instead of `createdAt` | `updatedAt` reflects "when ticket was set to current price" since price is the only user-mutable field. For never-updated tickets, `updatedAt = createdAt` so existing behavior is preserved. |
| Share utility approach | Reuse existing `copyToClipboard()` from `~/utils/clipboard.ts` | Already handles Clipboard API + execCommand fallback with iOS Safari support. No need to write a new clipboard utility. |
| Web Share API detection | `typeof navigator.share === 'function'` check at call time | No need for a separate hook or state. Check inline in the handler. Simple and reliable. |
| Share button placement | Icon button in the header `items-start justify-between` row, before the "Finalizado" badge | Visible but non-dominant. Sits in the top-right area alongside existing badge. Always visible (not just for past events). |
| Share icon | `Share2` from lucide-react | Standard share icon. Matches existing lucide-react usage throughout ListingCard. |
| Toast library | sonner (`toast()`) | Already used across the frontend for notifications. |
| Share handler location | Inline in `ListingCard` component | Simple enough logic that a separate file is unnecessary. No reuse needed elsewhere currently. |

## Component Changes

### Backend

**File**: `apps/backend/src/repositories/listing-tickets/index.ts`

Two identical one-line changes:

1. **Line 45** (`findAvailableTicketsByPriceGroup`): Change `.orderBy('listingTickets.createdAt', 'asc')` to `.orderBy('listingTickets.updatedAt', 'asc')`
2. **Line 86** (`findAvailableTicketsByPriceGroupForUpdate`): Same change

**Verification**: The `updateTicketPrice()` method (line 197) already explicitly sets `updatedAt: new Date()` when updating price, confirming REQ-2/VAL-1 from the spec. No other methods in the repository need changes -- all other queries either don't involve ordering by creation time for allocation purposes, or are unrelated to the allocation flow.

No other files in the backend are affected. No migrations, no schema changes, no service-layer changes.

### Frontend

**File**: `apps/frontend/src/components/ListingCard/index.tsx`

#### New imports
- `Share2` from `lucide-react` (add to existing import)
- `toast` from `sonner`
- `copyToClipboard` from `~/utils/clipboard`

#### Share handler function
Add `handleShareEvent` async function inside the `ListingCard` component:

```typescript
const handleShareEvent = async () => {
  const eventUrl = `${window.location.origin}/eventos/${event.slug}`;

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: event.name,
        url: eventUrl,
      });
    } catch (error) {
      // User cancelled share - do nothing (REQ-11)
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
    return;
  }

  // Fallback: copy to clipboard
  const success = await copyToClipboard(eventUrl);
  if (success) {
    toast.success('Enlace copiado');
  } else {
    toast.error('No se pudo copiar el enlace');
  }
};
```

#### Button placement
Insert a share icon button in the existing header row (`div.flex.items-start.justify-between.gap-1`, line 92). The button goes in a wrapper alongside the existing "Finalizado" badge:

```tsx
<div className='flex items-start justify-between gap-1'>
  <div className='min-w-0 flex-1'>
    {/* existing event name link + ticket wave name */}
  </div>
  <div className='flex items-center gap-1 shrink-0'>
    {event.slug && (
      <button
        type='button'
        onClick={handleShareEvent}
        className='p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
        aria-label='Compartir evento'
      >
        <Share2 className='h-4 w-4' />
      </button>
    )}
    {isEventPast && (
      <Badge variant='outline' className='text-muted-foreground'>
        Finalizado
      </Badge>
    )}
  </div>
</div>
```

Key details:
- Uses a plain `<button>` with `type='button'` -- no need for shadcn Button since this is a minimal icon action
- `aria-label='Compartir evento'` for keyboard/screen reader accessibility (NFR-2)
- Hidden when `event.slug` is falsy (VAL-1)
- Muted foreground color with hover state matches the card's existing visual hierarchy (REQ-3)
- `p-1` padding keeps it compact, `h-4 w-4` icon matches the size of other icons in the card

## Data Flow

### Fair FIFO Allocation

```
Buyer clicks "Buy" → OrderService.createOrder()
  → ListingTicketsRepository.findAvailableTicketsByPriceGroupForUpdate(waveId, price, qty)
    → SELECT ... FROM listingTickets
       JOIN listings ...
       WHERE price = $price AND soldAt IS NULL ...
       ORDER BY listingTickets.updatedAt ASC  ← CHANGED
       LIMIT $qty
       FOR UPDATE SKIP LOCKED
  → Returns tickets ordered by "when price was last set"
```

No change to the data flow itself -- only the ordering criterion within the existing query. The `findAvailableTicketsByPriceGroup` (non-locking version) follows the same pattern for read-only contexts.

### Share Event

```
Seller clicks Share2 icon → handleShareEvent()
  ├─ navigator.share available?
  │   YES → navigator.share({ title, url }) → native OS share sheet
  │   │      └─ User cancels → AbortError → silently ignore
  │   NO  → copyToClipboard(eventUrl)
  │          ├─ success → toast.success("Enlace copiado")
  │          └─ failure → toast.error("No se pudo copiar el enlace")
```

Data source: `event.slug` and `event.name` already present in `listing.event` from the `GetUserListingsResponse` type. No API calls needed.

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Ticket never had price updated | `updatedAt = createdAt` (set at insert time), so ordering is identical to current behavior. No regression. |
| Two tickets with identical `updatedAt` | PostgreSQL will return them in an undefined but stable order (heap order). This is acceptable -- both sellers "tied" at the same timestamp. Same behavior as current `createdAt` ties. |
| `event.slug` is missing/null | Share button is conditionally rendered with `{event.slug && ...}`. Button simply doesn't appear. |
| Web Share API canceled by user | `AbortError` is caught and silently ignored (REQ-11). No toast shown. |
| Clipboard write fails (permissions denied) | `copyToClipboard()` returns `false`, triggering error toast "No se pudo copiar el enlace" (REQ-10). Error already logged inside the utility. |
| SSR/server-side rendering | `navigator` is only accessed inside the click handler (event-driven), never at render time. Safe for SSR. |
| URL construction | Uses `window.location.origin` to get the correct protocol + domain. Works in dev (localhost), staging, and production. |
| `softDeleteTicket` sets `updatedAt` | This is fine -- soft-deleted tickets are filtered out by `WHERE deletedAt IS NULL`, so their `updatedAt` is irrelevant to allocation ordering. |
