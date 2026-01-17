import type {PaymentProvider as PaymentProviderEnum} from '@revendiste/shared';
import {PaymentsRepository} from '~/repositories';
import {logger} from '~/utils';

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

    try {
      logger.info('Syncing payment status on order access', {
        orderId,
        paymentId: payment.id,
        provider: payment.provider,
        providerPaymentId: payment.providerPaymentId,
      });

      await this.syncWithProvider(payment.providerPaymentId, payment.provider);

      logger.info('Payment status synced successfully on order access', {
        orderId,
        paymentId: payment.id,
      });

      return true;
    } catch (error) {
      // Log error but don't fail - the cronjob will retry later if needed
      logger.error('Failed to sync payment status on order access', {
        orderId,
        paymentId: payment.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
