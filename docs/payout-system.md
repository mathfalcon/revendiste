# Payout System Documentation

## Overview

The payout system enables sellers to withdraw their earnings from sold tickets.

For **USD/UYU conversion and rate lock** (BROU + Itaú fallback, admin FX panel, optional `rateLock` on payout metadata for legacy or future FX flows), see [USD / UYU exchange for payouts](./usd-uyu-payout-exchange.md).

Earnings stay **pending** until `event_end_date + PAYOUT_HOLD_PERIOD_HOURS` (default **48 hours**, configurable in `apps/backend/src/config/env.ts`) so disputes can be reviewed. A scheduled job then moves eligible rows to **available** (or **retained** if documentation is missing or reports apply). Sellers choose which tickets or listings to include in each payout request.

## Architecture

### Database Schema

The payout system centers on these tables (among others):

1. **`seller_earnings`**: One row per sold ticket’s seller share  
   - Core columns: `seller_user_id`, `listing_ticket_id`, `seller_amount`, `currency`, `status`, `payout_id`, optional `retained_reason`  
   - **Hold end time is not stored**: release eligibility uses **`events.event_end_date` + `PAYOUT_HOLD_PERIOD_HOURS`** in SQL (the legacy `hold_until` column was removed; see migration `1776031365892_remove_seller_earnings_hold_until.ts`).  
   - Typical status flow: `pending` → `available` → `payout_requested` (while a payout is pending) → `paid_out` after admin completion; or `retained` / `failed_payout` on other paths  

2. **`payout_methods`**: Seller destination (Uruguayan bank account)  
   - `payout_type`: `uruguayan_bank` (see `packages/shared/src/schemas/payout-methods.ts` for metadata validation)  
   - Holder name columns plus JSON `metadata` (bank + account)  

3. **`payouts`**: Withdrawal requests  
   - `amount`, `currency`, `status`, `payout_method_id`, `payout_provider` (`manual_bank`), `processing_fee`, `transaction_reference`, `notes`, `metadata` (JSON), timestamps  
   - Status values include `pending`, `completed`, `failed`, `cancelled`, `processing` (enum allows `processing`; the main admin flow completes from **`pending` → `completed`** in one step)  

4. **`payout_events`**: Immutable audit log (status changes, transfer completed/failed, cancel, etc.)  

5. **`payout_documents`**: Files attached to a payout (e.g. bank transfer proof). **Canonical** place for vouchers; not duplicated in payout `metadata`.  

### Payout metadata (JSON on `payouts`)

Shared schema: `packages/shared/src/schemas/payouts.ts` (`PayoutMetadataSchema`).

- **`listingTicketIds`**, **`listingIds`**: Selection snapshot from the seller request  
- **`rateLock`**: Optional; may appear on payouts that used a locked UYU→USD conversion (BROU/Itaú reference, expiry) — retained for legacy rows and admin tooling, not set on new seller requests today  
- **`fxProcessing`**: Optional fields filled when an admin records **actual** bank execution for USD payouts (e.g. `actualBankRate`, `actualUyuCost`, `processedAt`)  

Unknown keys are allowed at parse time (`.passthrough()`) for forward compatibility.

### Key design decisions

1. **Ticket selection**: Sellers pass `listing_ticket_ids` and/or `listing_ids`; all selected earnings must be `available`, same currency as the payout method, meet minimums, and have no blocking reports.  
2. **Joins over duplication**: Event/listing context comes from joins; earnings rows stay narrow.  
3. **Processing fee**: Optional `processing_fee` on the payout for internal cost tracking (not debited from the seller line item in this model).  
4. **Balance APIs**: Aggregates by status, including **`payout_pending`** (earnings linked to a pending payout) and **`paid_out`**.

## Earnings creation

### Integration: `PaymentWebhookAdapter`

On successful payment, after tickets are marked sold:

```typescript
await this.sellerEarningsService.createEarningsForSoldTickets(orderId);
```

- Runs in the same transaction as the rest of the payment flow where applicable.  
- One `seller_earnings` row per sold ticket.  
- `seller_amount` from `calculateSellerAmount()` (price − commission − VAT on commission).  
- Initial status: **`pending`**.  
- **No `hold_until` column**: hold end = `event_end_date + PAYOUT_HOLD_PERIOD_HOURS` (computed when querying or releasing).

