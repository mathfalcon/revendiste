# Adding New Payment Providers

This guide walks you through adding a new payment provider (Stripe, PayPal, etc.) to the system.

---

## Overview

The payment system uses a **provider pattern** that makes adding new providers straightforward. You only need to:

1. Create a provider implementation
2. Map provider-specific data to standardized types
3. Configure and inject the provider

---

## Step 1: Create Provider Implementation

Create a new file: `apps/backend/src/services/payments/providers/{provider-name}.provider.ts`

### Example: Stripe Provider

```typescript
import {StripeService} from '~/services/stripe'; // Your Stripe API wrapper
import type {
  PaymentProvider,
  CreatePaymentLinkParams,
  CreatePaymentLinkResult,
  ProviderPaymentDetails,
  StandardPaymentStatus,
  StandardPaymentMethod,
} from './types';

export class StripePaymentProvider implements PaymentProvider {
  readonly providerName = 'stripe';
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  /**
   * Maps Stripe payment status to standardized status
   */
  private mapStatus(stripeStatus: string): StandardPaymentStatus {
    const statusMap: Record<string, StandardPaymentStatus> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'processing',
      'processing': 'processing',
      'succeeded': 'paid',
      'canceled': 'cancelled',
      'failed': 'failed',
    };
    return statusMap[stripeStatus] || 'pending';
  }

  /**
   * Maps Stripe payment method to standardized method
   */
  private mapPaymentMethod(
    stripeMethod?: string,
  ): StandardPaymentMethod | undefined {
    if (!stripeMethod) return undefined;

    const methodMap: Record<string, StandardPaymentMethod> = {
      'card': 'credit_card',
      'bank_transfer': 'bank_transfer',
      'cash': 'cash',
    };
    return methodMap[stripeMethod] || 'other';
  }

  /**
   * Creates a Stripe checkout session
   */
  async createPaymentLink(
    params: CreatePaymentLinkParams,
  ): Promise<CreatePaymentLinkResult> {
    // Create Stripe checkout session
    const session = await this.stripeService.checkout.sessions.create({
      payment_method_types: ['card', 'bank_transfer'],
      line_items: [{
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: params.description,
          },
          unit_amount: Math.round(params.amount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.backUrl,
      client_reference_id: params.orderId,
      expires_at: Math.floor(Date.now() / 1000) + (params.expirationMinutes * 60),
    });

    return {
      providerPaymentId: session.id,
      redirectUrl: session.url!,
      status: this.mapStatus(session.payment_status),
      metadata: {
        sessionId: session.id,
        customerId: session.customer,
        paymentIntent: session.payment_intent,
        fullResponse: session,
      },
    };
  }

  /**
   * Retrieves payment details from Stripe
   */
  async getPaymentDetails(
    providerPaymentId: string,
  ): Promise<ProviderPaymentDetails> {
    // Retrieve checkout session
    const session = await this.stripeService.checkout.sessions.retrieve(
      providerPaymentId,
      {
        expand: ['payment_intent', 'customer'],
      },
    );

    // Get payment intent for detailed information
    const paymentIntent = session.payment_intent;

    return {
      providerPaymentId: session.id,
      status: this.mapStatus(session.payment_status),
      amount: session.amount_total! / 100, // Convert from cents
      currency: session.currency.toUpperCase(),
      paymentMethod: this.mapPaymentMethod(
        paymentIntent?.payment_method_types?.[0],
      ),
      balanceAmount: paymentIntent?.amount_received 
        ? paymentIntent.amount_received / 100 
        : undefined,
      balanceFee: paymentIntent?.charges?.data[0]?.balance_transaction?.fee
        ? paymentIntent.charges.data[0].balance_transaction.fee / 100
        : undefined,
      balanceCurrency: session.currency.toUpperCase(),
      approvedAt: paymentIntent?.status === 'succeeded' 
        ? new Date(paymentIntent.created * 1000)
        : undefined,
      rejectedReason: paymentIntent?.last_payment_error?.message,
      payer: session.customer_details ? {
        email: session.customer_details.email,
        firstName: session.customer_details.name?.split(' ')[0],
        lastName: session.customer_details.name?.split(' ').slice(1).join(' '),
        country: session.customer_details.address?.country,
      } : undefined,
      metadata: {
        sessionId: session.id,
        paymentIntentId: paymentIntent?.id,
        customerId: session.customer,
        fullResponse: session,
      },
    };
  }
}
```

