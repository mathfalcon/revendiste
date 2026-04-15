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
import {
  PAYOUT_MINIMUM_UYU,
  PAYOUT_MINIMUM_USD,
  PAYOUT_FX_SPREAD_PERCENT,
  PAYOUT_FX_RATE_LOCK_HOURS,
} from '~/config/env';
import {logger} from '~/utils';
import type {EventTicketCurrency, Json, PayoutStatus} from '@revendiste/shared';
import {PayoutMetadataSchema, roundToDecimals} from '@revendiste/shared';
import type {PaginationOptions} from '~/types/pagination';
import {fetchBrouEbrouVentaRate} from '~/services/exchange-rates/providers/UruguayBankProvider';
import {NotificationService} from '~/services/notifications';
import {payoutProviderNameForMethod} from '~/services/payouts/providers/PayoutProviderFactory';
import {
  notifyPayoutCompleted,
  notifyPayoutFailed,
  notifyPayoutCancelled,
} from '~/services/notifications/helpers';

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
    listingId: string;
    sellerAmount: string;
    currency: EventTicketCurrency;
    createdAt: Date;
    eventName: string;
    eventSlug: string;
    eventStartDate: Date;
    eventEndDate: Date;
    ticketWaveName: string;
    venueName: string | null;
  }>;
}

export class PayoutsService {
  constructor(
    private readonly payoutsRepository: PayoutsRepository,
    private readonly payoutMethodsRepository: PayoutMethodsRepository,
    private readonly sellerEarningsRepository: SellerEarningsRepository,
    private readonly payoutEventsRepository: PayoutEventsRepository,
    private readonly notificationService: NotificationService,
    private readonly payoutDocumentsService: PayoutDocumentsService,
    private readonly usersRepository?: UsersRepository,
  ) {}