## Hold periods

### Purpose

Post-event delay (default 48h) for disputes, fraud checks, and buyer issues. Open **ticket reports** or **missing seller documentation** after event end can move earnings to **`retained`** instead of **`available`**.

### Release logic

Scheduled job: `apps/backend/src/cronjobs/check-payout-hold-periods.ts`.

1. **Missing documents after event end** (seller-facing checks) — can retain earnings and related reservations per product rules.  
2. **Release holds** — repository selects **`pending`** earnings whose event end + hold hours has passed, excluding rows with open reports; batches updates to **`available`**. Sellers can receive **`seller_earnings_available`** notifications when released.

**Schedule**: Hourly in production setups (cron / worker).

**Manual admin run**: `POST /admin/cronjobs/check-payout-hold-periods` (see `AdminCronjobsController`).

## Ticket selection

### Available earnings

**Endpoint**: `GET /payouts/available-earnings`

Grouped **by listing** and **by ticket**. Each ticket line includes a computed **`holdUntil`** (`eventEndDate + PAYOUT_HOLD_PERIOD_HOURS`) for UI even though the DB no longer stores `hold_until`.

Example shape (illustrative):

```typescript
{
  byListing: Array<{
    listingId: string;
    publisherUserId: string;
    totalAmount: string;
    ticketCount: number;
    currency: EventTicketCurrency;
    eventName: string;
    eventStartDate: Date;
  }>;
  byTicket: Array<{
    id: string;
    listingTicketId: string;
    sellerAmount: string;
    currency: EventTicketCurrency;
    holdUntil: Date;
    listingId: string;
    publisherUserId: string;
    eventName: string;
    eventStartDate: Date;
  }>;
}
```

### Payout request

**Endpoint**: `POST /payouts/request`

**Validation** (non-exhaustive):

- Selection belongs to the seller and is **`available`** with **`payout_id` null**  
- Earnings currency must match the payout method currency (UYU bank ↔ UYU earnings, USD bank ↔ USD earnings)  
- No open reports blocking withdrawal  
- Total meets **`PAYOUT_MINIMUM_UYU` / `PAYOUT_MINIMUM_USD`** from env  

**Process**:

1. Create **`payouts`** row (`status: pending`, amount/currency, `metadata` with selection snapshot).  
2. Link earnings (**`payout_requested`**, `payout_id` set).  
3. Log **`payout_requested`** on `payout_events`.

## Admin processing

Admin UI is a **wizard** on a pending payout: transfer details, optional **FX review** (USD payouts), **upload voucher(s)** → `payout_documents`, then confirm.

**Single completion endpoint**: `POST /admin/payouts/{payoutId}/process`

Body (all optional except logical constraints): `processingFee`, `transactionReference`, `notes`, `actualBankRate`, `actualUyuCost`.

- Sets payout to **`completed`**, `processedAt` / `processedBy`, optional `completedAt`-aligned timestamps, `transaction_reference`, `notes`.  
- Merges **`fxProcessing`** into metadata when bank-rate fields are sent.  
- Marks linked earnings **`paid_out`**.  
- Appends **`transfer_completed`** to `payout_events`.  
- Sends payout completed notification (async).

**Rate lock refresh** (pending payouts that still have `rateLock` in metadata): `POST /admin/payouts/{payoutId}/refresh-rate-lock`.

**Vouchers**: upload/delete via `POST /admin/payouts/{payoutId}/documents` and `DELETE /admin/payouts/documents/{documentId}`. Sellers see files on their payout detail API; there is **no** separate `metadata.voucherUrl` flow.

**Failure / cancel**: `POST .../fail`, `POST .../cancel` (with validation bodies per OpenAPI).

Removed (pre-release cleanup; do not document as current API): **`POST .../complete`**, **`PUT .../payoutId`** generic update, metadata voucher URLs.

## Balance

**Endpoint**: `GET /payouts/balance`

Returns buckets such as **available**, **retained**, **pending** (still in hold), **payout_pending** (linked to an open payout), **paid_out**, and **total** — each grouped by currency. Implementation: `SellerEarningsService.getSellerBalance`.

