import {Kysely, sql} from 'kysely';
import {jsonArrayFrom, jsonObjectFrom} from 'kysely/helpers/postgres';
import {DB, EventTicketCurrency, Json} from '@revendiste/shared';
import {BaseRepository} from '../base';
import {mapToPaginatedResponse} from '~/middleware';
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
