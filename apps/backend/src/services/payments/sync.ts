import type {PaymentProvider as PaymentProviderEnum} from '@revendiste/shared';
import {PaymentsRepository} from '~/repositories';
import {logger} from '~/utils';
import {wideEvent, withDuration} from '~/utils/logFields';

/**
 * Function signature for syncing payment status with a provider.
 * This is injected to keep the service decoupled from the adapter/db.
 */
export type SyncPaymentFunction = (
  providerPaymentId: string,
  provider: PaymentProviderEnum,
) => Promise<void>;

/**
 * Service for syncing payment status with payment providers.
 * Implements the "sync on return" pattern - industry standard for handling
 * webhook delays from payment providers.
 *
 * This service is used by:
 * - OrdersService (sync when user returns from payment)
 * - Cronjob (background sync for reliability)
 */
export class PaymentSyncService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly syncWithProvider: SyncPaymentFunction,
  ) {}

  /**
   * Syncs payment status for a pending order if a payment exists.
   *
   * @param orderId - The order ID to check
   * @returns true if sync was attempted, false if skipped
   */
  async syncPendingOrderPayment(orderId: string): Promise<boolean> {
    // Check if there's a payment for this order
    const payment = await this.paymentsRepository.getByOrderId(orderId);

    // Only sync if payment exists and is still pending
    if (!payment || payment.status !== 'pending') {
      return false;
    }

    const start = Date.now();
    const previousStatus = payment.status;
    try {
      await this.syncWithProvider(payment.providerPaymentId, payment.provider);

      logger.info(
        'payments.sync',
        wideEvent('payments.sync', {
          orderId,
          internalPaymentId: payment.id,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          previousStatus,
          trigger: 'order_access',
          ...withDuration(start),
          outcome: 'success',
        }),
      );

      return true;
    } catch (error) {
      // Log error but don't fail - the cronjob will retry later if needed
      logger.error(
        'payments.sync',
        wideEvent('payments.sync', {
          orderId,
          internalPaymentId: payment.id,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          previousStatus,
          trigger: 'order_access',
          errorMessage: error instanceof Error ? error.message : String(error),
          ...withDuration(start),
          outcome: 'failure',
        }),
      );
      return false;
    }
  }
}
