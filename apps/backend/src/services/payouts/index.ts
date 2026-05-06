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
  PAYOUT_MINIMUM_ARS,
  PAYOUT_MINIMUM_UYU,
  PAYOUT_MINIMUM_USD,
  PAYOUT_FX_SPREAD_PERCENT,
} from '~/config/env';
import {logger} from '~/utils';
import type {
  EventTicketCurrency,
  FxSnapshot,
  Json,
  PayoutProvider,
  PayoutStatus,
} from '@revendiste/shared';
import {PayoutMetadataSchema, roundToDecimals} from '@revendiste/shared';
import {createDLocalPayoutQuote} from '~/services/payouts/providers/dlocal-payouts/client';
import {isDLocalGoPayoutsEnabled} from '~/lib/feature-flags';
import type {PaginationOptions} from '~/types/pagination';
import {fetchBrouEbrouVentaRate} from '~/services/exchange-rates/providers/UruguayBankProvider';
import {NotificationService} from '~/services/notifications';
import {
  getPayoutProviderByName,
  resolvePayoutProviderName,
} from '~/services/payouts/providers/PayoutProviderRegistry';
import type {PayoutProviderName} from '~/services/payouts/providers/PayoutProvider.interface';
import {
  notifyPayoutCompleted,
  notifyPayoutFailed,
  notifyPayoutCancelled,
} from '~/services/notifications/helpers';
import {selectPayoutFxStrategy} from '~/services/payouts/fx/selectPayoutFxStrategy';