## Payout methods

- **`uruguayan_bank`**: Bank metadata per shared schemas (bank name + account rules).

Validation runs in `PayoutMethodsService` when adding/updating methods.

## Minimum thresholds

Configured in **`apps/backend/src/config/env.ts`**:

- `PAYOUT_MINIMUM_UYU`  
- `PAYOUT_MINIMUM_USD`  

Use deployed env values as the source of truth (defaults in code may differ per environment).

## Cron jobs (reference)

| Concern | Job module | Admin trigger (if exposed) |
|--------|------------|----------------------------|
| Hold release + missing-doc checks | `check-payout-hold-periods.ts` | `POST /admin/cronjobs/check-payout-hold-periods` |

Other admin-triggered jobs live under **`POST /admin/cronjobs/...`** (see `AdminCronjobsController` and OpenAPI).

## API endpoints (current)

### Seller

- `GET /payouts/balance`  
- `GET /payouts/available-earnings`  
- `GET /payouts/history`  
- `POST /payouts/request`  
- `GET /payouts/payout-methods`  
- `POST /payouts/payout-methods`  
- `PUT /payouts/payout-methods/:id`  
- `DELETE /payouts/payout-methods/:id`  

### Admin — payouts

- `GET /admin/payouts` — list (paginated, optional status filter)  
- `GET /admin/payouts/{payoutId}` — detail (includes documents, events, method snapshot)  
- `POST /admin/payouts/{payoutId}/process` — complete payout (fee, reference, notes, optional FX actuals)  
- `POST /admin/payouts/{payoutId}/refresh-rate-lock` — refresh USD amount / lock for pending FX payout  
- `POST /admin/payouts/{payoutId}/fail`  
- `POST /admin/payouts/{payoutId}/cancel`  
- `POST /admin/payouts/{payoutId}/documents` — multipart upload  
- `DELETE /admin/payouts/documents/{documentId}`  

### Admin — cronjobs

- `POST /admin/cronjobs/check-payout-hold-periods` — run hold / documentation check once  
- (Other routes documented in OpenAPI under **Admin - Cronjobs**.)

## Error messages

Centralized in `apps/backend/src/constants/error-messages.ts` (Spanish copy), including:

- `PAYOUT_NOT_FOUND`, `PAYOUT_METHOD_NOT_FOUND`, `UNAUTHORIZED_ACCESS`  
- `INSUFFICIENT_BALANCE`, `BELOW_MINIMUM_THRESHOLD`, `NO_EARNINGS_SELECTED`  
- `EARNINGS_NOT_AVAILABLE`, `EARNINGS_WITH_OPEN_REPORTS`, `MIXED_CURRENCIES`  
- `INVALID_PAYOUT_METHOD`, `PAYOUT_ALREADY_PROCESSED`, `PAYOUT_NOT_PENDING`  
- Currency mismatch messages when method currency ≠ earnings currency  

## Testing considerations

- Earnings creation inside payment / order flows  
- Hold release job and **retained** paths (reports, missing docs)  
- Payout request validation (currency, minimum, reports)  
- Admin **process** + **documents** + optional **fxProcessing** metadata  
- Failure/cancel and earnings **clone** behavior where applicable  
- Zod validation for payout method metadata  

## Processor settlements (reconciliation)

Provider-agnostic tables:

- **`processor_settlements`**: batch per processor (`payment_provider`, `settlement_id`, uniqueness on the pair).  
- **`processor_settlement_items`**: lines with optional `payment_id` → `payments.id`, optional `payout_id` → `payouts.id`.

Migrations: `1775521218600_processor_settlements.ts`, `1775791957985_add_payment_id_to_processor_settlement_items.ts`.

Admin API: `GET/POST /admin/settlements`, `POST /admin/settlements/preview`, `GET /admin/settlements/{id}/breakdown` (OpenAPI / generated client).

## Future enhancements

1. Automated settlement import per `PaymentProvider`.  
2. Richer finance dashboard and exports.  
3. More payout rails (e.g. Wise) in the shared discriminated metadata.  
4. Optional automated bank payouts via providers.  
5. Scheduled / recurring withdrawals.  
6. Additional currencies beyond UYU/USD where product requires it.
