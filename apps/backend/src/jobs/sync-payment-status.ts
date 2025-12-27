import cron from 'node-cron';
import {db} from '~/db';
import {PaymentsRepository} from '~/repositories';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {getPaymentProvider} from '~/services/payments/providers/PaymentProviderFactory';
import {logger} from '~/utils';

/**
 * Processes a single payment status sync
 */
async function processPaymentSync(payment: {
  id: string;
  provider: string;
  providerPaymentId: string;
  status: string;
  orderId: string;
  createdAt: Date;
}): Promise<{success: boolean; paymentId: string}> {
  try {
    // Get provider instance
    const provider = getPaymentProvider(payment.provider as any);

    // Create adapter with provider
    const adapter = new PaymentWebhookAdapter(provider, db);

    // Process webhook (reuses same logic as webhook handler)
    // No webhookMetadata since this is a manual sync, not a webhook
    await adapter.processWebhook(payment.providerPaymentId);

    logger.debug('Payment status synced successfully', {
      paymentId: payment.id,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
    });

    return {success: true, paymentId: payment.id};
  } catch (error) {
    logger.error('Failed to sync payment status', {
      paymentId: payment.id,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {success: false, paymentId: payment.id};
  }
}

/**
 * Scheduled job to sync payment status with providers
 * Runs every 5 minutes to check pending payments and sync their status
 *
 * This job:
 * - Finds pending/processing payments older than 5 minutes
 * - For each payment, queries the provider for current status
 * - Uses PaymentWebhookAdapter to process status updates (same logic as webhooks)
 * - Processes payments in parallel batches for better throughput
 * - Handles errors gracefully (one failure doesn't stop others)
 */
export function startSyncPaymentStatusJob() {
  const paymentsRepository = new PaymentsRepository(db);

  // Run every 5 minutes: '*/5 * * * *'
  // This ensures we catch payments that didn't receive webhooks
  const job = cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('Starting payment status sync...');

      // Get pending payments that need status sync
      // Only check payments older than 5 minutes to avoid checking too early
      const pendingPayments =
        await paymentsRepository.getPendingPaymentsForSync({
          minAgeMinutes: 5,
          limit: 500, // Process up to 500 payments per run (increased since we process in parallel)
        });

      if (pendingPayments.length === 0) {
        logger.debug('No pending payments to sync');
        return;
      }

      logger.info('Found pending payments to sync', {
        count: pendingPayments.length,
      });

      // Process payments in parallel batches
      const BATCH_SIZE = 10; // Process 10 payments concurrently per batch
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < pendingPayments.length; i += BATCH_SIZE) {
        const batch = pendingPayments.slice(i, i + BATCH_SIZE);

        // Process batch in parallel using Promise.allSettled
        // This ensures one failure doesn't stop others
        const results = await Promise.allSettled(
          batch.map(payment => processPaymentSync(payment)),
        );

        // Count successes and errors
        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            errorCount++;
            logger.error('Payment sync promise rejected', {
              error: result.reason,
            });
          }
        }

        logger.debug('Processed payment batch', {
          batchNumber: Math.floor(i / BATCH_SIZE) + 1,
          batchSize: batch.length,
          totalBatches: Math.ceil(pendingPayments.length / BATCH_SIZE),
        });
      }

      logger.info('Payment status sync completed', {
        total: pendingPayments.length,
        successful: successCount,
        errors: errorCount,
      });
    } catch (error) {
      logger.error('Error in payment status sync job:', error);
    }
  });

  logger.info(
    'Scheduled job: sync-payment-status started (runs every 5 minutes)',
  );

  return job;
}
