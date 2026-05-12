import {Kysely, sql} from 'kysely';
import {
  DB,
  EventTicketCurrency,
  SellerEarningsRetainedReason,
  SellerEarningsStatus,
} from '@revendiste/shared';
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
  eventName: string;
  eventStartDate: Date;
}

/**
 * Raw SQL EXISTS check for open ticket reports on any reservation linked to
 * the given listing-ticket column.
 *
 * This replaces the previous INNER JOIN on orderTicketReservations which
 * caused a cartesian product (and inflated sums/counts) when a listing
 * ticket had multiple reservations.
 */
const NO_OPEN_TICKET_REPORT = sql<boolean>`NOT EXISTS (
  SELECT 1
  FROM order_ticket_reservations otr_rpt
  WHERE otr_rpt.listing_ticket_id = seller_earnings.listing_ticket_id
    AND (
      EXISTS (
        SELECT 1 FROM ticket_reports tr
        WHERE tr.entity_id = otr_rpt.order_id
          AND tr.entity_type = 'order'
          AND tr.status != 'closed'
      )
      OR EXISTS (
        SELECT 1 FROM ticket_reports tr
        WHERE tr.entity_id = otr_rpt.id
          AND tr.entity_type = 'order_ticket_reservation'
          AND tr.status != 'closed'
      )
    )
)`;

export class SellerEarningsRepository extends BaseRepository<SellerEarningsRepository> {
  withTransaction(trx: Kysely<DB>): SellerEarningsRepository {
    return new SellerEarningsRepository(trx);
  }

