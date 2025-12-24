import {
  SellerEarningsRepository,
  OrderTicketReservationsRepository,
  ListingTicketsRepository,
} from '~/repositories';
import {calculateSellerAmount} from '~/utils/fees';
import {PAYOUT_HOLD_PERIOD_HOURS} from '~/config/env';
import {logger} from '~/utils';
import type {Kysely} from 'kysely';
import type {DB, EventTicketCurrency} from '@revendiste/shared';

interface BalanceByCurrency {
  currency: EventTicketCurrency;
  amount: string;
  count: number;
}

interface SellerBalance {
  available: BalanceByCurrency[];
  retained: BalanceByCurrency[];
  pending: BalanceByCurrency[];
  total: BalanceByCurrency[];
}

interface EarningsForSelection {
  byListing: Array<{
    listingId: string;
    publisherUserId: string;
    totalAmount: string;
    ticketCount: number;
    currency: EventTicketCurrency;
  }>;
  byTicket: Array<{
    id: string;
    listingTicketId: string;
    sellerAmount: string;
    currency: EventTicketCurrency;
    holdUntil: Date;
    listingId: string;
    publisherUserId: string;
  }>;
}

export class SellerEarningsService {
  constructor(
    private readonly sellerEarningsRepository: SellerEarningsRepository,
    private readonly orderTicketReservationsRepository: OrderTicketReservationsRepository,
    private readonly listingTicketsRepository: ListingTicketsRepository,
  ) {}

  /**
   * Creates a single seller earning from a sold ticket
   * Joins to get price and event_end_date
   */
  async createEarningFromSale(listingTicketId: string): Promise<void> {
    // Get listing ticket with price and event end date via joins
    const ticketData = await this.sellerEarningsRepository.getDb()
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

    if (!ticketData) {
      logger.error('Ticket not found for earnings creation', {
        listingTicketId,
      });
      throw new Error('Ticket not found');
    }

    // Get seller user ID from listing
    const listing = await this.sellerEarningsRepository.getDb()
      .selectFrom('listings')
      .select(['listings.publisherUserId'])
      .where('listings.id', '=', ticketData.listingId)
      .where('listings.deletedAt', 'is', null)
      .executeTakeFirst();

    if (!listing) {
      logger.error('Listing not found for earnings creation', {
        listingId: ticketData.listingId,
      });
      throw new Error('Listing not found');
    }

    // Calculate seller amount
    const sellerAmountCalc = calculateSellerAmount(Number(ticketData.price));
    const sellerAmount = sellerAmountCalc.totalAmount;

    // Calculate hold_until (event_end_date + 48 hours)
    const holdUntil = new Date(ticketData.eventEndDate);
    holdUntil.setHours(holdUntil.getHours() + PAYOUT_HOLD_PERIOD_HOURS);

    // Create earnings record
    await this.sellerEarningsRepository.create({
      sellerUserId: listing.publisherUserId,
      listingTicketId,
      sellerAmount,
      currency: ticketData.currency,
      holdUntil,
      status: 'pending',
    });

    logger.info('Created seller earning', {
      listingTicketId,
      sellerUserId: listing.publisherUserId,
      sellerAmount,
      currency: ticketData.currency,
      holdUntil,
    });
  }

  /**
   * Batch creates seller earnings for all sold tickets in an order
   * Called from PaymentWebhookAdapter after marking tickets as sold
   */
  async createEarningsForSoldTickets(orderId: string): Promise<void> {
    // Get all sold tickets from order (via order_ticket_reservations)
    const reservations =
      await this.orderTicketReservationsRepository.getByOrderId(orderId);

    if (reservations.length === 0) {
      logger.warn('No reservations found for order', {orderId});
      return;
    }

    // Create earnings for each sold ticket
    await Promise.all(
      reservations.map(reservation =>
        this.createEarningFromSale(reservation.listingTicketId),
      ),
    );

    logger.info('Created seller earnings for sold tickets', {
      orderId,
      ticketCount: reservations.length,
    });
  }

  /**
   * Gets seller balance grouped by currency and status
   * Returns available, retained, pending, and total with ticket counts
   */
  async getSellerBalance(sellerUserId: string): Promise<SellerBalance> {
    const [available, retained, pending, total] = await Promise.all([
      this.sellerEarningsRepository.getAvailableBalance(sellerUserId),
      this.sellerEarningsRepository.getRetainedBalance(sellerUserId),
      this.sellerEarningsRepository.getPendingBalance(sellerUserId),
      this.sellerEarningsRepository.getTotalBalance(sellerUserId),
    ]);

    return {
      available,
      retained,
      pending,
      total,
    };
  }

  /**
   * Gets available earnings grouped by listing and individual tickets
   * Used for UI selection when seller requests payout
   */
  async getAvailableEarningsForSelection(
    sellerUserId: string,
  ): Promise<EarningsForSelection> {
    const [byListing, byTicket] = await Promise.all([
      this.sellerEarningsRepository.getAvailableEarningsByListing(sellerUserId),
      this.sellerEarningsRepository.getAvailableEarningsByTicket(sellerUserId),
    ]);

    return {
      byListing,
      byTicket: byTicket.map(ticket => ({
        id: ticket.id,
        listingTicketId: ticket.listingTicketId,
        sellerAmount: ticket.sellerAmount,
        currency: ticket.currency,
        holdUntil: ticket.holdUntil,
        listingId: ticket.listingId,
        publisherUserId: ticket.publisherUserId,
      })),
    };
  }

  /**
   * Background job logic to release holds
   * Finds earnings where hold_until <= NOW() and status = 'pending'
   * Updates to 'available' if no reports, 'retained' if reports exist
   */
  async checkHoldPeriods(): Promise<{
    released: number;
    retained: number;
  }> {
    const earningsReady = await this.sellerEarningsRepository.getEarningsReadyForRelease();

    if (earningsReady.length === 0) {
      logger.debug('No earnings ready for release');
      return {released: 0, retained: 0};
    }

    // TODO: Check for open reports/disputes (future: query reports table)
    // For now, assume no reports exist and release all
    const earningsToRelease = earningsReady.map(e => e.id);

    await this.sellerEarningsRepository.updateStatus(
      earningsToRelease,
      'available',
    );

    logger.info('Released earnings from hold period', {
      count: earningsToRelease.length,
    });

    return {
      released: earningsToRelease.length,
      retained: 0, // TODO: Update when reports system is implemented
    };
  }
}

