# Test proposal: services and repositories

Each test file should stay **short and focused** (~50–150 lines). Every test should have a **single clear purpose** and **clear value** (guard a critical behavior, prevent a known bug, or document a contract). Prefer **few high-value tests** over many low-value ones.

---

## Services

### OrdersService (extend existing `orders.test.ts`)

| Test | Purpose | Value |
|------|--------|--------|
| **createOrder – insufficient tickets** | Mock `findAvailableTicketsByPriceGroup` returning fewer than requested; expect `ValidationError` with INSUFFICIENT_TICKETS. | Ensures we never create an order for more tickets than available. |
| **createOrder – user buys own tickets** | Mock listings where `publisherUserId === userId`; expect `ValidationError` CANNOT_BUY_OWN_TICKETS. | Critical business rule. |
| **cancelOrder – not pending** | Mock order with `status: 'confirmed'`; expect `ValidationError` ORDER_NOT_CANCELLABLE. | Prevents cancelling already-confirmed orders. |
| **getOrderById – wrong user** | Mock order with different `userId`; expect `NotFoundError`. | Authorization: user cannot see another user’s order. |

Keep the two existing tests (pending order exists, event not found). **Total: 6 tests in one file** – still manageable.

---

### SellerEarningsService (`seller-earnings.test.ts`)

| Test | Purpose | Value |
|------|--------|--------|
| **createEarningsForSoldTickets – no reservations** | Mock `getByOrderId` returning `[]`; assert no `create` calls and no throw. | Idempotent / no-op when no tickets. |
| **createEarningFromSale – idempotency** | Mock `getEarningsByListingTicketIds` returning one row with `status: 'available'`; assert `create` not called. | Prevents duplicate earnings (e.g. duplicate webhook). |
| **checkHoldPeriods – batch size** | Mock `getEarningsReadyForRelease` returning 60 items; assert `updateStatus` called with batches of 50 (and 10). | Documents batch behavior and avoids overload. |

**~3 tests, one file.**

---

### PaymentsService (`payments.test.ts`)

| Test | Purpose | Value |
|------|--------|--------|
| **createPaymentLink – order not pending** | Mock order with `status: 'confirmed'`; expect `ValidationError` ORDER_NOT_PENDING. | Cannot create payment link for already-paid or cancelled order. |
| **createPaymentLink – order expired** | Mock order with `reservationExpiresAt` in the past; expect `ValidationError` ORDER_EXPIRED. | Enforces reservation window. |
| **createPaymentLink – reuses existing pending payment** | Mock `getByOrderId` returning existing payment with `status: 'pending'` and `redirectUrl`; assert returns that URL and does not call provider or create new payment. | Avoids duplicate payment records and documents reuse behavior. |

**~3 tests, one file.**

---

### PaymentWebhookAdapter (`payments/adapters/payment-webhook-adapter.test.ts`)

| Test | Purpose | Value |
|------|--------|--------|
| **handleSuccessfulPayment – idempotent when order already confirmed** | Mock `getByIdWithItems` returning order with `status: 'confirmed'`; call the code path that runs on `paid` (e.g. via `processNormalizedPayment` with normalized `paid` data). Assert no `updateStatus`, no `markTicketsAsSold`, no `createEarningsForSoldTickets`. | Prevents double-processing duplicate webhooks. |
| **processNormalizedPayment – amount mismatch** | Mock order with `totalAmount: 100`, normalized payment with `amount: 99`; expect `ValidationError` PAYMENT_AMOUNT_MISMATCH. | Ensures we never confirm an order when paid amount differs. |

**~2 tests.** Adapter is heavy with mocks; keep only these two critical behaviors.

---

### PayoutsService (`payouts.test.ts`)

| Test | Purpose | Value |
|------|--------|--------|
| **requestPayout – below minimum** | Mock available balance below `PAYOUT_MINIMUM_*` for currency; expect validation error. | Enforces minimum payout. |
| **requestPayout – invalid earnings selection** | Mock `validateEarningsSelection` throwing (or repo returning invalid); expect appropriate error. | Ensures only valid earnings can be requested. |

