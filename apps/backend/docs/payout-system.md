# Payout System Documentation

## Overview

The payout system enables sellers to withdraw their earnings from sold tickets. The system holds earnings for 48 hours after the event end date to allow for dispute resolution, then makes them available for withdrawal. Sellers can select specific tickets or listing groups to include in each payout request.

## Architecture

### Database Schema

The payout system consists of four main tables:

1. **seller_earnings**: Tracks earnings for each sold ticket
   - Minimal redundancy: only stores `seller_amount`, `hold_until`, `status`, `payout_id`
   - All other data (price, event_end_date, etc.) retrieved via joins
   - Status flow: `pending` → `available` → `paid_out` (or `retained` if disputes exist)

2. **payout_methods**: Stores seller payout destination information
   - MVP: Only `uruguayan_bank` payout type supported
   - Metadata validated with Zod discriminated unions
   - Fields: `account_holder_name`, `account_holder_surname`, `metadata` (bank_name, account_number)

3. **payouts**: Tracks payout requests
   - Links to multiple `seller_earnings` records (selected by seller)
   - Includes `processing_fee` field for admin to track actual bank transfer costs
   - Status flow: `pending` → `processing` → `completed` (or `failed`)

4. **payout_events**: Immutable audit log for payout lifecycle
   - Tracks all status changes and admin actions
   - Includes IP address and user agent for security

### Key Design Decisions

1. **Ticket Selection-Based Payouts**: Sellers explicitly select which listing tickets or listing groups to include in each payout
2. **Minimal Data Redundancy**: Only store what cannot be retrieved via joins
3. **Processing Fee Tracking**: `processing_fee` field allows admin to track actual bank costs
4. **Zod Discriminated Unions**: Metadata validation follows notifications pattern for type safety
5. **Balance-Based Withdrawals**: System calculates available balance from earnings records

## Earnings Creation

### Integration Point: PaymentWebhookAdapter

Seller earnings are created automatically when a payment is confirmed. The integration happens in `PaymentWebhookAdapter.handleSuccessfulPayment()`:

```typescript
// Step 3: Mark tickets as sold
soldTickets = await this.ticketListingsService.markTicketsAsSoldAndNotifySellers(orderId);

// Step 3.5: Create seller earnings for sold tickets
await this.sellerEarningsService.createEarningsForSoldTickets(orderId);
```

**Key Points:**
- Earnings creation happens **inside the transaction** for atomicity
- Called after tickets are marked as sold (Step 3)
- Creates one `seller_earnings` record per sold ticket
- Calculates `seller_amount` using `calculateSellerAmount()` (price - commission - VAT)
- Sets `hold_until = event_end_date + 48 hours`
- Initial status: `pending`

### Earnings Calculation

For each sold ticket:
1. Join to get `listing_tickets.price` and `events.event_end_date`
2. Calculate seller amount: `price - (price * commission_rate) - (commission * vat_rate)`
3. Calculate hold period: `event_end_date + 48 hours`
4. Create `seller_earnings` record with status `pending`

## Hold Periods

### 48-Hour Hold Period

Earnings are held for 48 hours after the event end date to allow for:
- Dispute resolution
- Fraud detection
- Buyer complaints

### Hold Period Release

The system includes an hourly cronjob (`check-payout-hold-periods.ts`) that:
1. Finds earnings where `hold_until <= NOW()` and `status = 'pending'`
2. Checks for open reports/disputes (future: query reports table)
3. Updates status:
   - `available`: No reports exist
   - `retained`: Reports/disputes exist

**Cronjob Location**: `apps/backend/src/cronjobs/check-payout-hold-periods.ts`

**Execution**: Hourly (configured via cron scheduler)

## Ticket Selection

### Available Earnings Endpoint

Sellers can view available earnings grouped by:
- **By Listing**: Shows total amount and ticket count per listing
- **By Ticket**: Shows individual earnings with details

**Endpoint**: `GET /payouts/available-earnings`

**Response Structure**:
```typescript
{
  byListing: Array<{
    listingId: string;
    publisherUserId: string;
    totalAmount: string;
    ticketCount: number;
    currency: EventTicketCurrency;
  }>;
  byTicket: Array<{
    id: string;
    listingTicketId: string;
    sellerAmount: string;
    currency: EventTicketCurrency;
    holdUntil: Date;
    listingId: string;
    publisherUserId: string;
  }>;
}
```

### Payout Request

Sellers can request payouts by selecting:
- **Specific tickets**: `listing_ticket_ids[]` array
- **Entire listings**: `listing_ids[]` array (all tickets from those listings)

**Endpoint**: `POST /payouts/request`

**Validation**:
- All selected tickets must belong to seller
- All selected tickets must have `status = 'available'`
- All selected tickets must have `payout_id IS NULL`
- All selected tickets must be same currency
- Total amount must meet minimum threshold (UYU: $1,000, USD: $25)

**Process**:
1. Validate selection
2. Calculate total amount
3. Validate minimum threshold
4. Create payout record
5. Link selected earnings to payout (update `payout_id` and `status = 'paid_out'`)
6. Store selection in payout `metadata` for reference

## Payout Processing

### Admin Workflow

1. **View Pending Payouts**: Admin views list of pending payouts
2. **Process Payout**: Admin marks payout as `processing`
3. **Perform Transfer**: Admin performs bank transfer manually
4. **Record Details**: Admin fills in:
   - `processing_fee`: Actual bank transfer fee cost
   - `transaction_reference`: Bank transfer reference
   - `notes`: Additional notes
