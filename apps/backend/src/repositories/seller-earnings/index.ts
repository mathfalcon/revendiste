import {Kysely, sql} from 'kysely';
import {DB, EventTicketCurrency} from '@revendiste/shared';
import {BaseRepository} from '../base';

interface BalanceResult {
  currency: EventTicketCurrency;
  amount: string;
  count: number;
}

interface EarningsByListing {
  listingId: string;
  publisherUserId: string;
  totalAmount: string;
  ticketCount: number;
  currency: EventTicketCurrency;
}

export class SellerEarningsRepository extends BaseRepository<SellerEarningsRepository> {
  withTransaction(trx: Kysely<DB>): SellerEarningsRepository {
    return new SellerEarningsRepository(trx);
  }

  async create(earningData: {
    sellerUserId: string;
    listingTicketId: string;
    sellerAmount: number;
    currency: EventTicketCurrency;
    holdUntil: Date;
    status: 'pending';
  }) {
    return await this.db
      .insertInto('sellerEarnings')
      .values(earningData)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getBySellerId(sellerUserId: string) {
    return await this.db
      .selectFrom('sellerEarnings')
      .selectAll()
      .where('sellerUserId', '=', sellerUserId)
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async getAvailableBalance(sellerUserId: string): Promise<BalanceResult[]> {
    return await this.db
      .selectFrom('sellerEarnings')
      .select(eb => [
        'sellerEarnings.currency',
        sql<string>`SUM(seller_earnings.seller_amount)`.as('amount'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('sellerUserId', '=', sellerUserId)
      .where('status', '=', 'available')
      .where('payoutId', 'is', null)
      .where('deletedAt', 'is', null)
      .groupBy('sellerEarnings.currency')
      .execute();
  }

  async getRetainedBalance(sellerUserId: string): Promise<BalanceResult[]> {
    return await this.db
      .selectFrom('sellerEarnings')
      .select(eb => [
        'sellerEarnings.currency',
        sql<string>`SUM(seller_earnings.seller_amount)`.as('amount'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('sellerUserId', '=', sellerUserId)
      .where('status', '=', 'retained')
      .where('deletedAt', 'is', null)
      .groupBy('sellerEarnings.currency')
      .execute();
  }

  async getPendingBalance(sellerUserId: string): Promise<BalanceResult[]> {
    return await this.db
      .selectFrom('sellerEarnings')
      .select(eb => [
        'sellerEarnings.currency',
        sql<string>`SUM(seller_earnings.seller_amount)`.as('amount'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('sellerUserId', '=', sellerUserId)
      .where('status', '=', 'pending')
      .where('deletedAt', 'is', null)
      .groupBy('sellerEarnings.currency')
      .execute();
  }

  async getTotalBalance(sellerUserId: string): Promise<BalanceResult[]> {
    return await this.db
      .selectFrom('sellerEarnings')
      .select(eb => [
        'sellerEarnings.currency',
        sql<string>`SUM(seller_earnings.seller_amount)`.as('amount'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('sellerUserId', '=', sellerUserId)
      .where('deletedAt', 'is', null)
      .groupBy('sellerEarnings.currency')
      .execute();
  }

  async getAvailableEarningsByListing(
    sellerUserId: string,
  ): Promise<EarningsByListing[]> {
    return await this.db
      .selectFrom('sellerEarnings')
      .innerJoin(
        'listingTickets',
        'sellerEarnings.listingTicketId',
        'listingTickets.id',
      )
      .innerJoin('listings', 'listingTickets.listingId', 'listings.id')
      .select(eb => [
        'listings.id as listingId',
        'listings.publisherUserId',
        sql<string>`SUM(seller_earnings.seller_amount)`.as('totalAmount'),
        sql<number>`COUNT(seller_earnings.id)`.as('ticketCount'),
        'sellerEarnings.currency',
      ])
      .where('sellerEarnings.sellerUserId', '=', sellerUserId)
      .where('sellerEarnings.status', '=', 'available')
      .where('sellerEarnings.payoutId', 'is', null)
      .where('sellerEarnings.deletedAt', 'is', null)
      .groupBy([
        'listings.id',
        'listings.publisherUserId',
        'sellerEarnings.currency',
      ])
      .execute();
  }

  async getAvailableEarningsByTicket(sellerUserId: string) {
    return await this.db
      .selectFrom('sellerEarnings')
      .innerJoin(
        'listingTickets',
        'sellerEarnings.listingTicketId',
        'listingTickets.id',
      )
      .innerJoin('listings', 'listingTickets.listingId', 'listings.id')
      .select([
        'sellerEarnings.id',
        'sellerEarnings.listingTicketId',
        'sellerEarnings.sellerAmount',
        'sellerEarnings.currency',
        'sellerEarnings.holdUntil',
        'listings.id as listingId',
        'listings.publisherUserId',
      ])
      .where('sellerEarnings.sellerUserId', '=', sellerUserId)
      .where('sellerEarnings.status', '=', 'available')
      .where('sellerEarnings.payoutId', 'is', null)
      .where('sellerEarnings.deletedAt', 'is', null)
      .orderBy('sellerEarnings.createdAt', 'desc')
      .execute();
  }

  async linkSelectedEarningsToPayout(
    payoutId: string,
    listingTicketIds?: string[],
    listingIds?: string[],
  ) {
    let query = this.db
      .updateTable('sellerEarnings')
      .set({
        payoutId,
        status: 'paid_out',
        updatedAt: new Date(),
      })
      .where('payoutId', 'is', null)
      .where('status', '=', 'available')
      .where('deletedAt', 'is', null);

    if (listingTicketIds && listingTicketIds.length > 0) {
      query = query.where('listingTicketId', 'in', listingTicketIds);
    }

    if (listingIds && listingIds.length > 0) {
      query = query
        .innerJoin(
          'listingTickets',
          'sellerEarnings.listingTicketId',
          'listingTickets.id',
        )
        .where('listingTickets.listingId', 'in', listingIds);
    }

    return await query.execute();
  }

  async validateEarningsSelection(
    sellerUserId: string,
    listingTicketIds?: string[],
    listingIds?: string[],
  ): Promise<{
    valid: boolean;
    earnings: Array<{
      id: string;
      listingTicketId: string;
      sellerAmount: string;
      currency: EventTicketCurrency;
    }>;
    error?: string;
  }> {
    let query = this.db
      .selectFrom('sellerEarnings')
      .select([
        'sellerEarnings.id',
        'sellerEarnings.listingTicketId',
        'sellerEarnings.sellerAmount',
        'sellerEarnings.currency',
      ])
      .where('sellerEarnings.sellerUserId', '=', sellerUserId)
      .where('sellerEarnings.status', '=', 'available')
      .where('sellerEarnings.payoutId', 'is', null)
      .where('sellerEarnings.deletedAt', 'is', null);

    if (listingTicketIds && listingTicketIds.length > 0) {
      query = query.where(
        'sellerEarnings.listingTicketId',
        'in',
        listingTicketIds,
      );
    }

    if (listingIds && listingIds.length > 0) {
      // Verify that all listingIds belong to the seller
      const listings = await this.db
        .selectFrom('listings')
        .select(['listings.id', 'listings.publisherUserId'])
        .where('listings.id', 'in', listingIds)
        .where('listings.deletedAt', 'is', null)
        .execute();

      // Check if all listings belong to the seller
      const invalidListings = listings.filter(
        l => l.publisherUserId !== sellerUserId,
      );
      if (invalidListings.length > 0) {
        return {
          valid: false,
          earnings: [],
          error: 'Some selected listings do not belong to seller',
        };
      }

      // Check if all provided listingIds exist
      const foundListingIds = new Set(listings.map(l => l.id));
      const missingListingIds = listingIds.filter(
        id => !foundListingIds.has(id),
      );
      if (missingListingIds.length > 0) {
        return {
          valid: false,
          earnings: [],
          error: 'Some selected listings do not exist',
        };
      }

      query = query
        .innerJoin(
          'listingTickets',
          'sellerEarnings.listingTicketId',
          'listingTickets.id',
        )
        .where('listingTickets.listingId', 'in', listingIds);
    }

    const earnings = await query.execute();

    if (earnings.length === 0) {
      return {
        valid: false,
        earnings: [],
        error: 'No available earnings found for selected tickets/listings',
      };
    }

    // Check all earnings are same currency
    const currencies = new Set(earnings.map(e => e.currency));
    if (currencies.size > 1) {
      return {
        valid: false,
        earnings: [],
        error: 'All selected earnings must be in the same currency',
      };
    }

    return {
      valid: true,
      earnings: earnings.map(e => ({
        id: e.id,
        listingTicketId: e.listingTicketId,
        sellerAmount: e.sellerAmount,
        currency: e.currency,
      })),
    };
  }

  async updateStatus(
    earningsIds: string[],
    status: 'pending' | 'available' | 'retained' | 'paid_out',
  ) {
    return await this.db
      .updateTable('sellerEarnings')
      .set({
        status,
        updatedAt: new Date(),
      })
      .where('id', 'in', earningsIds)
      .execute();
  }

  async getEarningsReadyForRelease() {
    const now = new Date();
    return await this.db
      .selectFrom('sellerEarnings')
      .selectAll()
      .where('holdUntil', '<=', now)
      .where('status', '=', 'pending')
      .where('deletedAt', 'is', null)
      .execute();
  }

  async getEarningsByListingTicketIds(listingTicketIds: string[]) {
    return await this.db
      .selectFrom('sellerEarnings')
      .selectAll()
      .where('listingTicketId', 'in', listingTicketIds)
      .where('deletedAt', 'is', null)
      .execute();
  }
}