**~2 tests, one file.** More (e.g. fail/cancel flows) can be added later if needed.

---

### TicketListingsService (`ticket-listings.test.ts`)

| Test | Purpose | Value |
|------|--------|--------|
| **updateTicketPrice – not listing owner** | Mock ticket/listing with different `publisherUserId` than `userId`; expect `UnauthorizedError` or `NotFoundError`. | Only owner can change price. |
| **removeTicket – last ticket** | Mock listing with one ticket; expect validation error (if business rule: cannot remove last ticket). | Documents and guards “at least one ticket” rule if it exists. |

**~2 tests.** Skip if rules are trivial or already enforced elsewhere.

---

### NotificationsService

Only add tests if there is **non-trivial logic** (e.g. deduplication, template selection, or channel logic). If it’s mostly “create notification + send via provider”, **skip** or add a single test that “creates notification with expected type and userId” with mocked repo. **0–1 test.**

---

### EventsService, UsersService, HealthService

- **Events**: Mostly repo + external data; skip or one test for a clear rule (e.g. `getEventById` returns 404 when not found) with mocked repo. **0–1 test.**
- **Users**: Usually thin; skip unless there’s a specific rule to guard. **0 tests.**
- **Health**: Optional – test `checkMemory()` returns `unhealthy` when usage > 90% (mock `process.memoryUsage`). **0–1 test.**

---

## Repositories

**Principle:** Don’t test “SQL shape” or Kysely for its own sake. Test **repositories only when** they contain meaningful branching, non-trivial filters, or critical invariants. Prefer **integration tests** for full query behavior if needed.

| Repository | Suggested tests | Rationale |
|------------|-----------------|-----------|
| **OrdersRepository** | **0** | Thin CRUD; order logic is in OrdersService. |
| **OrderTicketReservationsRepository** | **0** | Thin; reservation rules tested via OrdersService / PaymentWebhookAdapter. |
| **ListingTicketsRepository** | **0** | `findAvailableTicketsByPriceGroup` is central but better tested via OrdersService with DB or a single integration test. |
| **SellerEarningsRepository** | **0** | Clone/failed-payout logic is subtle; better covered by PayoutsService + integration or one focused integration test. |
| **PaymentsRepository** | **0** | Thin. |
| **Others** | **0** | Same: avoid large, brittle repo tests; cover behavior in service tests or integration. |

**Recommendation:** **No new repository unit test files** for now. Add **repository-level or integration tests** only for a specific bug or critical path (e.g. “reservation uniqueness”, “earnings clone idempotency”) and keep them in one small file per concern.

---

## Summary

| File | New tests | Est. lines |
|------|-----------|------------|
| `__tests__/services/orders.test.ts` | +4 | ~80–120 total |
| `__tests__/services/seller-earnings.test.ts` | 3 | ~80–100 |
| `__tests__/services/payments.test.ts` | 3 | ~90–120 |
| `__tests__/services/payments/adapters/payment-webhook-adapter.test.ts` | 2 | ~80–100 |
| `__tests__/services/payouts.test.ts` | 2 | ~60–80 |
| `__tests__/services/ticket-listings.test.ts` | 0–2 | 0–80 |
| **Optional:** Health / Events / Notifications | 0–1 each | 0–40 each |

**Total: ~12–14 new tests across 5–6 files**, each file well under 150 lines. No 1000-line files; each test has a clear purpose and value.

---

## Implementation order

1. **OrdersService** – add the 4 tests above to existing file.
2. **SellerEarningsService** – new file, 3 tests.
3. **PaymentsService** – new file, 3 tests.
4. **PaymentWebhookAdapter** – new file, 2 tests.
5. **PayoutsService** – new file, 2 tests.
6. **TicketListingsService** – new file only if the two rules exist and are worth guarding; otherwise skip.

Repositories: implement only when a concrete bug or critical path requires it (e.g. one small integration or repo test file per concern).
