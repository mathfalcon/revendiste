# Proposal: fair-fifo-and-share-event

## Intent

Two seller-facing improvements:

1. **Fair FIFO allocation**: When multiple sellers list tickets at the same price, the current `createdAt`-based ordering unfairly prioritizes sellers who listed first at a higher price and later dropped it. Sellers who committed to a lower price earlier deserve priority. Switching to `updatedAt` ordering ensures "first to set this price" sells first.

2. **Share event button**: After publishing tickets, sellers have no easy way to share the event page with potential buyers. Adding a share action lets sellers promote their event directly from the publications view, driving more traffic to the marketplace.

## Scope

### In scope
- Change ticket allocation ordering from `createdAt ASC` to `updatedAt ASC` in both query methods
- Add a "Share event" action to the `ListingCard` component
- Use Web Share API with clipboard fallback

### Out of scope
- Sharing individual listing links (purchases work against price groups, not listings)
- Any migration or schema changes (updatedAt column already exists)
- Changes to the allocation logic itself (only the ordering changes)
- Analytics tracking for share actions (can be added later)

## Approach

### Capability 1: Fair FIFO Allocation (Backend)

Single-line change in two methods within `ListingTicketsRepository`:
- `findAvailableTicketsByPriceGroup()` (line 45): change `.orderBy('listingTickets.createdAt', 'asc')` to `.orderBy('listingTickets.updatedAt', 'asc')`
- `findAvailableTicketsByPriceGroupForUpdate()` (line 86): same change

This works because the only user-mutable field on a listing ticket is `price`. When a seller changes their price, `updatedAt` is refreshed automatically by the DB/application layer. So `updatedAt` effectively means "when this ticket was last set to its current price," which is the fair ordering criterion.

### Capability 2: Share Event Button (Frontend)

Add a share icon button to the `ListingCard` header area (near the event name / "Finalizado" badge). On click:

1. If `navigator.share` is available (mobile browsers), use the Web Share API with:
   - `title`: event name
   - `url`: `{window.location.origin}/eventos/{slug}`
2. Otherwise, copy the URL to clipboard via `navigator.clipboard.writeText()` and show a toast ("Enlace copiado")

The event slug is already available in the listing data (`event.slug`), so no API changes are needed.

## Capabilities

### Modified Capabilities
- `ticket-allocation`: Change FIFO ordering from `createdAt ASC` to `updatedAt ASC` so sellers who set a price first get priority over those who reduced their price later.

### New Capabilities
- `share-event`: Share event page URL from the seller's publications view using Web Share API (mobile) or clipboard copy (desktop) with toast confirmation.

## Affected Areas

### Backend
- `apps/backend/src/repositories/listing-tickets/index.ts` — Two `orderBy` changes (lines 45 and 86)

### Frontend
- `apps/frontend/src/components/ListingCard/index.tsx` — Add share button with Web Share API / clipboard fallback

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `updatedAt` not refreshed on price change | Low | Verify that the price update service/repo sets `updatedAt`. Kysely's `updateTable().set()` with explicit fields should trigger it if the column has a DB-level default trigger, or it's set explicitly in the update call. |
| Existing tickets all have same `createdAt` and `updatedAt` | None | For tickets that were never updated, `updatedAt = createdAt`, so behavior is identical to current. Only diverges when a price change occurs, which is the desired behavior. |
| Web Share API not available on desktop | Low | Clipboard fallback handles this gracefully. |

## Rollback Plan

1. **FIFO**: Revert the two `orderBy` lines back to `listingTickets.createdAt`
2. **Share button**: Remove the share button JSX and handler from `ListingCard`

Both changes are independent and can be rolled back separately.
