import {ProcessorSettlementsRepository} from '~/repositories/processor-settlements';
import {PayoutsRepository} from '~/repositories/payouts';
import {NotFoundError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import type {Json, PaymentProvider} from '@revendiste/shared';

export class ProcessorSettlementsService {
  constructor(
    private settlementsRepository: ProcessorSettlementsRepository,
    private payoutsRepository: PayoutsRepository,
  ) {}

  async createSettlement(data: {
    paymentProvider?: PaymentProvider;
    externalSettlementId: string;
    settlementDate: Date;
    totalAmount: string;
    currency: string;
    metadata?: Record<string, unknown>;
  }) {
    const paymentProvider = data.paymentProvider ?? 'dlocal';

    const settlement = await this.settlementsRepository.createSettlement({
      settlementId: data.externalSettlementId,
      settlementDate: data.settlementDate,
      totalAmount: data.totalAmount,
      currency: data.currency,
      status: 'pending',
      metadata: (data.metadata ?? null) as Json | null,
      paymentProvider,
    });

    return settlement;
  }

  async getSettlementById(settlementId: string) {
    const settlement = await this.settlementsRepository.getSettlementById(
      settlementId,
    );

    if (!settlement) {
      throw new NotFoundError('Liquidación no encontrada');
    }

    return settlement;
  }

  async listSettlementsWithPagination(params: {
    page: number;
    limit: number;
    status?: string;
    paymentProvider?: PaymentProvider;
  }) {
    const offset = (params.page - 1) * params.limit;

    return await this.settlementsRepository.listSettlements({
      offset,
      limit: params.limit,
      status: params.status,
      paymentProvider: params.paymentProvider,
    });
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
    await this.getSettlementById(settlementId);

    return await this.settlementsRepository.createSettlementItem({
      settlementId,
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
  }

  async linkSettlementPaymentToPayout(
    settlementPaymentId: string,
    payoutId: string,
  ) {
    const payout = await this.payoutsRepository.getById(payoutId);
    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    return await this.settlementsRepository.linkSettlementItemToPayout(
      settlementPaymentId,
      payoutId,
    );
  }

  async completeSettlement(settlementId: string) {
    return await this.settlementsRepository.updateSettlement(settlementId, {
      status: 'completed',
    });
  }

  async failSettlement(settlementId: string, reason?: string) {
    return await this.settlementsRepository.updateSettlement(settlementId, {
      status: 'failed',
      metadata: reason
        ? ({failureReason: reason} as Json)
        : undefined,
    });
  }
}
