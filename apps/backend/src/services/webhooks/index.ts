import {DLocalService} from '~/services/dlocal';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {logger} from '~/utils';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';

interface WebhookMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export class WebhooksService {
  private dlocalAdapter: PaymentWebhookAdapter;

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
}
