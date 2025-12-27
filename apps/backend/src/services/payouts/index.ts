import {
  PayoutsRepository,
  PayoutMethodsRepository,
  SellerEarningsRepository,
  PayoutEventsRepository,
  UsersRepository,
} from '~/repositories';
import {PayoutDocumentsService} from '~/services/payout-documents';
import {NotFoundError, ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {PAYOUT_MINIMUM_UYU, PAYOUT_MINIMUM_USD} from '~/config/env';
import {logger} from '~/utils';
import type {EventTicketCurrency, Json, PayoutStatus} from '@revendiste/shared';
import {PayoutMetadataSchema} from '@revendiste/shared';
import type {PaginationOptions} from '~/types/pagination';
import {ExchangeRateService} from '~/services/exchange-rates';
import {NotificationService} from '~/services/notifications';
import {
  notifyPayoutCompleted,
  notifyPayoutFailed,
  notifyPayoutCancelled,
} from '~/services/notifications/helpers';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';

interface RequestPayoutParams {
  sellerUserId: string;
  payoutMethodId: string;
  listingTicketIds?: string[];
  listingIds?: string[];
}

interface PayoutHistoryItem {
  id: string;
  status: string;
  amount: string;
  currency: EventTicketCurrency;
  requestedAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
  linkedEarnings: Array<{
    id: string;
    listingTicketId: string;
    sellerAmount: string;
    currency: EventTicketCurrency;
    createdAt: Date;
  }>;
}

export class PayoutsService {
  private notificationService: NotificationService;
  private payoutDocumentsService: PayoutDocumentsService;

  constructor(
    private readonly payoutsRepository: PayoutsRepository,
    private readonly payoutMethodsRepository: PayoutMethodsRepository,
    private readonly sellerEarningsRepository: SellerEarningsRepository,
    private readonly payoutEventsRepository: PayoutEventsRepository,
    db: Kysely<DB>,
  ) {
    this.notificationService = new NotificationService(
      db,
      new UsersRepository(db),
    );
    this.payoutDocumentsService = new PayoutDocumentsService(db);
  }

  /**
   * Request a payout with selected tickets/listings
   * Validates selected tickets, creates payout, links selected earnings
   */
  async requestPayout(params: RequestPayoutParams) {
    const {sellerUserId, payoutMethodId, listingTicketIds, listingIds} = params;

    // Validate payout method exists and belongs to seller
    const payoutMethod = await this.payoutMethodsRepository.getById(
      payoutMethodId,
    );
    if (!payoutMethod) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_METHOD_NOT_FOUND);
    }
    if (payoutMethod.userId !== sellerUserId) {
      throw new ValidationError(PAYOUT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    // Validate at least one selection
    if (
      (!listingTicketIds || listingTicketIds.length === 0) &&
      (!listingIds || listingIds.length === 0)
    ) {
      throw new ValidationError(PAYOUT_ERROR_MESSAGES.NO_EARNINGS_SELECTED);
    }

    // Validate earnings selection
    const validation =
      await this.sellerEarningsRepository.validateEarningsSelection(
        sellerUserId,
        listingTicketIds,
        listingIds,
      );

    if (!validation.valid) {
      throw new ValidationError(
        validation.error || 'Invalid earnings selection',
      );
    }

    const {earnings} = validation;

    // Calculate total amount
    const totalAmount = earnings.reduce(
      (sum, e) => sum + Number(e.sellerAmount),
      0,
    );

    // Determine final amount and currency (may need conversion for PayPal)
    let finalAmount = totalAmount;
    let finalCurrency = earnings[0].currency;
    let conversionInfo = null;

    // If PayPal method and earnings are in UYU, convert to USD
    if (payoutMethod.payoutType === 'paypal' && finalCurrency === 'UYU') {
      const exchangeRateService = new ExchangeRateService();
      const conversion = await exchangeRateService.convertAmount(
        totalAmount,
        'UYU',
        'USD',
      );
      finalAmount = conversion.convertedAmount;
      finalCurrency = 'USD';
      conversionInfo = {
        originalAmount: totalAmount,
        originalCurrency: 'UYU',
        exchangeRate: conversion.exchangeRate,
        convertedAt: new Date().toISOString(),
      };

      logger.info('Currency conversion for PayPal payout', {
        originalAmount: totalAmount,
        originalCurrency: 'UYU',
        convertedAmount: finalAmount,
        exchangeRate: conversion.exchangeRate,
      });
    }

    // Validate minimum threshold in final currency
    const minimum =
      finalCurrency === 'UYU' ? PAYOUT_MINIMUM_UYU : PAYOUT_MINIMUM_USD;
    if (finalAmount < minimum) {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.BELOW_MINIMUM_THRESHOLD(finalCurrency, minimum),
      );
    }

    // Create payout and link earnings in transaction
    return await this.payoutsRepository.executeTransaction(async trx => {
      const payoutsRepo = this.payoutsRepository.withTransaction(trx);
      const earningsRepo = this.sellerEarningsRepository.withTransaction(trx);
      const payoutEventsRepo = this.payoutEventsRepository.withTransaction(trx);

      // Build payout metadata with conversion info if applicable
      const payoutMetadata: Json = {
        listingTicketIds: listingTicketIds || [],
        listingIds: listingIds || [],
        ...(conversionInfo && {currencyConversion: conversionInfo}),
      } as Json;

      // Create payout record
      const payout = await payoutsRepo.create({
        sellerUserId,
        payoutMethodId,
        status: 'pending',
        amount: finalAmount,
        currency: finalCurrency,
        requestedAt: new Date(),
        metadata: payoutMetadata,
      });

      // Link selected earnings to payout
      await earningsRepo.linkSelectedEarningsToPayout(
        payout.id,
        listingTicketIds,
        listingIds,
      );

      // Log payout requested event
      await payoutEventsRepo.create({
        payoutId: payout.id,
        eventType: 'payout_requested',
        eventData: {
          sellerUserId,
          payoutMethodId,
          amount: finalAmount,
          currency: finalCurrency,
          originalAmount: conversionInfo?.originalAmount,
          originalCurrency: conversionInfo?.originalCurrency,
          exchangeRate: conversionInfo?.exchangeRate,
          earningsCount: earnings.length,
        },
        createdBy: sellerUserId,
      });

      logger.info('Payout requested', {
        payoutId: payout.id,
        sellerUserId,
        amount: finalAmount,
        currency: finalCurrency,
        originalAmount: conversionInfo?.originalAmount,
        originalCurrency: conversionInfo?.originalCurrency,
        exchangeRate: conversionInfo?.exchangeRate,
        earningsCount: earnings.length,
      });

      return payout;
    });
  }

  /**
   * Get payout history for seller dashboard
   * Shows which tickets/listings were included in each payout
   */
  async getPayoutHistory(sellerUserId: string, pagination: PaginationOptions) {
    const result = await this.payoutsRepository.getBySellerIdPaginated(
      sellerUserId,
      pagination,
    );

    // Transform the data to match the expected format
    return {
      ...result,
      data: result.data.map(payout => ({
        id: payout.id,
        status: payout.status,
        amount: payout.amount,
        currency: payout.currency,
        requestedAt: payout.requestedAt,
        processedAt: payout.processedAt || null,
        completedAt: payout.completedAt || null,
        linkedEarnings: (payout.linkedEarnings || []).map(earning => ({
          id: earning.id,
          listingTicketId: earning.listingTicketId,
          sellerAmount: earning.sellerAmount,
          currency: earning.currency,
          createdAt: earning.createdAt,
        })),
      })),
    };
  }

  /**
   * Admin processing of payout
   * Includes processing_fee update and optional voucherUrl
   */
  async processPayout(
    payoutId: string,
    adminUserId: string,
    updates: {
      processingFee?: number;
      transactionReference?: string;
      notes?: string;
      voucherUrl?: string;
    },
  ) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    if (payout.status !== 'pending') {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_PENDING(payout.status),
      );
    }

    // Update metadata if voucherUrl is provided
    let updatedMetadata = payout.metadata;
    if (updates.voucherUrl) {
      const currentMetadata = PayoutMetadataSchema.parse(payout.metadata || {});
      updatedMetadata = {
        ...currentMetadata,
        voucherUrl: updates.voucherUrl,
      } as Json;
    }

    // Update to completed (directly, no processing status needed)
    const updatedPayout = await this.payoutsRepository.updateStatus(
      payoutId,
      'completed',
      {
        processedAt: new Date(),
        processedBy: adminUserId,
        completedAt: new Date(),
        transactionReference: updates.transactionReference,
        notes: updates.notes,
        ...(updatedMetadata && {metadata: updatedMetadata}),
      },
    );

    // Update processing fee if provided
    if (updates.processingFee !== undefined) {
      await this.payoutsRepository.updateProcessingFee(
        payoutId,
        updates.processingFee,
      );
    }

    // Log transfer completed event
    await this.payoutEventsRepository.create({
      payoutId,
      eventType: 'transfer_completed',
      fromStatus: 'pending',
      toStatus: 'completed',
      eventData: {
        adminUserId,
        processingFee: updates.processingFee,
        transactionReference: updates.transactionReference,
        voucherUrl: updates.voucherUrl,
      },
      createdBy: adminUserId,
    });

    logger.info('Payout completed by admin', {
      payoutId,
      adminUserId,
      processingFee: updates.processingFee,
      voucherUrl: updates.voucherUrl,
    });

    // Send notification (fire-and-forget, outside transaction)
    notifyPayoutCompleted(this.notificationService, {
      sellerUserId: payout.sellerUserId,
      payoutId,
      amount: payout.amount,
      currency: payout.currency as 'UYU' | 'USD',
      transactionReference: updates.transactionReference,
      completedAt: new Date(),
    }).catch(error => {
      logger.error('Failed to send payout completed notification', {
        payoutId,
        error,
      });
    });

    return updatedPayout;
  }

  /**
   * Mark payout as completed (after bank transfer)
   * Includes optional voucherUrl for bank transfer voucher
   * Note: This method is now mostly redundant since processPayout completes payouts directly
   * Kept for backward compatibility and manual completion if needed
   */
  async completePayout(
    payoutId: string,
    adminUserId: string,
    options?: {
      transactionReference?: string;
      voucherUrl?: string;
    },
  ) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    if (payout.status !== 'pending') {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_PENDING(payout.status),
      );
    }

    // Update metadata if voucherUrl is provided
    let updatedMetadata = payout.metadata;
    if (options?.voucherUrl) {
      const currentMetadata = PayoutMetadataSchema.parse(payout.metadata || {});
      updatedMetadata = {
        ...currentMetadata,
        voucherUrl: options.voucherUrl,
      } as Json;
    }

    const updatedPayout = await this.payoutsRepository.updateStatus(
      payoutId,
      'completed',
      {
        completedAt: new Date(),
        transactionReference: options?.transactionReference,
        ...(updatedMetadata && {metadata: updatedMetadata}),
      },
    );

    // Log transfer completed event
    await this.payoutEventsRepository.create({
      payoutId,
      eventType: 'transfer_completed',
      fromStatus: 'pending',
      toStatus: 'completed',
      eventData: {
        adminUserId,
        transactionReference: options?.transactionReference,
        voucherUrl: options?.voucherUrl,
      },
      createdBy: adminUserId,
    });

    logger.info('Payout completed', {
      payoutId,
      adminUserId,
      transactionReference: options?.transactionReference,
      voucherUrl: options?.voucherUrl,
    });

    // Send notification (fire-and-forget, outside transaction)
    notifyPayoutCompleted(this.notificationService, {
      sellerUserId: payout.sellerUserId,
      payoutId,
      amount: payout.amount,
      currency: payout.currency as 'UYU' | 'USD',
      transactionReference: options?.transactionReference,
      completedAt: new Date(),
    }).catch(error => {
      logger.error('Failed to send payout completed notification', {
        payoutId,
        error,
      });
    });

    return updatedPayout;
  }

  /**
   * Mark payout as failed
   */
  async failPayout(
    payoutId: string,
    adminUserId: string,
    failureReason: string,
  ) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Wrap entire operation in transaction
    const updatedPayout = await this.payoutsRepository.executeTransaction(
      async trx => {
        const payoutsRepo = this.payoutsRepository.withTransaction(trx);
        const payoutEventsRepo =
          this.payoutEventsRepository.withTransaction(trx);
        const earningsRepo = this.sellerEarningsRepository.withTransaction(trx);

        // Update payout status
        const updated = await payoutsRepo.updateStatus(payoutId, 'failed', {
          failedAt: new Date(),
          failureReason,
        });

        // Log transfer failed event
        await payoutEventsRepo.create({
          payoutId,
          eventType: 'transfer_failed',
          fromStatus: payout.status,
          toStatus: 'failed',
          eventData: {
            adminUserId,
            failureReason,
          },
          createdBy: adminUserId,
        });

        // Clone earnings to make them available again
        const clonedCount = await earningsRepo.cloneEarningsForFailedPayout(
          payoutId,
        );

        logger.info('Payout failed and earnings cloned', {
          payoutId,
          adminUserId,
          failureReason,
          clonedEarningsCount: clonedCount,
        });

        return updated;
      },
    );

    // Send notification (fire-and-forget, outside transaction)
    notifyPayoutFailed(this.notificationService, {
      sellerUserId: payout.sellerUserId,
      payoutId,
      amount: payout.amount,
      currency: payout.currency as 'UYU' | 'USD',
      failureReason,
    }).catch(error => {
      logger.error('Failed to send payout failed notification', {
        payoutId,
        error,
      });
    });

    return updatedPayout;
  }

  /**
   * Cancel a payout
   * If reasonType is 'error', sets status to 'failed' with failedAt
   * If reasonType is 'other', sets status to 'cancelled' without failedAt
   */
  async cancelPayout(
    payoutId: string,
    adminUserId: string,
    reasonType: 'error' | 'other',
    failureReason: string,
  ) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Validate payout can be cancelled
    if (payout.status !== 'pending') {
      throw new ValidationError(
        `No se puede cancelar un retiro con estado: ${payout.status}. Solo se pueden cancelar retiros pendientes.`,
      );
    }

    const newStatus = reasonType === 'error' ? 'failed' : 'cancelled';
    const updateData: {
      status: string;
      failureReason: string;
      failedAt?: Date;
    } = {
      status: newStatus,
      failureReason,
    };

    // Only set failedAt if it's an error
    if (reasonType === 'error') {
      updateData.failedAt = new Date();
    }

    // Wrap entire operation in transaction
    const updatedPayout = await this.payoutsRepository.executeTransaction(
      async trx => {
        const payoutsRepo = this.payoutsRepository.withTransaction(trx);
        const payoutEventsRepo =
          this.payoutEventsRepository.withTransaction(trx);
        const earningsRepo = this.sellerEarningsRepository.withTransaction(trx);

        // Update payout status
        const updated = await payoutsRepo.updateStatus(
          payoutId,
          newStatus,
          updateData,
        );

        // Log cancellation event
        const eventType =
          reasonType === 'error' ? 'transfer_failed' : 'cancelled';
        await payoutEventsRepo.create({
          payoutId,
          eventType,
          fromStatus: payout.status,
          toStatus: newStatus,
          eventData: {
            adminUserId,
            reasonType,
            failureReason,
          },
          createdBy: adminUserId,
        });

        // Clone earnings to make them available again
        const clonedCount = await earningsRepo.cloneEarningsForFailedPayout(
          payoutId,
        );

        logger.info('Payout cancelled and earnings cloned', {
          payoutId,
          adminUserId,
          reasonType,
          failureReason,
          newStatus,
          clonedEarningsCount: clonedCount,
        });

        return updated;
      },
    );

    // Send notification (fire-and-forget, outside transaction)
    if (reasonType === 'error') {
      notifyPayoutFailed(this.notificationService, {
        sellerUserId: payout.sellerUserId,
        payoutId,
        amount: payout.amount,
        currency: payout.currency as 'UYU' | 'USD',
        failureReason,
      }).catch(error => {
        logger.error('Failed to send payout failed notification', {
          payoutId,
          error,
        });
      });
    } else {
      notifyPayoutCancelled(this.notificationService, {
        sellerUserId: payout.sellerUserId,
        payoutId,
        amount: payout.amount,
        currency: payout.currency as 'UYU' | 'USD',
        cancellationReason: failureReason,
      }).catch(error => {
        logger.error('Failed to send payout cancelled notification', {
          payoutId,
          error,
        });
      });
    }

    return updatedPayout;
  }

  /**
   * Get payouts for admin dashboard
   * Returns paginated list of all payouts with seller and payout method info
   */
  async getPayoutsForAdmin(
    pagination: PaginationOptions,
    options?: {status?: PayoutStatus},
  ) {
    return await this.payoutsRepository.getPayoutsForAdminPaginated(
      pagination,
      options,
    );
  }

  /**
   * Get payout details for admin (with full information)
   */
  async getPayoutDetailsForAdmin(payoutId: string, adminUserId: string) {
    const payout = await this.payoutsRepository.getWithLinkedEarnings(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Get payout method details (needed for admin to process payout)
    const payoutMethod = payout.payoutMethodId
      ? await this.payoutMethodsRepository.getById(payout.payoutMethodId)
      : null;

    // Validate and parse metadata
    const metadata = payout.metadata
      ? PayoutMetadataSchema.parse(payout.metadata)
      : null;

    // Get documents for this payout (admin access)
    const documents = await this.payoutDocumentsService.getPayoutDocuments(
      payoutId,
      adminUserId,
      true, // isAdmin
    );

    return {
      ...payout,
      metadata,
      documents,
      payoutMethod: payoutMethod
        ? {
            id: payoutMethod.id,
            payoutType: payoutMethod.payoutType,
            accountHolderName: payoutMethod.accountHolderName,
            accountHolderSurname: payoutMethod.accountHolderSurname,
            currency: payoutMethod.currency,
            metadata: payoutMethod.metadata,
          }
        : null,
    };
  }

  /**
   * Get payout details for user (with events, method details, etc.)
   * Validates payout belongs to sellerUserId
   */
  async getPayoutDetailsForUser(payoutId: string, sellerUserId: string) {
    const payout = await this.payoutsRepository.getWithLinkedEarnings(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Validate payout belongs to seller
    if (payout.sellerUserId !== sellerUserId) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Get payout events
    const events = await this.payoutEventsRepository.getByPayoutId(payoutId);

    // Get payout method details
    const payoutMethod = payout.payoutMethodId
      ? await this.payoutMethodsRepository.getById(payout.payoutMethodId)
      : null;

    // Validate and parse metadata
    const metadata = payout.metadata
      ? PayoutMetadataSchema.parse(payout.metadata)
      : null;

    // Get documents for this payout (seller access)
    const documents = await this.payoutDocumentsService.getPayoutDocuments(
      payoutId,
      sellerUserId,
      false, // isAdmin
    );

    return {
      ...payout,
      metadata,
      events,
      documents,
      payoutMethod: payoutMethod
        ? {
            id: payoutMethod.id,
            payoutType: payoutMethod.payoutType,
            accountHolderName: payoutMethod.accountHolderName,
            accountHolderSurname: payoutMethod.accountHolderSurname,
            currency: payoutMethod.currency,
            metadata: payoutMethod.metadata,
          }
        : null,
    };
  }

  /**
   * Update payout (admin only)
   * Allows updating status, processing fee, notes, and voucher URL
   */
  async updatePayout(
    payoutId: string,
    adminUserId: string,
    updates: {
      status?: 'pending' | 'completed' | 'failed' | 'cancelled';
      processingFee?: number;
      notes?: string;
      voucherUrl?: string;
      transactionReference?: string;
    },
  ) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Update metadata if voucherUrl is provided
    let updatedMetadata = payout.metadata;
    if (updates.voucherUrl !== undefined) {
      const currentMetadata = PayoutMetadataSchema.parse(payout.metadata || {});
      updatedMetadata = {
        ...currentMetadata,
        voucherUrl: updates.voucherUrl || undefined,
      } as Json;
    }

    // Build update object
    const updateData: {
      status?: 'pending' | 'completed' | 'failed' | 'cancelled';
      notes?: string;
      transactionReference?: string;
      metadata?: Json;
      processedAt?: Date;
      processedBy?: string;
      completedAt?: Date;
      failedAt?: Date;
      failureReason?: string;
    } = {};

    if (updates.status) {
      updateData.status = updates.status;
      // Set appropriate timestamps based on status
      if (updates.status === 'completed') {
        updateData.completedAt = new Date();
      } else if (updates.status === 'failed') {
        updateData.failedAt = new Date();
      }
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }

    if (updates.transactionReference !== undefined) {
      updateData.transactionReference = updates.transactionReference;
    }

    if (updatedMetadata) {
      updateData.metadata = updatedMetadata;
    }

    const updatedPayout = await this.payoutsRepository.updateStatus(
      payoutId,
      updates.status || payout.status,
      updateData,
    );

    // Update processing fee if provided
    if (updates.processingFee !== undefined) {
      await this.payoutsRepository.updateProcessingFee(
        payoutId,
        updates.processingFee,
      );
    }

    // Log status change event
    await this.payoutEventsRepository.create({
      payoutId,
      eventType: 'status_change',
      fromStatus: payout.status,
      toStatus: updates.status || payout.status,
      eventData: {
        adminUserId,
        processingFee: updates.processingFee,
        voucherUrl: updates.voucherUrl,
        transactionReference: updates.transactionReference,
      },
      createdBy: adminUserId,
    });

    logger.info('Payout updated by admin', {
      payoutId,
      adminUserId,
      updates,
    });

    return updatedPayout;
  }
}
