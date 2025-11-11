# Payment Webhook Architecture - Template Method Pattern

## Overview

The payment webhook system uses the **Template Method Pattern** to provide a consistent, extensible architecture for processing webhooks from different payment providers (dLocal, Stripe, PayPal, etc.).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WebhooksController                           │
│  - HTTP layer                                                        │
│  - Extracts metadata (IP, User-Agent)                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         WebhooksService                              │
│  - Routes to appropriate provider                                    │
│  - Handles async processing (fire & forget)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BasePaymentProvider                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Template Method: processWebhook()                             │ │
│  │  1. Fetch payment details (abstract)                          │ │
│  │  2. Find payment record (common)                              │ │
│  │  3. Get order (common)                                        │ │
│  │  4. Validate amount (common)                                  │ │
│  │  5. Normalize status (abstract)                               │ │
│  │  6. Update payment (common)                                   │ │
│  │  7. Log events (common)                                       │ │
│  │  8. Handle order status (common)                              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Abstract Methods (must be implemented):                             │
│  - getProviderName()                                                 │
│  - fetchPaymentDetails()                                             │
│  - normalizeStatus()                                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
  │ DLocalService │  │ StripeService │  │ PayPalService │
  │ extends Base  │  │ extends Base  │  │ extends Base  │
  └───────────────┘  └───────────────┘  └───────────────┘
```

## Core Components

### 1. BasePaymentProvider (Abstract Class)

The base class that defines the webhook processing algorithm.

#### Template Method
```typescript
async processWebhook(
  paymentId: string,
  webhookMetadata?: WebhookMetadata
): Promise<void>
```

This method defines the **invariant algorithm** that all payment providers follow:

```typescript
// Step 1: Fetch payment details (provider-specific)
const paymentData = await this.fetchPaymentDetails(paymentId);

// Step 2-4: Common logic (find record, get order, validate)
const paymentRecord = await this.findPaymentRecord(...);
const order = await this.getOrder(...);
this.validateAmount(...);

// Step 5: Normalize status (provider-specific)
const normalizedStatus = this.normalizeStatus(paymentData.status);

// Step 6-8: Common logic (update, log, handle order)
await this.updatePaymentRecord(...);
await this.logEvents(...);
await this.handleOrderStatusUpdate(...);
```

#### Abstract Methods (Must Implement)
- `getProviderName()`: Returns provider identifier ('dlocal', 'stripe', etc.)
- `fetchPaymentDetails()`: Fetches payment from provider's API
- `normalizeStatus()`: Maps provider status to standard statuses

#### Common Methods (Provided)
- `updatePaymentRecord()`: Updates payment in database
- `handleOrderStatusUpdate()`: Routes to success/failure handlers
- `handleSuccessfulPayment()`: Confirms order + reservations
- `handleFailedPayment()`: Cancels order + releases tickets

### 2. DLocalService (Concrete Implementation)

Extends `BasePaymentProvider` with dLocal-specific logic.

```typescript
export class DLocalService extends BasePaymentProvider {
  constructor(db: Kysely<DB>) {
    super(db);
    // Initialize dLocal HTTP client
  }

  getProviderName(): string {
    return 'dlocal';
  }

  async fetchPaymentDetails(paymentId: string): Promise<NormalizedPaymentData> {
    // Call dLocal API
    const payment = await this.getPayment(paymentId);
    
    // Normalize to standard format
    return {
      providerPaymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      // ... map dLocal fields to standard structure
    };
  }

  normalizeStatus(providerStatus: string): string {
    const statusMap = {
      'PENDING': 'pending',
      'PAID': 'paid',
      'REJECTED': 'failed',
      'CANCELLED': 'cancelled',
      'EXPIRED': 'expired',
    };
    return statusMap[providerStatus] || providerStatus.toLowerCase();
  }

  // DLocal-specific methods
  async createPayment(...) { }
  async getPayment(...) { }
}
```

### 3. Normalized Payment Data

All providers must return payment data in this standard format:

```typescript
interface NormalizedPaymentData {
  providerPaymentId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  balanceAmount?: number;
  balanceFee?: number;
  balanceCurrency?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  payer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    documentType?: string;
    document?: string;
    country?: string;
  };
  metadata: any;
}
```

## Benefits of Template Method Pattern

### 1. Code Reuse
✅ Common webhook logic (database operations, validation, logging) is written once in the base class  
✅ Each provider only implements provider-specific logic  
✅ Reduces code duplication across providers

### 2. Consistency
✅ All providers follow the same algorithm  
✅ Guaranteed order of operations  
✅ Same error handling and logging across providers

### 3. Extensibility
✅ Easy to add new payment providers  
✅ Just extend `BasePaymentProvider` and implement 3 methods  
✅ No changes to existing code (Open/Closed Principle)

### 4. Maintainability
✅ Business logic changes in one place (base class)  
✅ Provider-specific code is isolated  
✅ Easy to understand and test

### 5. Type Safety
✅ Compile-time enforcement of required methods  
✅ TypeScript ensures all providers conform to the interface  
✅ Normalized data structure prevents type errors

## Adding a New Payment Provider

### Example: Adding Stripe Support

#### Step 1: Create StripeService

```typescript
// apps/backend/src/services/stripe/index.ts
import {BasePaymentProvider, NormalizedPaymentData} from '~/services/payments/providers';
import type {Kysely} from 'kysely';
import type {DB} from '~/types';

export class StripeService extends BasePaymentProvider {
  constructor(db: Kysely<DB>) {
    super(db);
    // Initialize Stripe client
  }

  getProviderName(): string {
    return 'stripe';
  }