interface RequestPayoutParams {
  sellerUserId: string;
  payoutMethodId: string;
  listingTicketIds?: string[];
  listingIds?: string[];
  /** SHA-256 hex of optional client Idempotency-Key header */
  idempotencyKeyHash?: string | null;
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
   * Request a payout with selected tickets/listings
   * Validates selected tickets, creates payout, links selected earnings
   */
  async requestPayout(params: RequestPayoutParams) {
    const {
      sellerUserId,
      payoutMethodId,
      listingTicketIds,
      listingIds,
      idempotencyKeyHash,
    } = params;

    if (idempotencyKeyHash) {
      const existing =
        await this.payoutsRepository.findRecentBySellerAndIdempotencyKeyHash(
          sellerUserId,
          idempotencyKeyHash,
        );
      if (existing) {
        const parsed = PayoutMetadataSchema.safeParse(existing.metadata);
        return {
          ...existing,
          fxSnapshot: parsed.success ? (parsed.data.fxSnapshot ?? null) : null,
        };
      }
    }

    const payoutMethod =
      await this.payoutMethodsRepository.getById(payoutMethodId);
    if (!payoutMethod) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_METHOD_NOT_FOUND);
    }
    if (payoutMethod.userId !== sellerUserId) {
      throw new ValidationError(PAYOUT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    if (
      (!listingTicketIds || listingTicketIds.length === 0) &&
      (!listingIds || listingIds.length === 0)
    ) {
      throw new ValidationError(PAYOUT_ERROR_MESSAGES.NO_EARNINGS_SELECTED);
    }

    const dlocalGoEnabled = await isDLocalGoPayoutsEnabled(sellerUserId);
    if (payoutMethod.payoutType === 'argentinian_bank' && !dlocalGoEnabled) {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.DLOCAL_GO_PAYOUTS_DISABLED,
      );
    }

    const preValidate =
      await this.sellerEarningsRepository.validateEarningsSelection(
        sellerUserId,
        listingTicketIds,
        listingIds,
      );
    if (!preValidate.valid) {
      throw new ValidationError(
        preValidate.error || 'Invalid earnings selection',
      );
    }

    const payoutMethodCurrency = payoutMethod.currency;
    const usdPrincipal = preValidate.earnings.reduce(
      (sum, e) => sum + Number(e.sellerAmount),
      0,
    );
    let finalAmount = usdPrincipal;
    let finalCurrency = preValidate.earnings[0].currency;

    if (
      payoutMethod.payoutType === 'argentinian_bank' &&
      finalCurrency !== 'USD'
    ) {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.ARGENTINIAN_PAYOUT_REQUIRES_USD_EARNINGS,
      );
    }

    if (payoutMethod.payoutType === 'uruguayan_bank') {
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

    let arFxSnapshot: FxSnapshot | undefined;
    if (
      payoutMethod.payoutType === 'argentinian_bank' &&
      payoutMethodCurrency === 'ARS' &&
      dlocalGoEnabled
    ) {
      let quote: Awaited<ReturnType<typeof createDLocalPayoutQuote>>;
      try {
        quote = await createDLocalPayoutQuote({
          country: 'AR',
          sourceCurrency: 'USD',
          destinationCurrency: 'ARS',
          sourceAmount: usdPrincipal,
        });
      } catch {
        throw new ValidationError(
          PAYOUT_ERROR_MESSAGES.DLOCAL_PAYOUT_QUOTE_FAILED,
        );
      }
      const dest = quote.details?.destination_amount;
      if (dest == null || !Number.isFinite(dest)) {
        throw new ValidationError(
          PAYOUT_ERROR_MESSAGES.DLOCAL_PAYOUT_QUOTE_FAILED,
        );
      }
      const nowIso = new Date().toISOString();
      const exp =
        typeof quote.expiration_date === 'string' && quote.expiration_date
          ? quote.expiration_date
          : new Date(Date.now() + 24 * 3_600_000).toISOString();
      arFxSnapshot = {
        sourceCurrency: 'USD',
        sourceAmount: usdPrincipal,
        destinationCurrency: 'ARS',
        destinationAmount: dest,
        providerRate: usdPrincipal > 0 ? dest / usdPrincipal : 0,
        quoteId: quote.quote_id,
        quoteExpiresAt: exp,
        executor: 'dlocal_go',
        referenceRate: {
          value: usdPrincipal > 0 ? dest / usdPrincipal : 0,
          source: 'dlocal_quote_reference',
          fetchedAt: nowIso,
        },
      };
      finalAmount = dest;
      finalCurrency = 'ARS' as EventTicketCurrency;
    }

    const minimumUyu = PAYOUT_MINIMUM_UYU;
    const minimumUsd = PAYOUT_MINIMUM_USD;
    const minimumArs = PAYOUT_MINIMUM_ARS;
    const minimum =
      finalCurrency === 'UYU'
        ? minimumUyu
        : finalCurrency === 'ARS'
          ? minimumArs
          : minimumUsd;
    if (finalAmount < minimum) {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.BELOW_MINIMUM_THRESHOLD(
          String(finalCurrency),
          minimum,
        ),
      );
    }

    const provider = getPayoutProviderByName(
      resolvePayoutProviderName({
        payoutType: payoutMethod.payoutType,
        dlocalGoEnabled,
      }),
    );

    const payout = await this.payoutsRepository.executeTransaction(
      async trx => {
        const payoutsRepo = this.payoutsRepository.withTransaction(trx);
        const earningsRepo = this.sellerEarningsRepository.withTransaction(trx);
        const payoutEventsRepo =
          this.payoutEventsRepository.withTransaction(trx);

        const validation = await earningsRepo.validateEarningsSelection(
          sellerUserId,
          listingTicketIds,
          listingIds,
        );
        if (!validation.valid) {
          throw new ValidationError(
            validation.error || 'Invalid earnings selection',
          );
        }
        const earnings = validation.earnings;

        const totalInTxn = earnings.reduce(
          (sum, e) => sum + Number(e.sellerAmount),
          0,
        );
        let finalAmt = totalInTxn;
        let finalCcy = earnings[0].currency;
        if (
          payoutMethod.payoutType === 'argentinian_bank' &&
          payoutMethodCurrency === 'ARS' &&
          dlocalGoEnabled &&
          arFxSnapshot
        ) {
          finalAmt = arFxSnapshot.destinationAmount;
          finalCcy = arFxSnapshot.destinationCurrency as EventTicketCurrency;
        }

        if (finalAmt < minimum) {
          throw new ValidationError(
            PAYOUT_ERROR_MESSAGES.BELOW_MINIMUM_THRESHOLD(
              String(finalCcy),
              minimum,
            ),
          );
        }

        let fxSnapshot: FxSnapshot | undefined = arFxSnapshot;
        let sourceCurrency: EventTicketCurrency = finalCcy;
        let sourceAmount = finalAmt;

        if (!fxSnapshot && payoutMethod.payoutType === 'uruguayan_bank') {
          const strategySourceCurrency: EventTicketCurrency =
            finalCcy === 'USD' && earnings[0].currency === 'USD'
              ? 'UYU'
              : earnings[0].currency;

          const strategy = selectPayoutFxStrategy({
            payoutType: 'uruguayan_bank',
            providerName: provider.name,
            destinationCurrency: finalCcy,
            sourceCurrency: strategySourceCurrency,
          });

          const snap = await strategy.buildSnapshot({
            providerName: provider.name,
            payoutType: 'uruguayan_bank',
            destinationCurrency: finalCcy,
            destinationAmount: finalAmt,
            sourceCurrency: strategySourceCurrency,
            sourceAmount: 0,
          });
          if (snap) {
            fxSnapshot = snap;
            sourceCurrency = snap.sourceCurrency as EventTicketCurrency;
            sourceAmount = snap.sourceAmount;
          }
        } else if (fxSnapshot) {
          sourceCurrency = fxSnapshot.sourceCurrency as EventTicketCurrency;
          sourceAmount = fxSnapshot.sourceAmount;
        }

        const baseMeta = PayoutMetadataSchema.parse({
          listingTicketIds: listingTicketIds || [],
          listingIds: listingIds || [],
          ...(fxSnapshot ? {fxSnapshot} : {}),
        });

        const created = await payoutsRepo.create({
          sellerUserId,
          payoutMethodId,
          payoutProvider: provider.name as PayoutProvider,
          status: 'pending',
          amount: finalAmt,
          currency: finalCcy,
          requestedAt: new Date(),
          metadata: baseMeta as unknown as Json,
          sourceCurrency,
          sourceAmount,
          idempotencyKeyHash: idempotencyKeyHash ?? null,
        });

        const linkResult = await earningsRepo.linkSelectedEarningsToPayout(
          created.id,
          listingTicketIds,
          listingIds,
        );
        const linkRow = Array.isArray(linkResult) ? linkResult[0] : linkResult;
        const linked = Number(
          (linkRow as {numUpdatedRows?: bigint})?.numUpdatedRows ?? 0,
        );
        if (linked !== earnings.length) {
          throw new ValidationError(
            PAYOUT_ERROR_MESSAGES.EARNINGS_SELECTION_CHANGED,
          );
        }

        await payoutEventsRepo.create({
          payoutId: created.id,
          eventType: 'payout_requested',
          eventData: {
            sellerUserId,
            payoutMethodId,
            amount: finalAmt,
            currency: finalCcy,
            earningsCount: earnings.length,
          },
          createdBy: sellerUserId,
        });

        logger.info('Payout requested', {
          payoutId: created.id,
          sellerUserId,
          amount: finalAmt,
          currency: finalCcy,
          earningsCount: earnings.length,
        });

        return created;
      },
    );

    const initiateResult = await provider.initiatePayout({
      payoutId: payout.id,
      amount: Number(payout.amount),
      currency: payout.currency as EventTicketCurrency,
      payoutType: payoutMethod.payoutType,
      payoutMethodCurrency: payoutMethod.currency as EventTicketCurrency,
      payoutMethodMetadata: payoutMethod.metadata,
      accountHolderName: payoutMethod.accountHolderName,
      accountHolderSurname: payoutMethod.accountHolderSurname,
    });

    logger.info('Payout provider initiate completed', {
      payoutId: payout.id,
      provider: provider.name,
      externalId: initiateResult.externalId,
      instructionsSummary: initiateResult.instructions.summary,
    });

    const metaOut = PayoutMetadataSchema.safeParse(payout.metadata);
    return {
      ...payout,
      fxSnapshot: metaOut.success ? (metaOut.data.fxSnapshot ?? null) : null,
    };
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

    const payoutMethod = await this.payoutMethodsRepository.getById(
      payout.payoutMethodId,
    );
    if (!payoutMethod) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_METHOD_NOT_FOUND);
    }

    const payoutProvider = getPayoutProviderByName(
      payout.payoutProvider as PayoutProviderName,
    );
    const procResult = await payoutProvider.processPayout({
      payoutId,
      amount: Number(payout.amount),
      currency: payout.currency as EventTicketCurrency,
      payoutType: payoutMethod.payoutType,
      payoutMethodCurrency: payoutMethod.currency as EventTicketCurrency,
      payoutMetadata: payout.metadata,
      payoutMethodMetadata: payoutMethod.metadata,
      accountHolderName: payoutMethod.accountHolderName,
      accountHolderSurname: payoutMethod.accountHolderSurname,
    });

    const currentMetadata = PayoutMetadataSchema.parse(payout.metadata || {});
    const quoteMeta = currentMetadata.fxSnapshot;
    const rateWasExpired =
      quoteMeta?.quoteExpiresAt != null
        ? Date.now() > new Date(quoteMeta.quoteExpiresAt).getTime()
        : false;

    const hints = procResult.providerExecutionHints;
    const shouldPersistFxExecution =
      updates.actualBankRate !== undefined ||
      updates.actualUyuCost !== undefined ||
      hints != null ||
      Boolean(procResult.externalId);

    let updatedMetadata: Json | undefined;
    if (shouldPersistFxExecution) {
      const fxExecution = {
        ...currentMetadata.fxExecution,
        ...(updates.actualBankRate !== undefined && {
          actualRate: updates.actualBankRate,
        }),
        ...(hints?.actualRate !== undefined &&
          updates.actualBankRate === undefined && {
            actualRate: hints.actualRate,
          }),
        ...(updates.actualUyuCost !== undefined && {
          actualSourceAmount: updates.actualUyuCost,
        }),
        ...(hints?.providerFees !== undefined && {
          providerFees: hints.providerFees,
        }),
        processedAt: new Date().toISOString(),
        ...(rateWasExpired ? {rateWasExpired: true} : {}),
        ...(procResult.externalId && {externalId: procResult.externalId}),
      };
      updatedMetadata = PayoutMetadataSchema.parse({
        ...currentMetadata,
        fxExecution,
      }) as unknown as Json;
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
    const persistedMeta = updatedMetadata
      ? PayoutMetadataSchema.parse(updatedMetadata)
      : currentMetadata;

    await this.payoutEventsRepository.create({
      payoutId,
      eventType: 'transfer_completed',
      fromStatus: 'pending',
      toStatus: 'completed',
      eventData: {
        adminUserId,
        processingFee: updates.processingFee,
        transactionReference: updates.transactionReference,
        fxExecution: persistedMeta.fxExecution ?? null,
        rateWasExpired,
      },
      createdBy: adminUserId,
    });

    logger.info('Payout completed by admin', {
      payoutId,
      adminUserId,
      processingFee: updates.processingFee,
      fxExecution: persistedMeta.fxExecution,
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
    const settlementInfo =
      await this.payoutsRepository.getPayoutSettlementInfo(payoutId);

    let currentBrouVentaRate: number | null = null;
    try {
      currentBrouVentaRate = await fetchBrouEbrouVentaRate();
    } catch (err) {
      logger.warn(
        'BROU eBROU venta rate unavailable; admin payout details show null rate',
        {
          payoutId,
          err,
        },
      );
    }

    const nowMs = Date.now();
    const fxSnap = metadata?.fxSnapshot ?? null;
    const fxExec = metadata?.fxExecution ?? null;
    const quoteExpiresAtMs = fxSnap?.quoteExpiresAt
      ? new Date(fxSnap.quoteExpiresAt).getTime()
      : null;
    const quoteExpired = quoteExpiresAtMs != null && nowMs > quoteExpiresAtMs;
    const quoteMsRemaining =
      quoteExpiresAtMs != null && !quoteExpired
        ? Math.max(0, quoteExpiresAtMs - nowMs)
        : null;

    const uyuCostAtSnapshotRate =
      fxSnap != null &&
      fxSnap.destinationCurrency === 'USD' &&
      fxSnap.sourceCurrency === 'UYU' &&
      fxSnap.providerRate != null
        ? roundToDecimals(fxSnap.destinationAmount * fxSnap.providerRate, 2)
        : fxSnap?.sourceCurrency === 'UYU' && fxSnap.sourceAmount != null
          ? roundToDecimals(fxSnap.sourceAmount, 2)
          : null;

    const fxDecisionSupport = {
      currentBrouVentaRate,
      spreadPercentConfigured: PAYOUT_FX_SPREAD_PERCENT,
      fxSnapshot: fxSnap,
      fxExecution: fxExec,
      quoteExpired,
      quoteMsRemaining,
      uyuCostAtSnapshotRate,
      dLocalAverageExchangeRate:
        settlementInfo?.settlements?.find(s => s.averageExchangeRate != null)
          ?.averageExchangeRate ?? null,
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
      fxSnapshot: metadata?.fxSnapshot ?? null,
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