---

## Step 2: Export Provider

Update `apps/backend/src/services/payments/providers/index.ts`:

```typescript
export * from './types';
export * from './dlocal.provider';
export * from './stripe.provider'; // Add this
```

---

## Step 3: Create Provider-Specific Webhook Handler

### Create Webhook Controller Method

Update `apps/backend/src/controllers/webhooks/index.ts`:

```typescript
@Route('webhooks')
@Tags('Webhooks')
export class WebhooksController {
  private paymentsService = new PaymentsService(db);
  private stripePaymentsService = new PaymentsService(
    db, 
    new StripePaymentProvider()
  );

  // Existing dLocal webhook...

  /**
   * Stripe webhook handler
   */
  @Post('/stripe')
  @Middlewares(validateStripeWebhook) // Create this middleware
  public async handleStripeWebhook(
    @Body() body: StripeWebhookPayload,
    @Request() request: express.Request,
  ): Promise<{received: boolean}> {
    const ipAddress = (request.headers['x-forwarded-for'] as string) || request.ip;
    const userAgent = request.headers['user-agent'];

    logger.info('Stripe webhook received', {
      eventType: body.type,
      paymentId: body.data.object.id,
      ipAddress,
    });

    // Process webhook asynchronously
    this.stripePaymentsService
      .handleStripeWebhook(body.data.object.id, { ipAddress, userAgent })
      .then(() => {
        logger.info('Stripe webhook processed successfully');
      })
      .catch(error => {
        logger.error('Error processing Stripe webhook', {
          error: error.message,
        });
      });

    return {received: true};
  }
}
```

### Create Webhook Validation Middleware

Create `apps/backend/src/middleware/validateStripeWebhook.ts`:

```typescript
import {Request, Response, NextFunction} from 'express';
import crypto from 'crypto';
import {STRIPE_WEBHOOK_SECRET} from '~/config/env';
import {logger} from '~/utils';
import {UnauthorizedError} from '~/errors';

export const validateStripeWebhook = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      throw new UnauthorizedError('Missing Stripe signature');
    }

    // Stripe signature validation logic
    // See: https://stripe.com/docs/webhooks/signatures
    
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Verify signature...
    
    return next();
  } catch (error) {
    logger.error('Stripe webhook validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    if (error instanceof UnauthorizedError) {
      res.status(401).json({error: error.message});
      return;
    }
    
    res.status(500).json({error: 'Internal server error'});
  }
};
```

---

## Step 4: Add Provider-Specific Method to PaymentsService

Update `apps/backend/src/services/payments/index.ts`:

```typescript
export class PaymentsService {
  // ... existing code ...

  /**
   * Handles payment status webhook from Stripe
   */
  async handleStripeWebhook(
    paymentId: string,
    webhookMetadata?: {ipAddress?: string; userAgent?: string},
  ): Promise<void> {
    // Same implementation as handleDLocalWebhook
    // The provider pattern handles the differences automatically!
    try {
      const providerPayment = await this.paymentProvider.getPaymentDetails(paymentId);
      
      // ... rest of webhook handling logic (same as dLocal)
    } catch (error: any) {
      logger.error('Error handling payment webhook', {
        paymentId,
        error: error.message,
      });
      throw error;
    }
  }
}
```

---

## Step 5: Update Environment Variables

Add to `apps/backend/.env`:

```bash
# Stripe Configuration
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Update `apps/backend/src/config/env.ts`:

```typescript
const envSchema = z.object({
  // ... existing vars ...
  
  // Stripe
  STRIPE_API_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});
```

---

## Step 6: Update Database Enum

If not already included, add provider to enum:

```sql
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'stripe';
```

Or create a new migration:

```typescript
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TYPE payment_provider 
    ADD VALUE IF NOT EXISTS 'stripe'
  `.execute(db);
}
```

---

## Step 7: Usage

### Inject Provider at Service Level

```typescript
// Use Stripe for this specific service instance
const paymentsService = new PaymentsService(db, new StripePaymentProvider());

// Or let it default to dLocal
const paymentsService = new PaymentsService(db);
```

### Dynamic Provider Selection

