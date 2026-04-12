import {createPaginatedResponse} from '~/middleware/pagination';
import {ProcessorSettlementsRepository} from '~/repositories/processor-settlements';
import {PayoutsRepository} from '~/repositories/payouts';
import {PaymentsRepository} from '~/repositories/payments';
import {SellerEarningsRepository} from '~/repositories/seller-earnings';
import {NotFoundError, ValidationError} from '~/errors';
import {
  PAYOUT_ERROR_MESSAGES,
  SETTLEMENT_ERROR_MESSAGES,
} from '~/constants/error-messages';
import type {PaginationOptions} from '~/types/pagination';
import {
  ProcessorSettlementMetadataSchema,
  type Json,
  type PaymentProvider,
  type ProcessorSettlementReconciliationSnapshot,
} from '@revendiste/shared';

/** Serialized settlement row for admin APIs / OpenAPI (avoids TSOA issues with `Json` index types). */
export type ProcessorSettlementListRow = {
  id: string;
  settlementId: string;
  status: string;
  totalAmount: string;
  currency: string;
  paymentProvider: PaymentProvider;
  settlementDate: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ProcessorSettlementItemApiRow = {
  id: string;
  settlementId: string;
  paymentId: string | null;
  operationId: string;
  payoutId: string | null;
  amount: string;
  netAmount: string;
  exchangeRate: string | null;
  fees: string | null;
  currency: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

function toIso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : String(d);
}

/** Runtime shape from Kysely (differs from `Selectable<>` branded column types). */
type ProcessorSettlementRowResult = {
  id: string;
  settlementId: string;
  status: string;
  totalAmount: string;
  currency: string;
  paymentProvider: PaymentProvider;
  settlementDate: Date;
  metadata: Json | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProcessorSettlementItemResult = {
  id: string;
  settlementId: string;
  paymentId: string | null;
  operationId: string;
  payoutId: string | null;
  amount: string;
  netAmount: string;
  exchangeRate: string | null;
  fees: string | null;
  currency: string;
  description: string | null;
  metadata: Json | null;
  createdAt: Date;
  updatedAt: Date;
};

function toSettlementListRow(
  row: ProcessorSettlementRowResult,
): ProcessorSettlementListRow {
  return {
    id: row.id,
    settlementId: row.settlementId,
    status: row.status,
    totalAmount: row.totalAmount,
    currency: row.currency,
    paymentProvider: row.paymentProvider,
    settlementDate: toIso(row.settlementDate),
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function toSettlementItemRow(
  item: ProcessorSettlementItemResult,
): ProcessorSettlementItemApiRow {
  return {
    id: item.id,
    settlementId: item.settlementId,
    paymentId: item.paymentId,
    operationId: item.operationId,
    payoutId: item.payoutId,
    amount: item.amount,
    netAmount: item.netAmount,
    exchangeRate: item.exchangeRate,
    fees: item.fees,
    currency: item.currency,
    description: item.description,
    metadata: item.metadata as Record<string, unknown> | null,
    createdAt: toIso(item.createdAt),
    updatedAt: toIso(item.updatedAt),
  };
}

/** Hard block when declared total vs sum of processor credits differs by more than this ratio. */
const SETTLEMENT_AMOUNT_TOLERANCE_ERROR = 0.1;
/** Soft warning threshold (stored in metadata; UI can toast). */
const SETTLEMENT_AMOUNT_TOLERANCE_WARNING = 0.01;

function endOfSettlementDayUtc(settlementDate: Date): Date {
  const d = new Date(settlementDate);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * FIFO: accumulate paid payments (by approvedAt) until sum of balanceAmount >= target.
 */
function selectPaymentsForSettlementAmount<
  T extends {balanceAmount: string | null},
>(payments: T[], targetAmount: number): {selected: T[]; sum: number} {
  const selected: T[] = [];
  let sum = 0;
  for (const p of payments) {
    const bal = Number(p.balanceAmount);
    if (!Number.isFinite(bal)) {
      continue;
    }
    selected.push(p);
    sum += bal;
    if (sum >= targetAmount) {
      break;
    }
  }
  return {selected, sum};
}

export class ProcessorSettlementsService {
  constructor(
    private settlementsRepository: ProcessorSettlementsRepository,
    private payoutsRepository: PayoutsRepository,
    private paymentsRepository: PaymentsRepository,
    private sellerEarningsRepository: SellerEarningsRepository,
  ) {}

  /**
   * Preview which payments would be reconciled and totals (no DB writes).
   */
  async previewSettlement(data: {
    paymentProvider?: PaymentProvider;
    externalSettlementId: string;
    settlementDate: Date;
    totalAmount: string;
    currency: string;
  }) {
    const paymentProvider = data.paymentProvider ?? 'dlocal';
    const targetAmount = Number(data.totalAmount);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return {
        externalSettlementId: data.externalSettlementId,
        paymentProvider,
        currency: data.currency,
        declaredTotal: data.totalAmount,
        computedTotal: '0',
        paymentCount: 0,
        differencePercent: 100,
        differenceRatio: 1,
        hasBlockingError: true,
        hasWarning: false,
        duplicateExists: false,
        messageKey: 'INVALID_AMOUNT' as const,
        paymentIds: [] as string[],
      };
    }

    const duplicate =
      await this.settlementsRepository.getByProviderAndExternalSettlementId(
        paymentProvider,
        data.externalSettlementId,
      );
    if (duplicate) {
      return {
        externalSettlementId: data.externalSettlementId,
        paymentProvider,
        currency: data.currency,
        declaredTotal: data.totalAmount,
        computedTotal: '0',
        paymentCount: 0,
        differencePercent: 100,
        differenceRatio: 1,
        hasBlockingError: true,
        hasWarning: false,
        duplicateExists: true,
        messageKey: 'DUPLICATE' as const,
        paymentIds: [] as string[],
      };
    }

    const unreconciled =
      await this.paymentsRepository.listUnreconciledPaymentsForSettlement({
        paymentProvider,
        settlementCurrency: data.currency,
        settlementDateEndInclusive: endOfSettlementDayUtc(data.settlementDate),
      });

    const {selected, sum} = selectPaymentsForSettlementAmount(
      unreconciled,
      targetAmount,
    );

    if (selected.length === 0) {
      return {
        externalSettlementId: data.externalSettlementId,
        paymentProvider,
        currency: data.currency,
        declaredTotal: data.totalAmount,
        computedTotal: '0',
        paymentCount: 0,
        differencePercent: 100,
        differenceRatio: 1,
        hasBlockingError: true,
        hasWarning: true,
        duplicateExists: false,
        messageKey: 'NO_PAYMENTS' as const,
        paymentIds: [] as string[],
      };
    }

    const differenceRatio =
      targetAmount > 0 ? Math.abs(sum - targetAmount) / targetAmount : 0;

    const hasBlockingError =
      sum < targetAmount * (1 - SETTLEMENT_AMOUNT_TOLERANCE_ERROR) ||
      differenceRatio > SETTLEMENT_AMOUNT_TOLERANCE_ERROR;

    const hasWarning =
      !hasBlockingError &&
      differenceRatio > SETTLEMENT_AMOUNT_TOLERANCE_WARNING;

    return {
      externalSettlementId: data.externalSettlementId,
      paymentProvider,
      currency: data.currency,
      declaredTotal: data.totalAmount,
      computedTotal: String(sum),
      paymentCount: selected.length,
      differencePercent: Math.round(differenceRatio * 10000) / 100,
      differenceRatio,
      hasBlockingError,
      hasWarning,
      duplicateExists: false,
      messageKey: hasBlockingError
        ? ('MISMATCH' as const)
        : hasWarning
          ? ('WARNING' as const)
          : ('OK' as const),
      paymentIds: selected.map(p => p.id),
    };
  }

  async createSettlement(data: {
    paymentProvider?: PaymentProvider;
    externalSettlementId: string;
    settlementDate: Date;
    totalAmount: string;
    currency: string;
    metadata?: Record<string, unknown>;
  }) {
    const paymentProvider = data.paymentProvider ?? 'dlocal';
    const targetAmount = Number(data.totalAmount);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      throw new ValidationError(SETTLEMENT_ERROR_MESSAGES.INVALID_TOTAL_AMOUNT);
    }

    const existing =
      await this.settlementsRepository.getByProviderAndExternalSettlementId(
        paymentProvider,
        data.externalSettlementId,
      );
    if (existing) {
      throw new ValidationError(
        SETTLEMENT_ERROR_MESSAGES.SETTLEMENT_ALREADY_EXISTS,
      );
    }

    return await this.settlementsRepository.executeTransaction(async trx => {
      const settlementsRepo = this.settlementsRepository.withTransaction(trx);
      const paymentsRepo = this.paymentsRepository.withTransaction(trx);

      const unreconciled =
        await paymentsRepo.listUnreconciledPaymentsForSettlement({
          paymentProvider,
          settlementCurrency: data.currency,
          settlementDateEndInclusive: endOfSettlementDayUtc(
            data.settlementDate,
          ),
        });

      const {selected, sum} = selectPaymentsForSettlementAmount(
        unreconciled,
        targetAmount,
      );

      if (selected.length === 0) {
        throw new ValidationError(
          SETTLEMENT_ERROR_MESSAGES.NO_UNRECONCILED_PAYMENTS,
        );
      }

      if (sum < targetAmount * (1 - SETTLEMENT_AMOUNT_TOLERANCE_ERROR)) {
        throw new ValidationError(
          SETTLEMENT_ERROR_MESSAGES.INSUFFICIENT_PAYMENTS_FOR_AMOUNT,
        );
      }

      const differenceRatio =
        targetAmount > 0 ? Math.abs(sum - targetAmount) / targetAmount : 0;

      if (differenceRatio > SETTLEMENT_AMOUNT_TOLERANCE_ERROR) {
        throw new ValidationError(
          SETTLEMENT_ERROR_MESSAGES.AMOUNT_MISMATCH_TOO_HIGH(
            String(Math.round(differenceRatio * 10000) / 100),
          ),
        );
      }

      const hasWarning = differenceRatio > SETTLEMENT_AMOUNT_TOLERANCE_WARNING;

      const reconciliationMeta: ProcessorSettlementReconciliationSnapshot = {
        computedTotal: String(sum),
        declaredTotal: data.totalAmount,
        differencePercent: Math.round(differenceRatio * 10000) / 100,
        hadWarning: hasWarning,
        paymentCount: selected.length,
      };

      const mergedForMetadata = {
        ...((data.metadata ?? {}) as Record<string, unknown>),
        reconciliation: reconciliationMeta,
      };
      const parsedMetadata =
        ProcessorSettlementMetadataSchema.safeParse(mergedForMetadata);
      if (!parsedMetadata.success) {
        throw new ValidationError(SETTLEMENT_ERROR_MESSAGES.INVALID_METADATA);
      }

      const settlement = await settlementsRepo.createSettlement({
        id: crypto.randomUUID(),
        settlementId: data.externalSettlementId,
        settlementDate: data.settlementDate,
        totalAmount: data.totalAmount,
        currency: data.currency,
        status: 'pending',
        metadata: parsedMetadata.data as Json,
        paymentProvider,
      });

      const items = [];
      for (const p of selected) {
        const item = await settlementsRepo.createSettlementItem({
          id: crypto.randomUUID(),
          settlementId: settlement.id,
          paymentId: String(p.id),
          operationId: p.providerPaymentId,
          payoutId: null,
          amount: String(p.amount),
          netAmount: String(p.balanceAmount ?? '0'),
          exchangeRate: p.exchangeRate ? Number(p.exchangeRate) : null,
          fees: p.balanceFee != null ? String(p.balanceFee) : null,
          currency: p.balanceCurrency ?? p.currency,
          description: null,
          metadata: null,
        });
        items.push(item);
      }

      return {
        settlement: toSettlementListRow(settlement),
        items: items.map(toSettlementItemRow),
        reconciliation: {
          computedTotal: String(sum),
          declaredTotal: data.totalAmount,
          differencePercent: reconciliationMeta.differencePercent,
          hasWarning,
          paymentCount: selected.length,
        },
      };
    });
  }

  private async requireSettlementRow(settlementId: string) {
    const settlement =
      await this.settlementsRepository.getSettlementById(settlementId);

    if (!settlement) {
      throw new NotFoundError(SETTLEMENT_ERROR_MESSAGES.SETTLEMENT_NOT_FOUND);
    }

    return settlement;
  }

  async getSettlementById(settlementId: string) {
    return toSettlementListRow(await this.requireSettlementRow(settlementId));
  }

  async getSettlementBreakdown(settlementId: string) {
    const settlement = await this.requireSettlementRow(settlementId);

    const items =
      await this.settlementsRepository.getSettlementItemsBySettlementId(
        settlementId,
      );

    const paymentIds = items
      .map(i => i.paymentId)
      .filter((id): id is string => id != null);

    const payments =
      paymentIds.length > 0
        ? await this.paymentsRepository.getByIds(paymentIds)
        : [];

    const paymentById = new Map(payments.map(p => [p.id, p]));

    const orderIds = [
      ...new Set(
        payments.map(p => p.orderId).filter((id): id is string => Boolean(id)),
      ),
    ];

    const earningsRows =
      await this.sellerEarningsRepository.getSellerEarningsForOrderIds(
        orderIds,
      );

    const earningsByOrderId = new Map<string, typeof earningsRows>();
    for (const row of earningsRows) {
      const list = earningsByOrderId.get(row.orderId) ?? [];
      list.push(row);
      earningsByOrderId.set(row.orderId, list);
    }

    let totalCustomerCharges = 0;
    let totalProcessorCredits = 0;
    let totalProcessorFees = 0;
    let totalSellerEarningsConverted = 0;
    let hasMultipleCurrencies = false;

    const settlementCurrency = settlement.currency;

    const breakdownItems = items.map(item => {
      const payment = item.paymentId
        ? paymentById.get(item.paymentId)
        : undefined;

      const orderEarnings = payment
        ? (earningsByOrderId.get(payment.orderId) ?? [])
        : [];

      // The settlement currency is always the balance currency (e.g. UYU for dLocal).
      // Seller earnings are stored in ticket currency (e.g. USD for USD-priced tickets).
      // When they differ, convert seller amounts to settlement currency using the exchange rate.
      const exchangeRate =
        payment?.exchangeRate != null
          ? Number(payment.exchangeRate)
          : item.exchangeRate != null
            ? Number(item.exchangeRate)
            : null;

      const itemCurrency =
        payment?.balanceCurrency ?? payment?.currency ?? item.currency;

      // Determine the charge currency (what the customer paid in)
      const customerAmountCurrency = payment?.currency ?? item.currency;
      const currenciesDiffer =
        customerAmountCurrency !== itemCurrency ||
        orderEarnings.some(e => e.currency !== itemCurrency);

      if (currenciesDiffer) {
        hasMultipleCurrencies = true;
      }

      // Convert each seller earning to the settlement currency when needed
      const sellerEarningsWithConversion = orderEarnings.map(e => {
        const needsConversion = e.currency !== itemCurrency;
        const convertedAmount =
          needsConversion && exchangeRate != null
            ? Number(e.sellerAmount) * exchangeRate
            : Number(e.sellerAmount);
        return {
          id: e.id,
          sellerAmount: String(e.sellerAmount),
          sellerAmountConverted: needsConversion
            ? String(convertedAmount)
            : null,
          sellerUserId: e.sellerUserId,
          status: e.status,
          currency: e.currency,
        };
      });

      const sellerSumConverted = sellerEarningsWithConversion.reduce(
        (acc, e) =>
          acc + Number(e.sellerAmountConverted ?? e.sellerAmount),
        0,
      );

      const processorCredit = payment
        ? Number(payment.balanceAmount ?? 0)
        : Number(item.netAmount);
      const customerAmount = payment
        ? Number(payment.amount)
        : Number(item.amount);
      const processorFee = payment
        ? Number(payment.balanceFee ?? 0)
        : Number(item.fees ?? 0);

      if (payment) {
        totalCustomerCharges += customerAmount;
        totalProcessorCredits += processorCredit;
        totalProcessorFees += processorFee;
        totalSellerEarningsConverted += sellerSumConverted;
      }

      // platformShare is in settlement currency (UYU), using converted seller amounts
      const platformShare = processorCredit - sellerSumConverted;

      return {
        settlementItemId: item.id,
        paymentId: item.paymentId,
        providerPaymentId: payment?.providerPaymentId ?? item.operationId,
        customerAmount: String(customerAmount),
        customerAmountCurrency,
        processorCredit: String(processorCredit),
        processorFee: String(processorFee),
        exchangeRate: exchangeRate != null ? String(exchangeRate) : null,
        currency: itemCurrency,
        sellerEarnings: sellerEarningsWithConversion,
        platformShare: String(platformShare),
      };
    });

    const declaredTotal = Number(settlement.totalAmount);
    const unreconciledDifference = declaredTotal - totalProcessorCredits;

    // Platform revenue in settlement currency (UYU), using converted seller earnings
    const platformRevenue =
      totalProcessorCredits - totalSellerEarningsConverted;

    return {
      settlement: toSettlementListRow(settlement),
      reconciliation: {
        paymentCount: items.length,
        totalCustomerCharges: String(totalCustomerCharges),
        totalCustomerChargesCurrency: settlementCurrency,
        totalProcessorCredits: String(totalProcessorCredits),
        totalProcessorFees: String(totalProcessorFees),
        totalSellerEarningsConverted: String(totalSellerEarningsConverted),
        platformRevenue: String(platformRevenue),
        unreconciledDifference: String(unreconciledDifference),
        hasMultipleCurrencies,
      },
      items: breakdownItems,
    };
  }

  async listSettlementsWithPagination(
    pagination: PaginationOptions,
    filters: {
      status?: string;
      paymentProvider?: PaymentProvider;
    },
  ) {
    const total = await this.settlementsRepository.countSettlements({
      status: filters.status,
      paymentProvider: filters.paymentProvider,
    });

    const rows = await this.settlementsRepository.listSettlements({
      offset: pagination.offset,
      limit: pagination.limit,
      status: filters.status,
      paymentProvider: filters.paymentProvider,
    });

    return createPaginatedResponse(
      rows.map(toSettlementListRow),
      total,
      pagination,
    );
  }

  async addPaymentToSettlement(
    settlementId: string,
    paymentData: {
      operationId: string;
      amount: string;
      netAmount: string;
      exchangeRate?: number;
      fees?: string;
      currency: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.requireSettlementRow(settlementId);

    const row = await this.settlementsRepository.createSettlementItem({
      id: crypto.randomUUID(),
      settlementId,
      paymentId: null,
      operationId: paymentData.operationId,
      payoutId: null,
      amount: paymentData.amount,
      netAmount: paymentData.netAmount,
      exchangeRate: paymentData.exchangeRate ?? null,
      fees: paymentData.fees ?? null,
      currency: paymentData.currency,
      description: paymentData.description ?? null,
      metadata: (paymentData.metadata ?? null) as Json | null,
    });
    return toSettlementItemRow(row);
  }

  async linkSettlementPaymentToPayout(
    settlementPaymentId: string,
    payoutId: string,
  ) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    const row = await this.settlementsRepository.linkSettlementItemToPayout(
      settlementPaymentId,
      payoutId,
    );
    if (!row) {
      throw new NotFoundError(
        SETTLEMENT_ERROR_MESSAGES.SETTLEMENT_ITEM_NOT_FOUND,
      );
    }
    return toSettlementItemRow(row);
  }

  async completeSettlement(settlementId: string) {
    const updated = await this.settlementsRepository.updateSettlement(
      settlementId,
      {
        status: 'completed',
      },
    );
    if (!updated) {
      throw new NotFoundError(SETTLEMENT_ERROR_MESSAGES.SETTLEMENT_NOT_FOUND);
    }
    return toSettlementListRow(updated);
  }

  async failSettlement(settlementId: string, reason?: string) {
    const existing = await this.requireSettlementRow(settlementId);
    const prevMeta =
      existing.metadata &&
      typeof existing.metadata === 'object' &&
      !Array.isArray(existing.metadata)
        ? {...(existing.metadata as Record<string, unknown>)}
        : {};

    const mergedForFail = reason
      ? {...prevMeta, failureReason: reason}
      : null;
    const parsedFailMetadata =
      mergedForFail != null
        ? ProcessorSettlementMetadataSchema.safeParse(mergedForFail)
        : null;

    const updated = await this.settlementsRepository.updateSettlement(
      settlementId,
      {
        status: 'failed',
        ...(reason
          ? {
              metadata: (
                parsedFailMetadata?.success
                  ? parsedFailMetadata.data
                  : mergedForFail
              ) as Json,
            }
          : {}),
      },
    );
    if (!updated) {
      throw new NotFoundError(SETTLEMENT_ERROR_MESSAGES.SETTLEMENT_NOT_FOUND);
    }
    return toSettlementListRow(updated);
  }
}