  /**
   * Indicative UYU→USD conversion inputs for PayPal (same formula as {@link requestPayout}).
   */
  async getPayPalUyuFxPreview() {
    const referenceVentaUyuPerUsd = await fetchBrouEbrouVentaRate();
    const spreadPercent = PAYOUT_FX_SPREAD_PERCENT;
    const effectiveUyuPerUsd = roundToDecimals(
      referenceVentaUyuPerUsd * (1 + spreadPercent / 100),
      6,
    );
    return {
      referenceVentaUyuPerUsd: roundToDecimals(referenceVentaUyuPerUsd, 4),
      spreadPercent,
      effectiveUyuPerUsd,
      rateLockHours: PAYOUT_FX_RATE_LOCK_HOURS,
    };
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
    let rateLock: {
      lockedRate: number;
      brouVentaRate: number;
      spreadPercent: number;
      lockedAt: string;
      rateExpiresAt: string;
      originalAmount: number;
      originalCurrency: string;
      convertedAmount: number;
      convertedCurrency: string;
    } | null = null;

    // Validate currency compatibility between earnings and payout method
    // - PayPal (USD) can receive both USD and UYU (UYU will be converted)
    // - UYU bank account can only receive UYU earnings
    // - USD bank account can only receive USD earnings
    const isPayPal = payoutMethod.payoutType === 'paypal';
    const payoutMethodCurrency = payoutMethod.currency;

    if (!isPayPal) {
      // For non-PayPal methods, currency must match
      if (payoutMethodCurrency === 'UYU' && finalCurrency === 'USD') {
        throw new ValidationError(
          PAYOUT_ERROR_MESSAGES.CURRENCY_MISMATCH_UYU_METHOD_USD_EARNINGS,
        );
      }
      if (payoutMethodCurrency === 'USD' && finalCurrency === 'UYU') {
        throw new ValidationError(
          PAYOUT_ERROR_MESSAGES.CURRENCY_MISMATCH_USD_METHOD_UYU_EARNINGS,
        );
      }
    }

    // If PayPal method and earnings are in UYU, convert to USD (BROU eBROU + spread, rate lock)
    if (isPayPal && finalCurrency === 'UYU') {
      const brouVenta = await fetchBrouEbrouVentaRate();
      const spreadFrac = PAYOUT_FX_SPREAD_PERCENT / 100;
      const effectiveUyuPerUsd = brouVenta * (1 + spreadFrac);
      finalAmount = roundToDecimals(totalAmount / effectiveUyuPerUsd, 2);
      finalCurrency = 'USD';
      const lockedAt = new Date();
      const rateExpiresAt = new Date(
        lockedAt.getTime() +
          PAYOUT_FX_RATE_LOCK_HOURS * 60 * 60 * 1000,
      );
      rateLock = {
        lockedRate: effectiveUyuPerUsd,
        brouVentaRate: brouVenta,
        spreadPercent: PAYOUT_FX_SPREAD_PERCENT,
        lockedAt: lockedAt.toISOString(),
        rateExpiresAt: rateExpiresAt.toISOString(),
        originalAmount: totalAmount,
        originalCurrency: 'UYU',
        convertedAmount: finalAmount,
        convertedCurrency: 'USD',
      };

      logger.info('Currency conversion for PayPal payout (rate lock)', {
        originalAmount: totalAmount,
        brouVenta,
        effectiveUyuPerUsd,
        convertedAmount: finalAmount,
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

      const payoutMetadataParsed = PayoutMetadataSchema.parse({
        listingTicketIds: listingTicketIds || [],
        listingIds: listingIds || [],
        ...(rateLock && {rateLock}),
      });
      const payoutMetadata = payoutMetadataParsed as unknown as Json;

      const payoutProviderDb = payoutProviderNameForMethod(
        payoutMethod.payoutType,
      );

      // Create payout record
      const payout = await payoutsRepo.create({
        sellerUserId,
        payoutMethodId,
        payoutProvider: payoutProviderDb,
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
          rateLock,
          earningsCount: earnings.length,
        },
        createdBy: sellerUserId,
      });

      logger.info('Payout requested', {
        payoutId: payout.id,
        sellerUserId,
        amount: finalAmount,
        currency: finalCurrency,
        rateLock,
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
          listingId: earning.listingId,
          sellerAmount: earning.sellerAmount,
          currency: earning.currency,
          createdAt: earning.createdAt,
          eventName: earning.eventName,
          eventSlug: earning.eventSlug,
          eventStartDate: earning.eventStartDate,
          eventEndDate: earning.eventEndDate,
          ticketWaveName: earning.ticketWaveName,
          venueName: earning.venueName,
        })),
      })),
    };
  }

  /**
   * Admin processing of payout (marks completed).
   * Optional processing fee, FX actuals, transaction reference, and notes.
   * Bank vouchers are stored in `payout_documents` only.
   */
  async processPayout(
    payoutId: string,
    adminUserId: string,
    updates: {
      processingFee?: number;
      transactionReference?: string;
      notes?: string;
      actualBankRate?: number;
      actualUyuCost?: number;
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

    const currentMetadata = PayoutMetadataSchema.parse(payout.metadata || {});
    const rateLockMeta = currentMetadata.rateLock;
    const rateWasExpired =
      rateLockMeta != null
        ? Date.now() > new Date(rateLockMeta.rateExpiresAt).getTime()
        : false;

    let updatedMetadata: Json | undefined;
    if (
      updates.actualBankRate !== undefined ||
      updates.actualUyuCost !== undefined
    ) {
      const nextMeta = {
        ...currentMetadata,
        fxProcessing: {
          ...currentMetadata.fxProcessing,
          ...(updates.actualBankRate !== undefined && {
            actualBankRate: updates.actualBankRate,
          }),
          ...(updates.actualUyuCost !== undefined && {
            actualUyuCost: updates.actualUyuCost,
          }),
          processedAt: new Date().toISOString(),
          rateWasExpired,
        },
      };
      updatedMetadata = nextMeta as unknown as Json;
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
        ...(updatedMetadata !== undefined && {metadata: updatedMetadata}),
      },
    );

    // Update processing fee if provided
    if (updates.processingFee !== undefined) {
      await this.payoutsRepository.updateProcessingFee(
        payoutId,
        updates.processingFee,
      );
    }

    // Mark linked earnings as paid_out (they were 'payout_requested' while pending)
    await this.sellerEarningsRepository.markEarningsAsPaidOut(payoutId);

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
        actualBankRate: updates.actualBankRate,
        actualUyuCost: updates.actualUyuCost,
        rateWasExpired,
      },
      createdBy: adminUserId,
    });

    logger.info('Payout completed by admin', {
      payoutId,
      adminUserId,
      processingFee: updates.processingFee,
      actualBankRate: updates.actualBankRate,
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

        // Clone earnings for audit trail: original earnings keep 'failed_payout' status
        // and stay linked to this payout, new clones are created with 'available' status
        const clonedCount =
          await earningsRepo.cloneEarningsForFailedPayout(payoutId);

        logger.info('Payout failed and earnings cloned for audit', {
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

        // Clone earnings for audit trail: original earnings keep 'failed_payout' status
        // and stay linked to this payout, new clones are created with 'available' status
        const clonedCount =
          await earningsRepo.cloneEarningsForFailedPayout(payoutId);

        logger.info('Payout cancelled and earnings cloned for audit', {
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
    const [summary, page] = await Promise.all([
      this.payoutsRepository.getAdminPayoutsSummary(),
      this.payoutsRepository.getPayoutsForAdminPaginated(pagination, options),
    ]);

    return {
      summary: {
        pendingCount: summary.pendingCount,
        pendingTotalUyu: summary.pendingTotalUyu,
        pendingTotalUsd: summary.pendingTotalUsd,
        processingCount: summary.processingCount,
        failedCount: summary.failedCount,
        completedThisMonthCount: summary.completedThisMonthCount,
        completedThisMonthTotalUyu: summary.completedThisMonthTotalUyu,
        completedThisMonthTotalUsd: summary.completedThisMonthTotalUsd,
      },
      data: page.data,
      pagination: page.pagination,
    };
  }

  /**
   * Get payout details for admin (with full information)
   * Includes settlement information with exchange rates for currency conversion visibility
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

    // Get settlement information (exchange rates, balance amounts from dLocal)
    // This helps admin understand what we actually received vs what seller is owed
    const settlementInfo = await this.payoutsRepository.getPayoutSettlementInfo(
      payoutId,
    );

    const currentBrouVentaRate = await fetchBrouEbrouVentaRate();

    const rl = metadata?.rateLock;
    const nowMs = Date.now();
    const rateLockExpiresAtMs = rl
      ? new Date(rl.rateExpiresAt).getTime()
      : null;
    const rateLockExpired =
      rl != null && rateLockExpiresAtMs != null && nowMs > rateLockExpiresAtMs;
    const rateLockMsRemaining =
      rl != null && rateLockExpiresAtMs != null && !rateLockExpired
        ? Math.max(0, rateLockExpiresAtMs - nowMs)
        : null;

    const uyuCostAtLockedRate =
      rl != null
        ? roundToDecimals(rl.convertedAmount * rl.lockedRate, 2)
        : null;

    const fxDecisionSupport = {
      currentBrouVentaRate,
      spreadPercentConfigured: PAYOUT_FX_SPREAD_PERCENT,
      rateLockHoursConfigured: PAYOUT_FX_RATE_LOCK_HOURS,
      rateLock: rl,
      fxProcessing: metadata?.fxProcessing ?? null,
      rateLockExpired,
      rateLockMsRemaining,
      uyuCostAtLockedRate,
      dLocalAverageExchangeRate:
        settlementInfo?.settlements?.find(
          s => s.averageExchangeRate != null,
        )?.averageExchangeRate ?? null,
    };

    const sellerUser = this.usersRepository
      ? await this.usersRepository.getById(payout.sellerUserId)
      : null;

    return {
      ...payout,
      metadata,
      documents,
      settlementInfo,
      fxDecisionSupport,
      seller: sellerUser
        ? {
            id: sellerUser.id,
            firstName: sellerUser.firstName,
            lastName: sellerUser.lastName,
            email: sellerUser.email,
          }
        : null,
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
   * Recompute USD amount from locked UYU principal using fresh BROU + spread (pending payouts only).
   */
  async refreshPayoutRateLock(payoutId: string, adminUserId: string) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }
    if (payout.status !== 'pending') {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_PENDING(payout.status),
      );
    }

    const currentMetadata = PayoutMetadataSchema.parse(payout.metadata || {});
    if (!currentMetadata.rateLock) {
      throw new ValidationError(PAYOUT_ERROR_MESSAGES.PAYOUT_HAS_NO_RATE_LOCK);
    }

    const brouVenta = await fetchBrouEbrouVentaRate();
    const spreadFrac = PAYOUT_FX_SPREAD_PERCENT / 100;
    const effectiveUyuPerUsd = brouVenta * (1 + spreadFrac);
    const originalAmount = currentMetadata.rateLock.originalAmount;
    const newUsd = roundToDecimals(originalAmount / effectiveUyuPerUsd, 2);

    if (newUsd < PAYOUT_MINIMUM_USD) {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.PAYOUT_RATE_REFRESH_BELOW_MINIMUM(
          PAYOUT_MINIMUM_USD,
        ),
      );
    }

    const lockedAt = new Date();
    const rateExpiresAt = new Date(
      lockedAt.getTime() + PAYOUT_FX_RATE_LOCK_HOURS * 60 * 60 * 1000,
    );

    const newRateLock = {
      lockedRate: effectiveUyuPerUsd,
      brouVentaRate: brouVenta,
      spreadPercent: PAYOUT_FX_SPREAD_PERCENT,
      lockedAt: lockedAt.toISOString(),
      rateExpiresAt: rateExpiresAt.toISOString(),
      originalAmount,
      originalCurrency: currentMetadata.rateLock.originalCurrency,
      convertedAmount: newUsd,
      convertedCurrency: currentMetadata.rateLock.convertedCurrency,
    };

    const newMetadata = PayoutMetadataSchema.parse({
      ...currentMetadata,
      rateLock: newRateLock,
    });

    await this.payoutsRepository.updateStatus(payoutId, 'pending', {
      amount: newUsd,
      metadata: newMetadata as unknown as Json,
    });

    await this.payoutEventsRepository.create({
      payoutId,
      eventType: 'status_change',
      fromStatus: 'pending',
      toStatus: 'pending',
      eventData: {
        kind: 'rate_lock_refreshed',
        adminUserId,
        previousConvertedAmount: currentMetadata.rateLock.convertedAmount,
        newConvertedAmount: newUsd,
        brouVentaRate: brouVenta,
      },
      createdBy: adminUserId,
    });

    logger.info('Payout rate lock refreshed', {
      payoutId,
      adminUserId,
      newUsd,
      brouVenta,
    });

    return this.getPayoutDetailsForAdmin(payoutId, adminUserId);
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
}