  async create(earningData: {
    sellerUserId: string;
    listingTicketId: string;
    sellerAmount: number;
    currency: EventTicketCurrency;
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
      .innerJoin(
        'eventTicketWaves',
        'listings.ticketWaveId',
        'eventTicketWaves.id',
      )
      .innerJoin('events', 'eventTicketWaves.eventId', 'events.id')
      .select(eb => [
        'listings.id as listingId',
        'listings.publisherUserId',
        sql<string>`SUM(seller_earnings.seller_amount)`.as('totalAmount'),
        sql<number>`COUNT(seller_earnings.id)`.as('ticketCount'),
        'sellerEarnings.currency',
        'events.name as eventName',
        'events.eventStartDate',
      ])
      .where('sellerEarnings.sellerUserId', '=', sellerUserId)
      .where('sellerEarnings.status', '=', 'available')
      .where('sellerEarnings.payoutId', 'is', null)
      .where('sellerEarnings.deletedAt', 'is', null)
      .where(NO_OPEN_TICKET_REPORT)
      .groupBy([
        'listings.id',
        'listings.publisherUserId',
        'sellerEarnings.currency',
        'events.name',
        'events.eventStartDate',
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
      .innerJoin(
        'eventTicketWaves',
        'listings.ticketWaveId',
        'eventTicketWaves.id',
      )
      .innerJoin('events', 'eventTicketWaves.eventId', 'events.id')
      .select([
        'sellerEarnings.id',
        'sellerEarnings.listingTicketId',
        'sellerEarnings.sellerAmount',
        'sellerEarnings.currency',
        'events.eventEndDate',
        'listings.id as listingId',
        'listings.publisherUserId',
        'events.name as eventName',
        'events.eventStartDate',
      ])
      .where('sellerEarnings.sellerUserId', '=', sellerUserId)
      .where('sellerEarnings.status', '=', 'available')
      .where('sellerEarnings.payoutId', 'is', null)
      .where('sellerEarnings.deletedAt', 'is', null)
      .where(NO_OPEN_TICKET_REPORT)
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
        status: 'payout_requested', // Status indicates payout is pending, not yet completed
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
      .where('sellerEarnings.deletedAt', 'is', null)
      .where(NO_OPEN_TICKET_REPORT);

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
    status:
      | 'pending'
      | 'available'
      | 'retained'
      | 'paid_out'
      | 'failed_payout'
      | 'payout_requested',
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

  /**
   * Mark all earnings linked to a payout as paid_out
   * Called when admin completes a payout
   */
  async markEarningsAsPaidOut(payoutId: string) {
    return await this.db
      .updateTable('sellerEarnings')
      .set({
        status: 'paid_out',
        updatedAt: new Date(),
      })
      .where('payoutId', '=', payoutId)
      .where('status', '=', 'payout_requested')
      .where('deletedAt', 'is', null)
      .execute();
  }

  /**
   * Release earnings from a payout (set back to available)
   * Called when admin cancels or fails a payout
   */
  async releaseEarningsFromPayout(payoutId: string) {
    return await this.db
      .updateTable('sellerEarnings')
      .set({
        status: 'available',
        payoutId: null,
        updatedAt: new Date(),
      })
      .where('payoutId', '=', payoutId)
      .where('status', '=', 'payout_requested')
      .where('deletedAt', 'is', null)
      .execute();
  }

  /**
   * Get balance of earnings with payout_requested status (pending payout)
   */
  async getPayoutPendingBalance(sellerUserId: string): Promise<BalanceResult[]> {
    return await this.db
      .selectFrom('sellerEarnings')
      .select(eb => [
        'sellerEarnings.currency',
        sql<string>`SUM(seller_earnings.seller_amount)`.as('amount'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('sellerUserId', '=', sellerUserId)
      .where('status', '=', 'payout_requested')
      .where('deletedAt', 'is', null)
      .groupBy('sellerEarnings.currency')
      .execute();
  }

  /**
   * Get balance of earnings that have been paid out
   */
  async getPaidOutBalance(sellerUserId: string): Promise<BalanceResult[]> {
    return await this.db
      .selectFrom('sellerEarnings')
      .select(eb => [
        'sellerEarnings.currency',
        sql<string>`SUM(seller_earnings.seller_amount)`.as('amount'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('sellerUserId', '=', sellerUserId)
      .where('status', '=', 'paid_out')
      .where('deletedAt', 'is', null)
      .groupBy('sellerEarnings.currency')
      .execute();
  }

  async getEarningsReadyForRelease(
    holdPeriodHours: number,
    limit: number = 100,
  ) {
    const now = new Date();

    return await this.db
      .selectFrom('sellerEarnings')
      .innerJoin(
        'listingTickets',
        'listingTickets.id',
        'sellerEarnings.listingTicketId',
      )
      .innerJoin('listings', 'listings.id', 'listingTickets.listingId')
      .innerJoin(
        'eventTicketWaves',
        'eventTicketWaves.id',
        'listings.ticketWaveId',
      )
      .innerJoin('events', 'events.id', 'eventTicketWaves.eventId')
      .select([
        'sellerEarnings.id',
        'sellerEarnings.sellerUserId',
        'sellerEarnings.listingTicketId',
        'sellerEarnings.sellerAmount',
        'sellerEarnings.currency',
        'sellerEarnings.status',
      ])
      .where(NO_OPEN_TICKET_REPORT)
      .where(
        sql<boolean>`events.event_end_date + (${sql.lit(holdPeriodHours)} * interval '1 hour') <= ${now}`,
      )
      .where('sellerEarnings.status', '=', 'pending')
      .where('sellerEarnings.deletedAt', 'is', null)
      .where('listingTickets.deletedAt', 'is', null)
      .orderBy(
        sql`events.event_end_date + (${sql.lit(holdPeriodHours)} * interval '1 hour')`,
        'asc',
      )
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
    // Include 'payout_requested' (normal case), 'paid_out' (edge case), and 'failed_payout' (idempotency)
    const earningsToClone = await this.db
      .selectFrom('sellerEarnings')
      .selectAll()
      .where('payoutId', '=', payoutId)
      .where(eb =>
        eb.or([
          eb('status', '=', 'payout_requested'),
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
      status: 'available' as const,
      payoutId: null,
      createdAt: now,
      updatedAt: now,
    }));

    await this.db.insertInto('sellerEarnings').values(clonedEarnings).execute();

    return clonedEarnings.length;
  }

  /**
   * Update status with a retained reason
   * Used when marking earnings as retained due to missing documents, disputes, etc.
   */
  async updateStatusWithReason(
    earningsId: string,
    status: SellerEarningsStatus,
    retainedReason: SellerEarningsRetainedReason,
  ) {
    return await this.db
      .updateTable('sellerEarnings')
      .set({
        status,
        retainedReason,
        updatedAt: new Date(),
      })
      .where('id', '=', earningsId)
      .execute();
  }

  /**
   * Retain earnings by listing ticket ID due to dispute/refund
   * Used when a ticket report refund is issued
   */
  async retainEarningsByListingTicketId(
    listingTicketId: string,
    retainedReason: SellerEarningsRetainedReason,
  ) {
    return await this.db
      .updateTable('sellerEarnings')
      .set({
        status: 'retained' as const,
        retainedReason,
        updatedAt: new Date(),
      })
      .where('listingTicketId', '=', listingTicketId)
      .where(eb =>
        eb.or([
          eb('status', '=', 'pending'),
          eb('status', '=', 'available'),
          eb('status', '=', 'payout_requested'),
        ]),
      )
      .where('deletedAt', 'is', null)
      .execute();
  }

  /**
   * Get earnings by listing ticket ID
   * Used to retrieve earnings for a specific ticket (e.g., for refunds)
   */
  async getEarningByListingTicketId(listingTicketId: string) {
    return await this.db
      .selectFrom('sellerEarnings')
      .selectAll()
      .where('listingTicketId', '=', listingTicketId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Find sold tickets where:
   * - Event has ended (eventEndDate <= now)
   * - No document was uploaded
   * - Reservation is still active (not already processed)
   * - Earnings status is 'pending' (not already retained)
   *
   * Returns data needed to cancel reservation, retain earnings, and notify both parties.
   */
  async getTicketsWithMissingDocumentsAfterEventEnd(limit: number = 100) {
    const now = new Date();

    return await this.db
      .selectFrom('sellerEarnings')
      .innerJoin('listingTickets', join =>
        join.onRef('listingTickets.id', '=', 'sellerEarnings.listingTicketId'),
      )
      .innerJoin('listings', join =>
        join.onRef('listings.id', '=', 'listingTickets.listingId'),
      )
      .innerJoin('eventTicketWaves', join =>
        join.onRef('eventTicketWaves.id', '=', 'listings.ticketWaveId'),
      )
      .innerJoin('events', join =>
        join.onRef('events.id', '=', 'eventTicketWaves.eventId'),
      )
      .innerJoin('orderTicketReservations', join =>
        join
          .onRef(
            'orderTicketReservations.listingTicketId',
            '=',
            'listingTickets.id',
          )
          .on('orderTicketReservations.status', '=', 'active'),
      )
      .innerJoin('orders', join =>
        join
          .onRef('orders.id', '=', 'orderTicketReservations.orderId')
          .on('orders.status', '=', 'confirmed'),
      )
      .leftJoin('ticketDocuments', join =>
        join
          .onRef('ticketDocuments.ticketId', '=', 'listingTickets.id')
          .on('ticketDocuments.isPrimary', '=', true)
          .on('ticketDocuments.deletedAt', 'is', null),
      )
      .where('events.eventEndDate', '<=', now)
      .where('ticketDocuments.id', 'is', null)
      .where('sellerEarnings.status', '=', 'pending')
      .where('sellerEarnings.deletedAt', 'is', null)
      .where('listingTickets.deletedAt', 'is', null)
      .distinctOn('sellerEarnings.id')
      .select(eb => [
        eb.ref('sellerEarnings.id').as('earningsId'),
        eb.ref('sellerEarnings.sellerUserId').as('sellerUserId'),
        eb.ref('listingTickets.id').as('ticketId'),
        eb.ref('orderTicketReservations.id').as('reservationId'),
        eb.ref('orderTicketReservations.orderId').as('orderId'),
        eb.ref('orders.userId').as('buyerUserId'),
        eb.ref('events.name').as('eventName'),
      ])
      // DISTINCT ON requires ORDER BY to start with the same columns; tie-break
      // so multiple active reservations for one ticket pick a stable row.
      .orderBy('sellerEarnings.id')
      .orderBy('orderTicketReservations.id')
      .limit(limit)
      .execute();
  }

  /**
   * Seller earnings for all tickets in the given orders (settlement breakdown / reconciliation).
   * DISTINCT ON keeps one row per earning when a listing ticket has multiple reservations
   * tied to the queried orders.
   */
  async getSellerEarningsForOrderIds(orderIds: string[]) {
    if (orderIds.length === 0) {
      return [];
    }

    return await this.db
      .selectFrom('sellerEarnings')
      .innerJoin('orderTicketReservations', join =>
        join
          .onRef(
            'orderTicketReservations.listingTicketId',
            '=',
            'sellerEarnings.listingTicketId',
          )
          .on('orderTicketReservations.orderId', 'in', orderIds),
      )
      .where('sellerEarnings.deletedAt', 'is', null)
      .distinctOn('sellerEarnings.id')
      .select(eb => [
        'sellerEarnings.id',
        'sellerEarnings.sellerAmount',
        'sellerEarnings.sellerUserId',
        'sellerEarnings.status',
        'sellerEarnings.currency',
        'sellerEarnings.payoutId',
        eb.ref('orderTicketReservations.orderId').as('orderId'),
      ])
      .orderBy('sellerEarnings.id')
      .execute();
  }
}
