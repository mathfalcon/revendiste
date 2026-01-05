import {DLocalService} from '~/services/dlocal';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {ClerkWebhookService} from '~/services/clerk-webhook';
import {logger} from '~/utils';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import type {ClerkWebhookRouteBody} from '~/controllers/webhooks/validation';

interface WebhookMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export class WebhooksService {
  private dlocalAdapter: PaymentWebhookAdapter;
  private clerkWebhookService: ClerkWebhookService;

  constructor(db: Kysely<DB>) {
    // Create adapters for each payment provider
    // Each adapter wraps a provider with our business logic
    this.dlocalAdapter = new PaymentWebhookAdapter(
      new DLocalService(), // Provider handles only API calls
      db, // Adapter handles business logic with database
    );

    // Clerk webhook service for auth emails
    this.clerkWebhookService = new ClerkWebhookService();

    // Future providers:
    // this.stripeAdapter = new PaymentWebhookAdapter(new StripeService(), db);
    // this.paypalAdapter = new PaymentWebhookAdapter(new PayPalService(), db);
  }

  async handleDLocalPaymentWebhook(
    paymentId: string,
    metadata: WebhookMetadata,
  ): Promise<void> {
    logger.info('dLocal webhook received', {
      paymentId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    this.dlocalAdapter
      .processWebhook(paymentId, metadata)
      .then(() => logger.info('dLocal webhook processed', {paymentId}))
      .catch(error =>
        logger.error('Error processing dLocal webhook', {
          paymentId,
          error: error.message,
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
    // Fire-and-forget: process asynchronously and don't wait
    this.clerkWebhookService
      .handleWebhook(webhookBody, metadata)
      .then(() =>
        logger.info('Clerk webhook processed successfully', {
          eventType: webhookBody.type,
          emailSlug: webhookBody.data.slug,
        }),
      )
      .catch(error =>
        logger.error('Error processing Clerk webhook', {
          eventType: webhookBody.type,
          emailSlug: webhookBody.data.slug,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
  }
}