  async fetchPaymentDetails(paymentId: string): Promise<NormalizedPaymentData> {
    // Fetch from Stripe API
    const payment = await stripe.paymentIntents.retrieve(paymentId);
    
    // Normalize to standard format
    return {
      providerPaymentId: payment.id,
      status: payment.status,
      amount: payment.amount / 100, // Stripe uses cents
      currency: payment.currency,
      // ... map other fields
    };
  }

  normalizeStatus(stripeStatus: string): string {
    const statusMap = {
      'requires_payment_method': 'pending',
      'processing': 'processing',
      'succeeded': 'paid',
      'canceled': 'cancelled',
      'requires_action': 'pending',
    };
    return statusMap[stripeStatus] || stripeStatus;
  }
}
```

#### Step 2: Add to WebhooksService

```typescript
// apps/backend/src/services/webhooks/index.ts
export class WebhooksService {
  private dlocalService: DLocalService;
  private stripeService: StripeService; // Add this

  constructor(db: Kysely<DB>) {
    this.dlocalService = new DLocalService(db);
    this.stripeService = new StripeService(db); // Add this
  }

  async handleStripePaymentWebhook(
    paymentId: string,
    metadata: WebhookMetadata,
  ): Promise<void> {
    logger.info('Stripe webhook received', {paymentId, ...metadata});

    this.stripeService
      .processWebhook(paymentId, metadata)
      .then(() => logger.info('Stripe webhook processed successfully'))
      .catch(error => logger.error('Error processing Stripe webhook', error));
  }
}
```

#### Step 3: Add Webhook Controller Method

```typescript
// apps/backend/src/controllers/webhooks/index.ts
@Post('/stripe')
@Middlewares(validateStripeWebhook)
public async handleStripeWebhook(
  @Body() body: StripeWebhookPayload,
  @Request() request: express.Request,
): Promise<{received: boolean}> {
  const ipAddress = request.headers['x-forwarded-for'] || request.ip;
  const userAgent = request.headers['user-agent'];

  await this.webhooksService.handleStripePaymentWebhook(body.payment_id, {
    ipAddress,
    userAgent,
  });

  return {received: true};
}
```

That's it! The entire payment processing logic (database updates, order handling, logging) is inherited from `BasePaymentProvider`.

## Standard Payment Statuses

All providers must normalize to these standard statuses:

| Status | Description | Action |
|--------|-------------|--------|
| `pending` | Payment initiated, awaiting completion | Log only |
| `processing` | Payment being processed | Log only |
| `paid` | Payment successful | Confirm order + reservations |
| `failed` | Payment failed | Cancel order + release tickets |
| `cancelled` | Payment cancelled by user | Cancel order + release tickets |
| `expired` | Payment expired (timeout) | Cancel order + release tickets |
| `refunded` | Payment refunded | (Future implementation) |

## Testing Strategy

### Unit Testing Each Provider

```typescript
describe('DLocalService', () => {
  it('should normalize dLocal status correctly', () => {
    const service = new DLocalService(db);
    expect(service.normalizeStatus('PAID')).toBe('paid');
    expect(service.normalizeStatus('REJECTED')).toBe('failed');
  });

  it('should fetch and normalize payment details', async () => {
    const data = await service.fetchPaymentDetails('pay_123');
    expect(data).toMatchObject({
      providerPaymentId: expect.any(String),
      status: expect.any(String),
      amount: expect.any(Number),
    });
  });
});
```

### Integration Testing the Template Method

```typescript
describe('BasePaymentProvider processWebhook', () => {
  it('should process successful payment end-to-end', async () => {
    await service.processWebhook('pay_123', {ipAddress: '127.0.0.1'});
    
    // Verify order is confirmed
    const order = await ordersRepo.getById(orderId);
    expect(order.status).toBe('confirmed');
    
    // Verify reservations are confirmed
    const reservations = await reservationsRepo.getByOrderId(orderId);
    expect(reservations.every(r => r.confirmedAt !== null)).toBe(true);
  });
});
```

## Design Patterns Used

1. ✅ **Template Method Pattern** - Base class defines algorithm skeleton
2. ✅ **Inheritance** - Providers extend base class
3. ✅ **Polymorphism** - Each provider implements abstract methods differently
4. ✅ **Dependency Injection** - Database injected into providers
5. ✅ **Data Transfer Object (DTO)** - Normalized payment data structure
6. ✅ **Single Responsibility** - Each provider handles only its own API
7. ✅ **Open/Closed Principle** - Open for extension, closed for modification

## Comparison with Other Approaches

| Approach | Before (Switch Statement) | After (Template Method) |
|----------|---------------------------|-------------------------|
| **Extensibility** | ❌ Modify switch for new provider | ✅ Create new class |
| **Code Reuse** | ❌ Duplicate common logic | ✅ Common logic in base class |
| **Testing** | ❌ Test entire service | ✅ Test each provider independently |
| **Type Safety** | ⚠️ Compile-time warnings only | ✅ Compile-time enforcement |
| **Maintainability** | ❌ Large, complex method | ✅ Small, focused classes |
| **Provider Isolation** | ❌ All mixed together | ✅ Each provider separate |

## Conclusion

The Template Method pattern provides a robust, maintainable architecture for webhook processing that:

- **Reduces code duplication** through inheritance
- **Ensures consistency** across all payment providers
- **Simplifies adding new providers** (just 3 methods!)
- **Improves testability** through isolated, focused classes
- **Enforces standards** through abstract base class

This pattern is particularly well-suited for payment processing where the high-level algorithm is the same, but provider-specific details vary.

