# Adapter Pattern Refactor - Summary

## Overview

Successfully refactored from **Template Method Pattern** to **Adapter Pattern** for payment webhook processing. This provides better separation of concerns and makes the system more maintainable.

## What Changed

### Before (Template Method Pattern)

```
BasePaymentProvider (abstract class)
├── All business logic (DB, orders, reservations)
├── Abstract methods (fetch, normalize)
└── DLocalService extends Base
    ├── Inherits all business logic
    ├── Tightly coupled to our domain
    └── Hard to test independently
```

### After (Adapter Pattern)

```
PaymentProvider (interface)
├── Simple API contract
└── DLocalService implements PaymentProvider
    ├── ONLY handles dLocal API
    ├── No business logic
    └── Easy to test

PaymentWebhookAdapter
├── Contains ALL business logic
├── Works with any PaymentProvider
└── Normalizes provider data to our system
```

## New Architecture

```typescript
// 1. Simple Provider Interface
interface PaymentProvider {
  name: string;
  createPayment(params): Promise<CreatePaymentResult>;
  getPayment(paymentId): Promise<ProviderPaymentData>;
}

// 2. DLocalService - Only API Calls
class DLocalService implements PaymentProvider {
  name = 'dlocal';
  
  async createPayment(params) {
    // Call dLocal API
    return await this.client.post('/v1/payments', ...);
  }
  
  async getPayment(paymentId) {
    // Call dLocal API
    return await this.client.get(`/v1/payments/${paymentId}`);
  }
  
  // dLocal-specific methods
  async createDLocalPayment(...) { }
  async getDLocalPayment(...) { }
}

// 3. PaymentWebhookAdapter - All Business Logic
class PaymentWebhookAdapter {
  constructor(
    private provider: PaymentProvider, // Injected
    private db: Kysely<DB>,            // Business logic needs
  ) { }
  
  async processWebhook(paymentId, metadata) {
    // Fetch from provider
    const providerData = await this.provider.getPayment(paymentId);
    
    // Normalize
    const normalized = this.normalizePaymentData(providerData);
    
    // Our business logic
    await this.processNormalizedPayment(normalized, metadata);
  }
}

// 4. Usage in WebhooksService
class WebhooksService {
  private dlocalAdapter: PaymentWebhookAdapter;
  
  constructor(db) {
    this.dlocalAdapter = new PaymentWebhookAdapter(
      new DLocalService(), // Provider (no DB needed)
      db                    // Adapter handles DB
    );
  }
  
  async handleDLocalWebhook(paymentId, metadata) {
    await this.dlocalAdapter.processWebhook(paymentId, metadata);
  }
}
```

## Files Created

1. **`PaymentProvider.interface.ts`** - Simple interface for providers
2. **`PaymentWebhookAdapter.ts`** - Contains all business logic
3. **`adapters/index.ts`** - Exports for adapters

## Files Modified

1. **`DLocalService`** - Now lightweight, only handles API calls
2. **`WebhooksService`** - Uses adapter instead of provider directly
3. **`dlocal.provider.ts`** - Updated to use new method names

## Files Deleted

1. **`BasePaymentProvider.ts`** - No longer needed

## Benefits of Adapter Pattern

### 1. **Loose Coupling**
- **Before**: DLocalService knew about orders, reservations, database
- **After**: DLocalService only knows about dLocal API

### 2. **Single Responsibility**
- **Provider**: API communication only
- **Adapter**: Business logic only
- **Service**: Routing only

### 3. **Easier Testing**
```typescript
// Test provider without database
describe('DLocalService', () => {
  it('should fetch payment', async () => {
    const service = new DLocalService(); // No DB needed!
    const payment = await service.getPayment('pay_123');
    expect(payment.id).toBe('pay_123');
  });
});

// Test adapter with mock provider
describe('PaymentWebhookAdapter', () => {
  it('should process webhook', async () => {
    const mockProvider = {
      name: 'mock',
      getPayment: jest.fn(),
    };
    const adapter = new PaymentWebhookAdapter(mockProvider, db);
    // Test business logic independently
  });
});
```

### 4. **Composition Over Inheritance**
- **Before**: Inheritance (inflexible, tight coupling)
- **After**: Composition (flexible, loose coupling)

### 5. **Provider Independence**
- **Before**: Provider can't be used without our system
- **After**: Provider is standalone, can be used anywhere

