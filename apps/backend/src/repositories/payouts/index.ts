import {Kysely, sql} from 'kysely';
import {jsonArrayFrom, jsonObjectFrom} from 'kysely/helpers/postgres';
import {DB, EventTicketCurrency, Json} from '@revendiste/shared';
import {BaseRepository} from '../base';
import {mapToPaginatedResponse} from '~/middleware/pagination';
import type {PaginationOptions} from '~/types/pagination';

export class PayoutsRepository extends BaseRepository<PayoutsRepository> {
  withTransaction(trx: Kysely<DB>): PayoutsRepository {
    return new PayoutsRepository(trx);
  }

  async create(payoutData: {
    sellerUserId: string;
    payoutMethodId: string;
    status: 'pending';
    amount: number;
    currency: EventTicketCurrency;
    requestedAt: Date;
    metadata?: Json;
  }) {
    return await this.db
      .insertInto('payouts')
      .values(payoutData)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getById(id: string) {
    return await this.db
      .selectFrom('payouts')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async getBySellerId(sellerUserId: string) {
    return await this.db
      .selectFrom('payouts')
      .selectAll()
      .where('sellerUserId', '=', sellerUserId)
      .where('deletedAt', 'is', null)
      .orderBy('requestedAt', 'desc')
      .execute();
  }

  async getBySellerIdPaginated(
    sellerUserId: string,
    pagination: PaginationOptions,
  ) {
    const {page, limit, offset, sortBy, sortOrder} = pagination;

    // Get total count
    const totalResult = await this.db
      .selectFrom('payouts')
      .select(this.db.fn.count('id').as('total'))
      .where('sellerUserId', '=', sellerUserId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    const total = Number(totalResult?.total || 0);
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get paginated payouts with linked earnings
    let query = this.db
      .selectFrom('payouts')
      .select(eb => [
        'payouts.id',
        'payouts.sellerUserId',
        'payouts.payoutMethodId',
        'payouts.status',
        'payouts.amount',
        'payouts.currency',
        'payouts.processingFee',
        'payouts.requestedAt',
        'payouts.processedAt',
        'payouts.processedBy',
        'payouts.completedAt',
        'payouts.failedAt',
        'payouts.failureReason',
        'payouts.transactionReference',
        'payouts.notes',
        'payouts.metadata',
        'payouts.createdAt',
        'payouts.updatedAt',
        jsonArrayFrom(
          eb
            .selectFrom('sellerEarnings')
            .select([
              'sellerEarnings.id',
              'sellerEarnings.listingTicketId',
              'sellerEarnings.sellerAmount',
              'sellerEarnings.currency',
              'sellerEarnings.createdAt',
            ])
            .whereRef('sellerEarnings.payoutId', '=', 'payouts.id')
            .where('sellerEarnings.deletedAt', 'is', null),
        ).as('linkedEarnings'),
      ])
      .where('payouts.sellerUserId', '=', sellerUserId)
      .where('payouts.deletedAt', 'is', null);

    // Apply sorting based on sortBy parameter
    switch (sortBy) {
      case 'requestedAt':
        query = query.orderBy('payouts.requestedAt', sortOrder);
        break;
      case 'createdAt':
        query = query.orderBy('payouts.createdAt', sortOrder);
        break;
      case 'amount':
        query = query.orderBy('payouts.amount', sortOrder);
        break;
      case 'status':
        query = query.orderBy('payouts.status', sortOrder);
        break;
      default:
        query = query.orderBy('payouts.requestedAt', 'desc');
    }

    const payouts = await query.limit(limit).offset(offset).execute();

    return mapToPaginatedResponse(payouts, {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    });
  }

  async getWithLinkedEarnings(id: string) {
    return await this.db
      .selectFrom('payouts')
      .select(eb => [
        'payouts.id',
        'payouts.sellerUserId',
        'payouts.payoutMethodId',
        'payouts.status',
        'payouts.amount',
        'payouts.currency',
        'payouts.processingFee',
        'payouts.requestedAt',
        'payouts.processedAt',
        'payouts.processedBy',
        'payouts.completedAt',
        'payouts.failedAt',
        'payouts.failureReason',
        'payouts.transactionReference',
        'payouts.notes',
        'payouts.metadata',
        'payouts.createdAt',
        'payouts.updatedAt',
        jsonArrayFrom(
          eb
            .selectFrom('sellerEarnings')
            .select([
              'sellerEarnings.id',
              'sellerEarnings.listingTicketId',
              'sellerEarnings.sellerAmount',
              'sellerEarnings.currency',
              'sellerEarnings.createdAt',
            ])
            .whereRef('sellerEarnings.payoutId', '=', 'payouts.id')
            .where('sellerEarnings.deletedAt', 'is', null),
        ).as('linkedEarnings'),
      ])
      .where('payouts.id', '=', id)
      .where('payouts.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    updates?: {
      processedAt?: Date;
      processedBy?: string;
      completedAt?: Date;
      failedAt?: Date;
      failureReason?: string;
      transactionReference?: string;
      notes?: string;
      metadata?: Json;
    },
  ) {
    return await this.db
      .updateTable('payouts')
      .set({
        status,
        ...updates,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async updateProcessingFee(id: string, processingFee: number) {
    return await this.db
      .updateTable('payouts')
      .set({
        processingFee: String(processingFee),
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async getPendingForAdmin() {
    return await this.db
      .selectFrom('payouts')
      .selectAll()
      .where('status', '=', 'pending')
      .where('deletedAt', 'is', null)
      .orderBy('requestedAt', 'asc')
      .execute();
  }

  /**
   * Gets settlement information for a payout by tracing back to the payments
   * that funded the seller earnings linked to this payout.
   *
   * Path: payout → sellerEarnings → listingTickets → orderTicketReservations → orders → payments
   *
   * Returns aggregated settlement data showing what we actually received from dLocal
   * for the tickets included in this payout.
   */
  async getPayoutSettlementInfo(payoutId: string) {
    // Get all payments related to this payout through the earnings chain
    const settlementData = await this.db
      .selectFrom('sellerEarnings')
      .innerJoin(
        'orderTicketReservations',
        'sellerEarnings.listingTicketId',
        'orderTicketReservations.listingTicketId',
      )
      .innerJoin('orders', 'orderTicketReservations.orderId', 'orders.id')
      .innerJoin('payments', 'orders.id', 'payments.orderId')
      .select([
        'payments.id as paymentId',
        'payments.amount as paymentAmount',
        'payments.currency as paymentCurrency',
        'payments.balanceAmount',
        'payments.balanceCurrency',
        'payments.balanceFee',
        'payments.exchangeRate',
        'payments.provider',
        'sellerEarnings.sellerAmount',
        'sellerEarnings.currency as earningsCurrency',
      ])
      .where('sellerEarnings.payoutId', '=', payoutId)
      .where('sellerEarnings.deletedAt', 'is', null)
      .where('payments.status', '=', 'paid')
      .execute();

    if (settlementData.length === 0) {
      return null;
    }

    // First, deduplicate payments - multiple seller_earnings may reference the same payment
    // (e.g., when a buyer purchases 2 tickets in one order)
    // Payment-level data (balanceAmount, balanceFee, exchangeRate) should only be counted once per payment
    const uniquePayments = new Map<
      string,
      {
        paymentAmount: number;
        balanceAmount: number;
        balanceFee: number;
        exchangeRate: number | null;
        provider: string | null;
        paymentCurrency: string;
      }
    >();

    for (const row of settlementData) {
      if (!uniquePayments.has(row.paymentId)) {
        uniquePayments.set(row.paymentId, {
          paymentAmount: Number(row.paymentAmount || 0),
          balanceAmount: Number(row.balanceAmount || 0),
          balanceFee: Number(row.balanceFee || 0),
          exchangeRate: row.exchangeRate ? Number(row.exchangeRate) : null,
          provider: row.provider,
          paymentCurrency: row.paymentCurrency,
        });
      }
    }

    // Aggregate the settlement data
    // Group by earnings currency to handle multi-currency scenarios
    // sellerAmount is summed per earnings row, payment data is summed per unique payment
    const settlementByCurrency = new Map<
      string,
      {
        totalPaymentAmount: number;
        totalBalanceAmount: number;
        totalBalanceFee: number;
        totalSellerAmount: number;
        exchangeRates: number[];
        paymentCount: number;
        providers: Set<string>;
        processedPaymentIds: Set<string>;
      }
    >();

    for (const row of settlementData) {
      const currency = row.earningsCurrency;
      const existing = settlementByCurrency.get(currency) || {
        totalPaymentAmount: 0,
        totalBalanceAmount: 0,
        totalBalanceFee: 0,
        totalSellerAmount: 0,
        exchangeRates: [],
        paymentCount: 0,
        providers: new Set<string>(),
        processedPaymentIds: new Set<string>(),
      };

      // Always sum seller amounts (each earnings row is unique)
      existing.totalSellerAmount += Number(row.sellerAmount || 0);

      // Only sum payment-level data once per unique payment
      if (!existing.processedPaymentIds.has(row.paymentId)) {
        const payment = uniquePayments.get(row.paymentId)!;
        existing.totalPaymentAmount += payment.paymentAmount;
        existing.totalBalanceAmount += payment.balanceAmount;
        existing.totalBalanceFee += payment.balanceFee;
        if (payment.exchangeRate !== null) {
          existing.exchangeRates.push(payment.exchangeRate);
        }
        if (payment.provider) {
          existing.providers.add(payment.provider);
        }
        existing.paymentCount += 1;
        existing.processedPaymentIds.add(row.paymentId);
      }

      settlementByCurrency.set(currency, existing);
    }

    // Convert to array and calculate average exchange rates
    const settlements = Array.from(settlementByCurrency.entries()).map(
      ([currency, data]) => ({
        currency,
        totalPaymentAmount: data.totalPaymentAmount,
        totalBalanceAmount: data.totalBalanceAmount,
        totalBalanceFee: data.totalBalanceFee,
        totalSellerAmount: data.totalSellerAmount,
        averageExchangeRate:
          data.exchangeRates.length > 0
            ? data.exchangeRates.reduce((a, b) => a + b, 0) /
              data.exchangeRates.length
            : null,
        balanceCurrency: settlementData[0]?.balanceCurrency || null,
        paymentCount: data.paymentCount,
        providers: Array.from(data.providers),
      }),
    );

    // Get unique providers across all settlements
    const allProviders = new Set<string>();
    for (const settlement of settlements) {
      for (const provider of settlement.providers) {
        allProviders.add(provider);
      }
    }

    return {
      settlements,
      hasExchangeRateData: settlements.some(
        s => s.averageExchangeRate !== null,
      ),
      providers: Array.from(allProviders),
    };
  }

  async getPayoutsForAdminPaginated(
    pagination: PaginationOptions,
    options?: {status?: string},
  ) {
    const {page, limit, offset, sortBy, sortOrder} = pagination;

    // Build base query for total count
    let countQuery = this.db
      .selectFrom('payouts')
      .select(this.db.fn.count('id').as('total'))
      .where('deletedAt', 'is', null);

    // Apply status filter if provided
    if (options?.status) {
      countQuery = countQuery.where(
        'payouts.status',
        '=',
        options.status as
          | 'pending'
          | 'processing'
          | 'completed'
          | 'failed'
          | 'cancelled',
      );
    }

    const totalResult = await countQuery.executeTakeFirst();

    const total = Number(totalResult?.total || 0);
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get paginated payouts with seller user info, payout method info, and linked earnings
    let query = this.db
      .selectFrom('payouts')
      .select(eb => [
        'payouts.id',
        'payouts.sellerUserId',
        'payouts.payoutMethodId',
        'payouts.status',
        'payouts.amount',
        'payouts.currency',
        'payouts.processingFee',
        'payouts.requestedAt',
        'payouts.processedAt',
        'payouts.processedBy',
        'payouts.completedAt',
        'payouts.failedAt',
        'payouts.failureReason',
        'payouts.transactionReference',
        'payouts.notes',
        'payouts.metadata',
        'payouts.createdAt',
        'payouts.updatedAt',
        jsonObjectFrom(
          eb
            .selectFrom('users')
            .select([
              'users.id',
              'users.email',
              'users.firstName',
              'users.lastName',
            ])
            .whereRef('users.id', '=', 'payouts.sellerUserId'),
        ).as('seller'),
        jsonObjectFrom(
          eb
            .selectFrom('payoutMethods')
            .select([
              'payoutMethods.id',
              'payoutMethods.payoutType',
              'payoutMethods.accountHolderName',
              'payoutMethods.accountHolderSurname',
            ])
            .whereRef('payoutMethods.id', '=', 'payouts.payoutMethodId'),
        ).as('payoutMethod'),
        jsonArrayFrom(
          eb
            .selectFrom('sellerEarnings')
            .select([
              'sellerEarnings.id',
              'sellerEarnings.listingTicketId',
              'sellerEarnings.sellerAmount',
              'sellerEarnings.currency',
              'sellerEarnings.createdAt',
            ])
            .whereRef('sellerEarnings.payoutId', '=', 'payouts.id')
            .where('sellerEarnings.deletedAt', 'is', null),
        ).as('linkedEarnings'),
      ])
      .where('payouts.deletedAt', 'is', null);

    // Apply status filter if provided
    if (options?.status) {
      query = query.where(
        'payouts.status',
        '=',
        options.status as
          | 'pending'
          | 'processing'
          | 'completed'
          | 'failed'
          | 'cancelled',
      );
    }

    // Apply sorting - default to requestedAt ascending for admin view
    switch (sortBy) {
      case 'requestedAt':
        query = query.orderBy('payouts.requestedAt', sortOrder);
        break;
      case 'createdAt':
        query = query.orderBy('payouts.createdAt', sortOrder);
        break;
      case 'amount':
        query = query.orderBy('payouts.amount', sortOrder);
        break;
      case 'status':
        query = query.orderBy('payouts.status', sortOrder);
        break;
      default:
        query = query.orderBy('payouts.requestedAt', 'asc');
    }

    const payouts = await query.limit(limit).offset(offset).execute();

    return mapToPaginatedResponse(payouts, {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    });
  }
}
