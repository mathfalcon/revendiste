# Tasks: fair-fifo-and-share-event

## Task 1: Update backend FIFO ordering to use updatedAt
- **File(s)**: `apps/backend/src/repositories/listing-tickets/index.ts`
- **Action**: Change two orderBy clauses from `createdAt` to `updatedAt`:
  - Line 45 in `findAvailableTicketsByPriceGroup()`: Change `.orderBy('listingTickets.createdAt', 'asc')` to `.orderBy('listingTickets.updatedAt', 'asc')`
  - Line 86 in `findAvailableTicketsByPriceGroupForUpdate()`: Change `.orderBy('listingTickets.createdAt', 'asc')` to `.orderBy('listingTickets.updatedAt', 'asc')`
- **Acceptance**: 
  - Both methods order by `updatedAt ASC` instead of `createdAt ASC`
  - Verify that `updateTicketPrice()` method (line 197) already sets `updatedAt: new Date()` when updating prices (should already be present)
  - Code compiles without errors
- [ ] Not started

## Task 2: Add backend unit tests for FIFO ordering scenarios
- **File(s)**: `apps/backend/src/__tests__/repositories/listing-tickets/ordering.test.ts` (new file)
- **Action**: Create unit tests covering the three spec scenarios:
  1. **Price reduction queue**: Verify that tickets with later price reductions are deprioritized
  2. **Never-updated tickets**: Verify that tickets with `updatedAt = createdAt` maintain FIFO order
  3. **Multiple price changes**: Verify that each price change updates the ticket's position in queue
- **Acceptance**:
  - All three scenarios pass
  - Tests use test factories from `src/__tests__/factories/`
  - Tests verify the correct ordering of ticket IDs returned from `findAvailableTicketsByPriceGroup()`
  - Run `pnpm test -- --testPathPattern=ordering` successfully
- [ ] Not started

## Task 3: Add share button to ListingCard component
- **File(s)**: `apps/frontend/src/components/ListingCard/index.tsx`
- **Action**: 
  1. Add new imports:
     - `Share2` from `lucide-react` (add to existing lucide import)
     - `toast` from `sonner`
     - `copyToClipboard` from `~/utils/clipboard`
  2. Add `handleShareEvent` async function inside the component:
     - Construct event URL: `${window.location.origin}/eventos/${event.slug}`
     - Check if `navigator.share` is available via `typeof navigator.share === 'function'`
     - If available, call `navigator.share({ title: event.name, url: eventUrl })`
     - Catch AbortError silently (user cancel), log other errors
     - If not available, call `copyToClipboard(eventUrl)` and show toast based on result
  3. Insert share button in header row (inside the `div.flex.items-start.justify-between.gap-1` at line ~92):
     - Wrap button in `{event.slug && ...}` conditional
     - Use plain `<button type='button'>` with click handler
     - Add `aria-label='Compartir evento'` for accessibility
     - Use muted foreground styling with hover state
     - Place button before the "Finalizado" badge in a flex container
- **Acceptance**:
  - Share button appears next to event name in ListingCard header
  - Button is hidden when `event.slug` is falsy
  - Button uses `Share2` icon with appropriate sizing (`h-4 w-4`)
  - Component compiles without TypeScript errors
- [ ] Not started

## Task 4: Verify share button behavior on mobile (Web Share API)
- **File(s)**: N/A (manual testing)
- **Action**: 
  1. Open the publications page (`/publicaciones`) on a mobile device or browser with Web Share API support
  2. Click the share button on any listing
  3. Verify native share sheet opens with correct event name and URL
  4. Verify URL format is `https://revendiste.com/eventos/{slug}` (no tracking params, no seller ID)
  5. Test canceling the share dialog
- **Acceptance**:
  - Native share sheet opens with event name as title
  - URL is correctly formatted without tracking parameters
  - Canceling the share does not show any toast or error
  - Sharing completes successfully when selecting a share target
