# Payment System Overview

## Table of Contents
- [Architecture](#architecture)
- [Key Concepts](#key-concepts)
- [Payment Flow](#payment-flow)
- [Security Features](#security-features)
- [Database Schema](#database-schema)
- [Provider Pattern](#provider-pattern)

---

## Architecture

The payment system is built with a **provider pattern** architecture, allowing support for multiple payment providers (dLocal, Stripe, PayPal, etc.) through a unified interface.

```
┌─────────────────────────────────────────┐
│         PaymentsService                 │
│  (Provider-Agnostic Orchestration)      │
│                                         │
│  • Validate orders                      │
│  • Extend reservations                  │
│  • Create payment records               │
│  • Handle order confirmation             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       PaymentProvider Interface         │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴───────┬──────────────┐
      ▼                ▼              ▼
┌──────────┐    ┌──────────┐   ┌──────────┐
│  dLocal  │    │  Stripe  │   │  PayPal  │
│ Provider │    │ Provider │   │ Provider │
└──────────┘    └──────────┘   └──────────┘
```

---

## Key Concepts

### 1. **Payment Record**
A record in the `payments` table representing a payment attempt. Includes:
- Provider (dLocal, Stripe, etc.)
- Status (pending, paid, failed, etc.)
- Amount & currency
- Payer information
- Provider-specific metadata

### 2. **Payment Event**
An **immutable** audit log entry in `payment_events` table. Records:
- Every status change
- Every webhook received
- Refunds, chargebacks, disputes
- IP address & User Agent for security

### 3. **Payment Provider**
An implementation of the `PaymentProvider` interface that handles:
- Creating payment links
- Retrieving payment details
- Mapping provider-specific data to standardized format

### 4. **Reservation Extension**
When a payment link is created, the order and ticket reservations are extended by 10 minutes to prevent expiration during payment.

---

## Payment Flow

### Creating a Payment Link

```
1. User clicks "Continuar con el pago"
   ↓
2. Frontend calls POST /api/payments/create-link
   ↓
3. PaymentsService validates order (not expired, belongs to user)
   ↓
4. Transaction 1: Extend order & ticket reservations (+10 min)
   ↓
5. Provider API: Create payment link (dLocal, Stripe, etc.)
   ↓
6. Transaction 2: Create payment record + creation event
   ↓
7. Return redirect URL to frontend
   ↓
8. User redirected to payment provider
```

### Processing Payment Webhook

```
1. Provider sends webhook (e.g., payment status change)
   ↓
2. Middleware validates HMAC signature
   ↓
3. Controller acknowledges immediately (200 OK)
   ↓
4. Async: Retrieve payment details from provider
   ↓
5. Update payment record in database
   ↓
6. Log webhook_received + status_change events
   ↓
7. If PAID: Confirm order & ticket reservations
   ↓
8. If FAILED/EXPIRED: Cancel order & release tickets
```

---

## Security Features

### 1. **Webhook Signature Validation**
- HMAC-SHA256 signature verification
- Prevents unauthorized webhook calls
- Implementation: `validateDLocalWebhook` middleware

### 2. **IP Address & User Agent Tracking**
Every payment event logs:
- **IP Address** - Source of webhook/action
- **User Agent** - Client information

**Why?**
- ✅ **Fraud Detection** - Identify suspicious patterns
- ✅ **Security Auditing** - Track webhook sources
- ✅ **Compliance** - PCI-DSS requirements
- ✅ **Dispute Resolution** - Evidence for chargebacks
- ✅ **Provider Verification** - Ensure webhooks from legitimate sources

**Example Use Cases:**
```sql
-- Find multiple failed payments from same IP
SELECT ip_address, COUNT(*) 
FROM payment_events pe
JOIN payments p ON p.id = pe.payment_id
WHERE p.status = 'failed'
GROUP BY ip_address
HAVING COUNT(*) > 5;

-- Verify webhook came from provider's IP range
SELECT * FROM payment_events
WHERE event_type = 'webhook_received'
AND ip_address NOT IN (SELECT ip FROM provider_ip_whitelist);
```

### 3. **Amount Validation**
- Payment amount MUST match order total
- Prevents tampering with payment amounts

### 4. **Immutable Audit Log**
- `payment_events` table has NO update operations
- Complete history of all payment state changes
- Cannot be modified or deleted

### 5. **Fire-and-Forget Webhook Processing**
- Webhook handler returns immediately
- Processing happens asynchronously
- Prevents timeout and retry loops

---

## Database Schema

### `payments` Table
Current payment state with complete details:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `order_id` | uuid | Reference to order |
| `provider` | enum | dlocal, stripe, paypal, etc. |
| `provider_payment_id` | varchar | Provider's payment ID (e.g., "DP-12345") |
| `status` | enum | pending, paid, failed, cancelled, expired, refunded |
| `payment_method` | enum | credit_card, debit_card, bank_transfer, etc. |
| `amount` | numeric | Amount customer paid |
| `currency` | varchar(3) | ISO 4217 code |
| `balance_amount` | numeric | Amount merchant receives |
| `balance_fee` | numeric | Provider's commission |
| `payer_email` | varchar | Customer's email |
| `provider_metadata` | jsonb | Full provider response |
| `created_at` | timestamptz | When payment was created |
| `approved_at` | timestamptz | When payment was approved |

### `payment_events` Table
**Immutable** audit log of all payment activity:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `payment_id` | uuid | Reference to payment |
| `event_type` | enum | payment_created, status_change, webhook_received, etc. |
| `from_status` | enum | Previous status (for status changes) |
| `to_status` | enum | New status (for status changes) |
| `event_data` | jsonb | Full event payload |
| `ip_address` | varchar(45) | Source IP (IPv4 or IPv6) |
| `user_agent` | text | Client user agent |
| `created_at` | timestamptz | When event occurred |

**Event Types:**
- `payment_created` - Payment record first created
- `status_change` - Payment status changed
- `webhook_received` - Webhook notification received
- `refund_initiated` - Refund process started
- `refund_completed` - Refund processed
- `chargeback_received` - Customer disputed charge
- `dispute_opened` - Dispute filed
- `dispute_resolved` - Dispute resolved
- `fraud_check_failed` - Fraud detection triggered
- `manual_review_required` - Requires human review

---

## Provider Pattern

### Why Provider Pattern?

1. **Extensibility** - Easy to add new payment providers
2. **Maintainability** - Provider changes don't affect business logic
3. **Testability** - Can mock providers in tests
4. **Flexibility** - Can switch providers at runtime

### PaymentProvider Interface

```typescript
interface PaymentProvider {
  readonly providerName: string;
  
  createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult>;
  
  getPaymentDetails(providerPaymentId: string): Promise<ProviderPaymentDetails>;
}
```

### Standardized Types

All providers return standardized types, regardless of their internal API:

- **StandardPaymentStatus** - `pending`, `paid`, `failed`, etc.
- **StandardPaymentMethod** - `credit_card`, `bank_transfer`, etc.
- **ProviderPaymentDetails** - Unified payment information

This abstraction allows `PaymentsService` to work with any provider without modification.

---

## Transaction Safety

### ACID Guarantees

The system uses PostgreSQL transactions to ensure atomicity:

#### **Transaction 1: Reservation Extension**
```typescript
await this.ordersRepository.executeTransaction(async trx => {
  await ordersRepo.update(orderId, { reservationExpiresAt });
  await reservationsRepo.extendReservations(orderId, reservationExpiresAt);
  // Both succeed or both rollback
});
```

#### **Transaction 2: Payment Creation**
```typescript
await this.paymentsRepository.executeTransaction(async trx => {
  const payment = await paymentsRepo.create({...});
  await eventsRepo.create({ eventType: 'payment_created', ... });
  // Both succeed or both rollback
});
```

#### **Transaction 3: Order Confirmation**
```typescript
await this.ordersRepository.executeTransaction(async trx => {
  await ordersRepo.updateStatus(orderId, 'confirmed');
  await reservationsRepo.confirmOrderReservations(orderId);
  // Both succeed or both rollback
});
```

### Why External API Calls Are OUTSIDE Transactions

```typescript
// ❌ WRONG: Long-running transaction
await db.transaction(async trx => {
  await createPaymentRecord();
  await externalAPI.call(); // Network call inside transaction!
  await createEvent();
});

// ✅ CORRECT: External call outside transaction
const result = await externalAPI.call(); // Network call OUTSIDE
await db.transaction(async trx => {
  await createPaymentRecord(result);
  await createEvent();
});
```

**Why?**
- Network calls can take seconds
- Keeps transaction duration short
- Prevents database lock contention
- Avoids transaction timeouts

---

## Critical Edge Cases Handled

### 1. **Reservation Expiration During Payment**

**Problem:** User's reservation expires while entering credit card details.

**Solution:**
- Extend reservation by 10 minutes when payment link is created
- Set payment link expiration to match reservation
- User has guaranteed time window to complete payment

### 2. **Race Condition on Ticket Availability**

**Problem:** Two users trying to book last ticket simultaneously.

**Solution:**
- Database unique constraint on reservations
- Transaction isolation prevents double-booking
- First transaction wins, second gets error

### 3. **Webhook Replay Attacks**

**Problem:** Attacker replays old webhook to trigger duplicate actions.

**Solution:**
- Idempotency: Check if payment status already processed
- Log all webhook attempts in `payment_events`
- HMAC signature prevents tampering

### 4. **Webhook Timeout and Retries**

**Problem:** If webhook processing takes too long, provider retries.

**Solution:**
- Return 200 OK immediately
- Process asynchronously (fire-and-forget)
- Idempotency handles duplicate webhooks

---

## Monitoring & Debugging

### Key Queries

**Find stuck payments:**
```sql
SELECT * FROM payments
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '1 hour';
```

**Audit trail for a payment:**
```sql
SELECT * FROM payment_events
WHERE payment_id = 'uuid'
ORDER BY created_at ASC;
```

**Failed payments by reason:**
```sql
SELECT failure_reason, COUNT(*)
FROM payments
WHERE status = 'failed'
GROUP BY failure_reason;
```

**Revenue by provider:**
```sql
SELECT provider, SUM(balance_amount) as revenue
FROM payments
WHERE status = 'paid'
GROUP BY provider;
```

**Suspicious IP addresses:**
```sql
SELECT ip_address, COUNT(*) as failed_attempts
FROM payment_events pe
JOIN payments p ON p.id = pe.payment_id
WHERE p.status = 'failed'
GROUP BY ip_address
HAVING COUNT(*) > 10;
```

---

## Best Practices

### DO ✅

- Always use transactions for related database operations
- Log all payment state changes in `payment_events`
- Validate payment amounts against orders
- Return webhooks immediately (fire-and-forget)
- Use provider pattern for new payment methods
- Store complete provider responses in `provider_metadata`

### DON'T ❌

- Never put external API calls inside transactions
- Never modify `payment_events` records (immutable)
- Never skip webhook signature validation
- Never process webhooks synchronously
- Never hard-code provider-specific logic in `PaymentsService`
- Never delete payment records (soft delete only)

---

## Support & Troubleshooting

### Common Issues

**Payment stuck in "pending":**
1. Check webhook was received: `SELECT * FROM payment_events WHERE payment_id = ?`
2. Verify provider payment status: Call provider API manually
3. Check webhook endpoint is accessible from provider
4. Verify HMAC signature validation isn't rejecting valid webhooks

**Order confirmed but payment failed:**
- This should NEVER happen due to transactions
- If it does, check transaction logs
- Manual intervention required

**Webhook not received:**
1. Verify `notification_url` in payment record
2. Check server logs for incoming webhook attempts
3. Verify webhook endpoint is publicly accessible
4. Check provider dashboard for webhook delivery status

---

## Future Enhancements

### Planned Features

1. **Refund Support** - Automated refund processing
2. **Recurring Payments** - Subscription support
3. **Multi-Currency** - Automatic currency conversion
4. **Fraud Scoring** - ML-based fraud detection
5. **Payment Analytics** - Real-time dashboard
6. **Provider Fallback** - Automatic failover between providers

### Adding New Providers

See: [Adding Payment Providers Guide](./adding-payment-providers.md)