### 6. **Third-Party SDK Support**
```typescript
// Easy to wrap third-party SDKs
class StripeService implements PaymentProvider {
  private stripe: Stripe; // Official Stripe SDK
  
  constructor() {
    this.stripe = new Stripe(API_KEY);
  }
  
  async getPayment(paymentId) {
    return await this.stripe.paymentIntents.retrieve(paymentId);
  }
}
```

## Adding a New Provider (Example: Stripe)

### Step 1: Create Provider Service

```typescript
// apps/backend/src/services/stripe/index.ts
import Stripe from 'stripe';
import type {PaymentProvider} from '~/services/payments/providers';

export class StripeService implements PaymentProvider {
  readonly name = 'stripe';
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  
  async createPayment(params) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amount * 100, // Stripe uses cents
      currency: params.currency,
      metadata: {orderId: params.orderId},
    });
    
    return {
      id: paymentIntent.id,
      redirectUrl: paymentIntent.next_action?.redirect_to_url?.url,
      status: paymentIntent.status,
    };
  }
  
  async getPayment(paymentId) {
    return await this.stripe.paymentIntents.retrieve(paymentId);
  }
}
```

### Step 2: Add Normalizer to Adapter

```typescript
// In PaymentWebhookAdapter.ts
private normalizePaymentData(providerPayment) {
  const normalizers = {
    dlocal: this.normalizeDLocalPayment,
    stripe: this.normalizeStripePayment, // Add this
  };
  
  return normalizers[this.provider.name](providerPayment);
}

private normalizeStripePayment(payment: any): NormalizedPaymentData {
  return {
    providerPaymentId: payment.id,
    status: this.normalizeStripeStatus(payment.status),
    amount: payment.amount / 100, // Convert from cents
    currency: payment.currency,
    // ... map other fields
  };
}

private normalizeStripeStatus(stripeStatus: string): string {
  const statusMap = {
    'requires_payment_method': 'pending',
    'processing': 'processing',
    'succeeded': 'paid',
    'canceled': 'cancelled',
  };
  return statusMap[stripeStatus] || stripeStatus;
}
```

### Step 3: Add to WebhooksService

```typescript
// In WebhooksService
constructor(db) {
  this.dlocalAdapter = new PaymentWebhookAdapter(
    new DLocalService(),
    db
  );
  
  this.stripeAdapter = new PaymentWebhookAdapter(
    new StripeService(),
    db
  );
}

async handleStripeWebhook(paymentId, metadata) {
  await this.stripeAdapter.processWebhook(paymentId, metadata);
}
```

That's it! The adapter handles all the business logic automatically.

## Key Design Decisions

### Why Adapter vs Template Method?

| Concern | Template Method | Adapter Pattern |
|---------|----------------|-----------------|
| Coupling | High (inheritance) | Low (composition) |
| Provider Responsibility | API + Business Logic | API Only |
| Testing | Need full setup | Independent testing |
| Flexibility | Limited | High |
| Third-party SDKs | Hard to wrap | Easy to wrap |
| Reusability | Tied to our system | Standalone |

### Adapter Pattern Is Better When:
- ✅ Providers should be independent
- ✅ Business logic is consistent across providers
- ✅ You want to use third-party SDKs
- ✅ Testing each piece independently is important
- ✅ Provider logic might be reused elsewhere

### Template Method Is Better When:
- ⚠️ Algorithm varies significantly between providers
- ⚠️ Subclasses need access to protected helper methods
- ⚠️ You want to enforce algorithm structure via inheritance

For our payment system, **Adapter is the clear winner** because:
1. All providers follow the same webhook processing algorithm
2. Provider services should be lightweight and independent
3. Business logic (orders, reservations) is the same for all providers
4. We want to easily integrate third-party SDKs
5. Testing providers without DB setup is valuable

## Migration Notes

### Breaking Changes
- None! The public API (WebhooksService) remains the same
- Controllers don't need any changes

### Internal Changes
- DLocalService constructor no longer needs `db` parameter (but it's not used anywhere directly)
- Webhook processing moved from provider to adapter

### Testing Updates
If you have tests for DLocalService, update them:

```typescript
// Before
const service = new DLocalService(db); // Needed DB

// After  
const service = new DLocalService(); // No DB needed!
```

## Performance Impact

**No negative impact.** In fact, slight improvements:
- Providers are lighter (no repository instances)
- Better memory usage (repositories only in adapter)
- Same number of database queries

## Conclusion

The Adapter pattern provides:
- ✅ Better separation of concerns
- ✅ Easier testing
- ✅ More flexible architecture
- ✅ Provider independence
- ✅ Same functionality, better structure

This refactor positions us well for adding more payment providers (Stripe, PayPal, etc.) with minimal effort.