5. **Complete Payout**: Admin marks payout as `completed`

### Processing Fee

The `processing_fee` field allows the company to track actual bank transfer costs:
- Filled by admin when processing transfer
- Used for cost tracking and accounting
- Not charged to seller (platform absorbs fees)

## Balance Calculation

### Balance Endpoint

**Endpoint**: `GET /payouts/balance`

**Response Structure**:
```typescript
{
  available: Array<{
    currency: EventTicketCurrency;
    amount: string;
    count: number;
  }>;
  retained: Array<{...}>;
  pending: Array<{...}>;
  total: Array<{...}>;
}
```

**Calculation Logic**:
- **Available**: Sum of earnings with `status = 'available'` and `payout_id IS NULL`
- **Retained**: Sum of earnings with `status = 'retained'`
- **Pending**: Sum of earnings with `status = 'pending'` (still in hold period)
- **Total**: Sum of all earnings regardless of status

## Payout Methods

### Uruguayan Bank (MVP)

**Fields**:
- `account_holder_name`: First name (stored as column)
- `account_holder_surname`: Last name (stored as column)
- `metadata.bank_name`: Bank name (JSONB, validated with Zod)
- `metadata.account_number`: Account number (JSONB, validated with Zod)

### Zod Validation

Payout method metadata is validated using Zod discriminated unions (following notifications pattern):

```typescript
// packages/shared/src/schemas/payout-methods.ts
export const UruguayanBankMetadataSchema = z.object({
  type: z.literal('uruguayan_bank'),
  bank_name: z.string().min(1),
  account_number: z.string().min(1),
});

export const PayoutMethodMetadataSchema = z.discriminatedUnion('type', [
  UruguayanBankMetadataSchema,
  // Future payout types can be added here
]);
```

**Validation**:
- Happens in `PayoutMethodsService.addPayoutMethod()` and `updatePayoutMethod()`
- Uses `validatePayoutMethodMetadata()` method
- Throws `ValidationError` if metadata is invalid

### Future Payout Types

The system is designed to support additional payout types:
- `wise`: International transfers via Wise
- `other`: Other payment methods

Each payout type will have its own metadata schema in the discriminated union.

## Minimum Thresholds

- **UYU**: Minimum $1,000 UYU
- **USD**: Minimum $25 USD

Configured in `apps/backend/src/config/env.ts`:
- `PAYOUT_MINIMUM_UYU` (default: 1000)
- `PAYOUT_MINIMUM_USD` (default: 25)

## Cronjob Scheduling

The hold period check cronjob runs hourly:

**File**: `apps/backend/src/cronjobs/check-payout-hold-periods.ts`

**Execution**:
- Calls `SellerEarningsService.checkHoldPeriods()`
- Finds earnings ready for release (`hold_until <= NOW()` and `status = 'pending'`)
- Updates status to `available` or `retained` based on reports
- Logs results

**Scheduling**: Configure via cron scheduler (e.g., `0 * * * *` for hourly)

## API Endpoints

### Seller Endpoints

- `GET /payouts/balance` - Get balance by currency and status
- `GET /payouts/available-earnings` - Get available earnings for selection
- `GET /payouts/history` - Get payout history with linked tickets
- `POST /payouts/request` - Request payout with selected tickets/listings
- `GET /payouts/payout-methods` - List payout methods
- `POST /payouts/payout-methods` - Add payout method
- `PUT /payouts/payout-methods/:id` - Update payout method
- `DELETE /payouts/payout-methods/:id` - Delete payout method

### Admin Endpoints (Future)

- `GET /admin/payouts/pending` - List pending payouts
- `POST /admin/payouts/:id/process` - Process payout (includes processing_fee)
- `POST /admin/payouts/:id/fail` - Mark payout as failed

## Error Messages

All error messages are centralized in `apps/backend/src/constants/error-messages.ts`:

- `PAYOUT_NOT_FOUND`: Pago no encontrado
- `PAYOUT_METHOD_NOT_FOUND`: Método de pago no encontrado
- `UNAUTHORIZED_ACCESS`: No estás autorizado para acceder a este pago
- `INSUFFICIENT_BALANCE`: Saldo insuficiente para realizar el pago
- `BELOW_MINIMUM_THRESHOLD`: El monto mínimo para retirar es {amount} {currency}
- `NO_EARNINGS_SELECTED`: Debes seleccionar al menos una ganancia para retirar
- `EARNINGS_NOT_AVAILABLE`: Las ganancias seleccionadas no están disponibles
- `MIXED_CURRENCIES`: No se pueden mezclar diferentes monedas en un mismo pago
- `INVALID_PAYOUT_METHOD`: Método de pago inválido
- `PAYOUT_ALREADY_PROCESSED`: Este pago ya ha sido procesado
- `PAYOUT_NOT_PENDING`: El pago ya está {status}. No se puede procesar.

## Testing Considerations

- Test earnings creation in PaymentWebhookAdapter transaction
- Test hold period release cronjob
- Test ticket selection validation (same currency, belongs to seller, available)
- Test minimum threshold validation
- Test payout linking (multiple earnings per payout)
- Test Zod metadata validation for payout methods

## Future Enhancements

1. **Reports System Integration**: Query reports table to determine if earnings should be retained
2. **International Transfers**: Add Wise payout method support
3. **Automated Processing**: Automate bank transfers via API (when available)
4. **Payout Scheduling**: Allow sellers to schedule recurring payouts
5. **Multi-Currency Support**: Support additional currencies beyond UYU and USD

