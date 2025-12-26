import {
  PayoutsRepository,
  PayoutMethodsRepository,
  SellerEarningsRepository,
  PayoutEventsRepository,
} from '~/repositories';
import {NotFoundError, ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {PAYOUT_MINIMUM_UYU, PAYOUT_MINIMUM_USD} from '~/config/env';
import {logger} from '~/utils';
import type {EventTicketCurrency, Json} from '@revendiste/shared';
import type {PaginationOptions} from '~/types/pagination';
import {ExchangeRateService} from '~/services/exchange-rates';

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
  constructor(
    private readonly payoutsRepository: PayoutsRepository,
    private readonly payoutMethodsRepository: PayoutMethodsRepository,
    private readonly sellerEarningsRepository: SellerEarningsRepository,
    private readonly payoutEventsRepository: PayoutEventsRepository,
  ) {}

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
   * Includes processing_fee update
   */
  async processPayout(
    payoutId: string,
    adminUserId: string,
    updates: {
      processingFee?: number;
      transactionReference?: string;
      notes?: string;
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

    // Update to processing
    const updatedPayout = await this.payoutsRepository.updateStatus(
      payoutId,
      'processing',
      {
        processedAt: new Date(),
        processedBy: adminUserId,
        ...updates,
      },
    );

    // Update processing fee if provided
    if (updates.processingFee !== undefined) {
      await this.payoutsRepository.updateProcessingFee(
        payoutId,
        updates.processingFee,
      );
    }

    // Log admin processed event
    await this.payoutEventsRepository.create({
      payoutId,
      eventType: 'admin_processed',
      fromStatus: 'pending',
      toStatus: 'processing',
      eventData: {
        adminUserId,
        processingFee: updates.processingFee,
        transactionReference: updates.transactionReference,
      },
      createdBy: adminUserId,
    });

    logger.info('Payout processed by admin', {
      payoutId,
      adminUserId,
      processingFee: updates.processingFee,
    });

    return updatedPayout;
  }

  /**
   * Mark payout as completed (after bank transfer)
   */
  async completePayout(
    payoutId: string,
    adminUserId: string,
    transactionReference?: string,
  ) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    if (payout.status !== 'processing') {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_PENDING(payout.status),
      );
    }

    const updatedPayout = await this.payoutsRepository.updateStatus(
      payoutId,
      'completed',
      {
        completedAt: new Date(),
        transactionReference,
      },
    );

    // Log transfer completed event
    await this.payoutEventsRepository.create({
      payoutId,
      eventType: 'transfer_completed',
      fromStatus: 'processing',
      toStatus: 'completed',
      eventData: {
        adminUserId,
        transactionReference,
      },
      createdBy: adminUserId,
    });

    logger.info('Payout completed', {
      payoutId,
      adminUserId,
      transactionReference,
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

    const updatedPayout = await this.payoutsRepository.updateStatus(
      payoutId,
      'failed',
      {
        failedAt: new Date(),
        failureReason,
      },
    );

    // Log transfer failed event
    await this.payoutEventsRepository.create({
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

    logger.info('Payout failed', {
      payoutId,
      adminUserId,
      failureReason,
    });

    return updatedPayout;
  }
}
