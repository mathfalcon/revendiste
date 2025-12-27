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
      .where('status', '!=', 'failed_payout')
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

    // Build WHERE conditions - use OR if both listingTicketIds and listingIds are provided
    if (listingTicketIds && listingTicketIds.length > 0) {
      if (listingIds && listingIds.length > 0) {
        // Both provided - use OR condition
        const listingTicketIdsSubquery = this.db
          .selectFrom('listingTickets')
          .select('listingTickets.id')
          .where('listingTickets.listingId', 'in', listingIds)
          .where('listingTickets.deletedAt', 'is', null);

        query = query.where(eb =>
          eb.or([
            eb('sellerEarnings.listingTicketId', 'in', listingTicketIds),
            eb(
              'sellerEarnings.listingTicketId',
              'in',
              listingTicketIdsSubquery,
            ),
          ]),
        );
      } else {
        // Only listingTicketIds provided
        query = query.where('listingTicketId', 'in', listingTicketIds);
      }
    } else if (listingIds && listingIds.length > 0) {
      // Only listingIds provided - use subquery
      const listingTicketIdsSubquery = this.db
        .selectFrom('listingTickets')
        .select('listingTickets.id')
        .where('listingTickets.listingId', 'in', listingIds)
        .where('listingTickets.deletedAt', 'is', null);

      query = query.where('listingTicketId', 'in', listingTicketIdsSubquery);
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
    status: 'pending' | 'available' | 'retained' | 'paid_out' | 'failed_payout',
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

  async getEarningsReadyForRelease(limit: number = 100) {
    const now = new Date();
    return await this.db
      .selectFrom('sellerEarnings')
      .selectAll()
      .where('holdUntil', '<=', now)
      .where('status', '=', 'pending')
      .where('deletedAt', 'is', null)
      .orderBy('holdUntil', 'asc')
      .limit(limit)
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

  /**
   * Gets ticket data with price, event end date, and currency for earnings creation
   */
  async getTicketDataForEarnings(listingTicketId: string) {
    return await this.db
      .selectFrom('listingTickets')
      .innerJoin('listings', 'listingTickets.listingId', 'listings.id')
      .innerJoin(
        'eventTicketWaves',
        'listings.ticketWaveId',
        'eventTicketWaves.id',
      )
      .innerJoin('events', 'eventTicketWaves.eventId', 'events.id')
      .select([
        'listingTickets.id',
        'listingTickets.price',
        'listingTickets.listingId',
        'events.eventEndDate',
        'eventTicketWaves.currency',
      ])
      .where('listingTickets.id', '=', listingTicketId)
      .where('listingTickets.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Gets listing publisher user ID for earnings creation
   */
  async getListingPublisherUserId(listingId: string) {
    return await this.db
      .selectFrom('listings')
      .select(['listings.publisherUserId'])
      .where('listings.id', '=', listingId)
      .where('listings.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Clone earnings linked to a failed/cancelled payout
   * Updates original earnings to 'failed_payout' status and creates new earnings
   * records with status='available' and payout_id=NULL
   * Original earnings remain for audit trail but are excluded from balance calculations
   *
   * @param payoutId - ID of the failed/cancelled payout
   * @returns Number of earnings cloned
   */
  async cloneEarningsForFailedPayout(payoutId: string): Promise<number> {
    // Get all earnings linked to this payout that need to be cloned
    // Include both 'paid_out' (normal case) and 'failed_payout' (edge case: already marked but clones missing)
    const earningsToClone = await this.db
      .selectFrom('sellerEarnings')
      .selectAll()
      .where('payoutId', '=', payoutId)
      .where(eb =>
        eb.or([
          eb('status', '=', 'paid_out'),
          eb('status', '=', 'failed_payout'),
        ]),
      )
      .where('deletedAt', 'is', null)
      .execute();

    if (earningsToClone.length === 0) {
      return 0;
    }

    // Check for existing clones to avoid duplicates (idempotency)
    const listingTicketIds = earningsToClone.map(e => e.listingTicketId);
    const existingClones = await this.db
      .selectFrom('sellerEarnings')
      .select(['listingTicketId', 'sellerUserId', 'sellerAmount'])
      .where('listingTicketId', 'in', listingTicketIds)
      .where('payoutId', 'is', null)
      .where('status', '=', 'available')
      .where('deletedAt', 'is', null)
      .execute();

    // Create a set of existing clones for quick lookup
    const existingClonesSet = new Set(
      existingClones.map(
        c => `${c.listingTicketId}-${c.sellerUserId}-${c.sellerAmount}`,
      ),
    );

    // Filter out earnings that already have clones
    const earningsToInsert = earningsToClone.filter(
      earning =>
        !existingClonesSet.has(
          `${earning.listingTicketId}-${earning.sellerUserId}-${earning.sellerAmount}`,
        ),
    );

    if (earningsToInsert.length === 0) {
      return 0;
    }

    // Update original earnings to 'failed_payout' status
    const earningsIds = earningsToInsert.map(e => e.id);
    await this.db
      .updateTable('sellerEarnings')
      .set({
        status: 'failed_payout',
        updatedAt: new Date(),
      })
      .where('id', 'in', earningsIds)
      .execute();

    // Insert cloned earnings
    const now = new Date();
    const clonedEarnings = earningsToInsert.map(earning => ({
      sellerUserId: earning.sellerUserId,
      listingTicketId: earning.listingTicketId,
      sellerAmount: earning.sellerAmount,
      currency: earning.currency,
      holdUntil: earning.holdUntil,
      status: 'available' as const,
      payoutId: null,
      createdAt: now,
      updatedAt: now,
    }));

    await this.db.insertInto('sellerEarnings').values(clonedEarnings).execute();

    return clonedEarnings.length;
  }
}