```typescript
// Select provider based on configuration or user preference
const getPaymentProvider = (providerName: string): PaymentProvider => {
  switch (providerName) {
    case 'stripe':
      return new StripePaymentProvider();
    case 'dlocal':
      return new DLocalPaymentProvider();
    case 'paypal':
      return new PayPalPaymentProvider();
    default:
      return new DLocalPaymentProvider(); // Default
  }
};

const provider = getPaymentProvider(config.PAYMENT_PROVIDER);
const paymentsService = new PaymentsService(db, provider);
```

---

## Testing Your Provider

### Unit Tests

```typescript
describe('StripePaymentProvider', () => {
  let provider: StripePaymentProvider;

  beforeEach(() => {
    provider = new StripePaymentProvider();
  });

  it('should create payment link', async () => {
    const result = await provider.createPaymentLink({
      orderId: 'test-order',
      amount: 100,
      currency: 'USD',
      description: 'Test payment',
      successUrl: 'http://example.com/success',
      backUrl: 'http://example.com/back',
      notificationUrl: 'http://example.com/webhook',
      expirationMinutes: 10,
    });

    expect(result.providerPaymentId).toBeDefined();
    expect(result.redirectUrl).toContain('stripe.com');
    expect(result.status).toBe('pending');
  });

  it('should retrieve payment details', async () => {
    const details = await provider.getPaymentDetails('cs_test_123');

    expect(details.providerPaymentId).toBe('cs_test_123');
    expect(details.status).toBeDefined();
    expect(details.amount).toBeGreaterThan(0);
  });

  it('should map Stripe status to standard status', () => {
    expect(provider['mapStatus']('succeeded')).toBe('paid');
    expect(provider['mapStatus']('canceled')).toBe('cancelled');
    expect(provider['mapStatus']('failed')).toBe('failed');
  });
});
```

### Integration Tests

```typescript
describe('PaymentsService with Stripe', () => {
  let paymentsService: PaymentsService;

  beforeEach(() => {
    paymentsService = new PaymentsService(db, new StripePaymentProvider());
  });

  it('should create payment link with Stripe', async () => {
    const result = await paymentsService.createPaymentLink({
      orderId: testOrder.id,
      userId: testUser.id,
    });

    expect(result.redirectUrl).toContain('stripe.com');
    
    // Verify payment record created with stripe provider
    const payment = await paymentsRepository.getByOrderId(testOrder.id);
    expect(payment?.provider).toBe('stripe');
  });

  it('should handle Stripe webhook', async () => {
    // Create test payment
    // Simulate Stripe webhook
    // Verify order confirmed
  });
});
```

---

## Provider-Specific Considerations

### Stripe

- **Amounts**: Uses cents (multiply by 100)
- **Webhooks**: Uses `stripe-signature` header
- **Checkout**: Use `checkout.sessions` for hosted checkout
- **Idempotency**: Stripe has built-in idempotency with `idempotency-key` header

### PayPal

- **Amounts**: Uses decimal strings
- **Webhooks**: Requires webhook ID verification
- **Checkout**: Use `orders` API
- **Idempotency**: Use `PayPal-Request-Id` header

### MercadoPago

- **Amounts**: Uses decimal numbers
- **Webhooks**: Uses `x-signature` and `x-request-id` headers
- **Checkout**: Use preferences API
- **Idempotency**: Requires manual implementation

---

## Checklist

Before deploying a new provider:

- [ ] Provider implements `PaymentProvider` interface
- [ ] Status mapping handles all provider statuses
- [ ] Payment method mapping is complete
- [ ] Webhook signature validation implemented
- [ ] Webhook handler returns immediately (fire-and-forget)
- [ ] Environment variables configured
- [ ] Database enum updated
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Error handling tested
- [ ] Idempotency tested
- [ ] Documentation updated

---

## Common Pitfalls

### ❌ Wrong: Processing Webhook Synchronously

```typescript
@Post('/stripe')
public async handleStripeWebhook(...) {
  await this.paymentsService.handleStripeWebhook(...); // Blocks!
  return {received: true};
}
```

### ✅ Correct: Fire-and-Forget

```typescript
@Post('/stripe')
public async handleStripeWebhook(...) {
  this.paymentsService.handleStripeWebhook(...) // No await!
    .then(() => logger.info('Success'))
    .catch(error => logger.error('Error', error));
  
  return {received: true}; // Return immediately
}
```

---

## Support

For questions or issues:
1. Check provider's official documentation
2. Review `PaymentProvider` interface requirements
3. Test with provider's sandbox/test environment first
4. Check logs in `payment_events` table for debugging