- [ ] Not started

## Task 5: Verify share button behavior on desktop (clipboard fallback)
- **File(s)**: N/A (manual testing)
- **Action**:
  1. Open the publications page on a desktop browser without Web Share API (e.g., Chrome, Firefox)
  2. Click the share button on any listing
  3. Verify URL is copied to clipboard
  4. Verify toast "Enlace copiado" appears
  5. Paste the URL and verify it matches `https://revendiste.com/eventos/{slug}`
- **Acceptance**:
  - URL is successfully copied to clipboard
  - Toast notification "Enlace copiado" appears
  - Pasted URL is correctly formatted
  - No console errors appear
- [ ] Not started

## Task 6: Verify accessibility of share button
- **File(s)**: N/A (manual testing)
- **Action**:
  1. Navigate to publications page
  2. Use keyboard to tab to the share button
  3. Press Enter or Space to activate
  4. Verify share functionality works via keyboard
  5. Test with screen reader to verify `aria-label` is announced
- **Acceptance**:
  - Share button is reachable via keyboard navigation (Tab key)
  - Enter and Space keys both trigger the share action
  - Screen reader announces "Compartir evento" or equivalent
  - Focus styles are visible when button is focused
- [ ] Not started

## Task 7: Integration test for FIFO allocation behavior
- **File(s)**: `apps/backend/src/__tests__/integration/order-creation-fifo.test.ts` (new file)
- **Action**: Create end-to-end integration test that:
  1. Creates multiple listings for the same event/wave at different prices
  2. Updates some listing prices to create a specific queue order
  3. Creates an order via `OrderService.createOrder()`
  4. Verifies the correct tickets are allocated based on `updatedAt` ordering
- **Acceptance**:
  - Integration test covers at least the "price reduction queue" scenario from the spec
  - Test interacts with actual database (uses test database)
  - Test verifies that the first ticket allocated has the earliest `updatedAt` for the target price
  - Run `pnpm test -- --testPathPattern=order-creation-fifo` successfully
- [ ] Not started

## Task 8: Verify no regression in existing allocation behavior
- **File(s)**: N/A (run existing test suite)
- **Action**:
  1. Run full backend test suite: `cd apps/backend && pnpm test`
  2. Verify all existing order and ticket allocation tests pass
  3. Check that no test failures are related to ticket ordering or allocation logic
- **Acceptance**:
  - All existing tests pass without modification
  - No test failures related to ListingTicketsRepository
  - No test failures related to OrderService
- [ ] Not started

## Task 9: Manual smoke test of full purchase flow
- **File(s)**: N/A (manual testing)
- **Action**:
  1. Start both backend and frontend: `pnpm dev`
  2. Create 3 test listings for the same event/wave:
     - List ticket A at $1500
     - List ticket B at $1000
     - List ticket C at $1000
  3. Update ticket A price to $1000 (should now be last in queue)
  4. As a buyer, purchase one $1000 ticket
  5. Verify that ticket B was sold (earliest updatedAt at $1000)
  6. Purchase another $1000 ticket
  7. Verify that ticket C was sold (second earliest)
  8. Purchase final $1000 ticket
  9. Verify that ticket A was sold (latest updatedAt at $1000)
- **Acceptance**:
  - Tickets are allocated in correct updatedAt order
  - No errors occur during purchase flow
  - Seller notifications are sent correctly
  - Order status progresses normally
- [ ] Not started

## Task 10: Update documentation (optional)
- **File(s)**: `CLAUDE.md` (project documentation)
- **Action**: Add a note under "Key Patterns" section explaining that ticket allocation uses `updatedAt` (price-setting time) rather than `createdAt` for FIFO ordering
- **Acceptance**:
  - Documentation clearly explains the FIFO ordering behavior
  - Rationale is briefly mentioned (fairness for sellers who commit to lower prices earlier)
- [ ] Not started
