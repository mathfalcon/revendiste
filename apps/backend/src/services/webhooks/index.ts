import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {ClerkWebhookService} from '~/services/clerk-webhook';
import {logger} from '~/utils';
import type {ClerkWebhookRouteBody} from '~/controllers/webhooks/validation';

interface WebhookMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export class WebhooksService {
  constructor(
    private readonly dlocalAdapter: PaymentWebhookAdapter,
    private readonly clerkWebhookService: ClerkWebhookService,
  ) {
    // Future providers can be added as constructor parameters:
    // private readonly stripeAdapter: PaymentWebhookAdapter,
  }

  async handleDLocalPaymentWebhook(
    paymentId: string,
    metadata: WebhookMetadata,
  ): Promise<void> {
    this.dlocalAdapter.processWebhook(paymentId, metadata).catch(error =>
      logger.error('Error processing dLocal webhook', {
        paymentId,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  /**
   * Handle Clerk webhook events and send authentication-related emails
   * Delegates to ClerkWebhookService which uses the notification system
   */
  async handleClerkWebhook(
    webhookBody: ClerkWebhookRouteBody,
    metadata: WebhookMetadata,
  ): Promise<void> {
    void this.clerkWebhookService.handleWebhook(webhookBody, metadata);
  }
}
