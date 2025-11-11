import {DLocalService} from '~/services/dlocal';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {logger} from '~/utils';
import type {Kysely} from 'kysely';
import type {DB} from '~/types';

interface WebhookMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Webhooks Service
 * Routes webhook notifications to the appropriate payment provider adapter
 */
export class WebhooksService {
  private dlocalAdapter: PaymentWebhookAdapter;
  // Future: private stripeAdapter: PaymentWebhookAdapter;
  // Future: private paypalAdapter: PaymentWebhookAdapter;

  constructor(db: Kysely<DB>) {
    // Create adapters for each payment provider
    // Each adapter wraps a provider with our business logic
    this.dlocalAdapter = new PaymentWebhookAdapter(
      new DLocalService(), // Provider handles only API calls
      db, // Adapter handles business logic with database
    );

    // Future providers:
    // this.stripeAdapter = new PaymentWebhookAdapter(new StripeService(), db);
    // this.paypalAdapter = new PaymentWebhookAdapter(new PayPalService(), db);
  }

  /**
   * Handles dLocal payment webhook notification
   * Processes the webhook asynchronously to ensure quick response to dLocal
   */
  async handleDLocalPaymentWebhook(
    paymentId: string,
    metadata: WebhookMetadata,
  ): Promise<void> {
    logger.info('dLocal webhook received', {
      paymentId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Process webhook asynchronously (fire and forget)
    // This ensures we respond to dLocal immediately and avoid timeouts
    this.dlocalAdapter
      .processWebhook(paymentId, metadata)
      .then(() => {
        logger.info('dLocal webhook processed successfully', {
          paymentId,
        });
      })
      .catch(error => {
        logger.error('Error processing dLocal webhook asynchronously', {
          paymentId,
          error: error.message,
          stack: error.stack,
        });
        // Errors are logged but don't affect the HTTP response
        // Payment will need manual review if processing fails
      });
  }
}
