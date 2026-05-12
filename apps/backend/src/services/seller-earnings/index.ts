import {
  SellerEarningsRepository,
  OrderTicketReservationsRepository,
} from '~/repositories';
import {calculateSellerAmount} from '~/utils/fees';
import {PAYOUT_HOLD_PERIOD_HOURS} from '~/config/env';
import {
  SELLER_EARNINGS_HOLD_PERIOD_BATCH_SIZE,
  SELLER_EARNINGS_MISSING_DOCS_BATCH_SIZE,
} from '~/constants/limits';
import {logger} from '~/utils';
import {roundOrderAmount} from '@revendiste/shared';
import type {EventTicketCurrency} from '@revendiste/shared';
import {NotificationService} from '~/services/notifications';
import {
  notifySellerEarningsRetained,
  notifySellerEarningsAvailable,
  notifyBuyerTicketCancelled,
} from '~/services/notifications/helpers';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import type {TicketReportsService} from '~/services/ticket-reports';

function aggregateReleasedEarningsBySeller(
  rows: Array<{
    sellerUserId: string;
    sellerAmount: string | number;
    currency: EventTicketCurrency;
  }>,
): Array<{
  sellerUserId: string;
  lines: Array<{
    currency: EventTicketCurrency;
    amount: string;
    earningCount: number;
  }>;
}> {
  const bySeller = new Map<
    string,
    Map<EventTicketCurrency, {total: number; count: number}>
  >();

  for (const row of rows) {
    let currencyMap = bySeller.get(row.sellerUserId);
    if (!currencyMap) {
      currencyMap = new Map();
      bySeller.set(row.sellerUserId, currencyMap);
    }
    const currency = row.currency;
    const prev = currencyMap.get(currency) ?? {total: 0, count: 0};
    currencyMap.set(currency, {
      total: roundOrderAmount(prev.total + Number(row.sellerAmount)),
      count: prev.count + 1,
    });
  }

  const result: Array<{
    sellerUserId: string;
    lines: Array<{
      currency: EventTicketCurrency;
      amount: string;
      earningCount: number;
    }>;
  }> = [];

  for (const [sellerUserId, currencyMap] of bySeller) {
    const lines = Array.from(currencyMap.entries()).map(([currency, v]) => ({
      currency,
      amount: v.total.toFixed(2),
      earningCount: v.count,
    }));
    result.push({sellerUserId, lines});
  }

  return result;
}

function computeHoldEndsAt(eventEndDate: Date, holdPeriodHours: number): Date {
  const d = new Date(eventEndDate);
  d.setHours(d.getHours() + holdPeriodHours);
  return d;
}

interface BalanceByCurrency {
  currency: EventTicketCurrency;
  amount: string;
  count: number;
}

interface SellerBalance {
  available: BalanceByCurrency[];
  retained: BalanceByCurrency[];
  pending: BalanceByCurrency[];
  payoutPending: BalanceByCurrency[]; // Earnings linked to pending payouts (payout_requested status)
  paidOut: BalanceByCurrency[]; // Earnings that have been paid out
  total: BalanceByCurrency[];
}

interface EarningsForSelection {
  byListing: Array<{
    listingId: string;
    publisherUserId: string;
    totalAmount: string;
    ticketCount: number;
    currency: EventTicketCurrency;
    eventName: string;
    eventStartDate: Date;
  }>;
  byTicket: Array<{
    id: string;
    listingTicketId: string;
    sellerAmount: string;
    currency: EventTicketCurrency;
    holdUntil: Date;
    listingId: string;
    publisherUserId: string;
    eventName: string;
    eventStartDate: Date;
  }>;
}

export class SellerEarningsService {
  constructor(
    private readonly sellerEarningsRepository: SellerEarningsRepository,
    private readonly orderTicketReservationsRepository: OrderTicketReservationsRepository,
    private readonly notificationService?: NotificationService,
    private readonly ticketReportsService?: TicketReportsService,
  ) {}

  /**
   * Creates a single seller earning from a sold ticket.
   * When trx is provided, uses the transaction (e.g. from payment webhook flow).
   * Idempotent: skips if an active earning already exists for this listing_ticket_id
   * (allows clone flow where original is failed_payout and clone is available).
   */
  async createEarningFromSale(
    listingTicketId: string,
    trx?: Kysely<DB>,
  ): Promise<void> {
    const earningsRepo = trx
      ? this.sellerEarningsRepository.withTransaction(trx)
      : this.sellerEarningsRepository;
    const reservationsRepo = trx
      ? this.orderTicketReservationsRepository.withTransaction(trx)
      : this.orderTicketReservationsRepository;

    // Idempotency: skip if an active earning already exists for this ticket
    // (e.g. duplicate webhook; clone flow uses failed_payout so not considered "active")
    const existing = await earningsRepo.getEarningsByListingTicketIds([
      listingTicketId,
    ]);
    const hasActiveEarning = existing.some(e => e.status !== 'failed_payout');
    if (hasActiveEarning) {
      logger.debug('Earning already exists for ticket, skipping', {
        listingTicketId,
      });
      return;
    }

    // Get listing ticket with price and event end date via repository
    const ticketData =
      await earningsRepo.getTicketDataForEarnings(listingTicketId);

    if (!ticketData) {
      logger.error('Ticket not found for earnings creation', {
        listingTicketId,
      });
      throw new Error('Ticket not found');
    }

    // Get seller user ID from listing via repository
    const listing =
      await earningsRepo.getListingPublisherUserId(ticketData.listingId);

    if (!listing) {
      logger.error('Listing not found for earnings creation', {
        listingId: ticketData.listingId,
      });
      throw new Error('Listing not found');
    }

    // Calculate seller amount and round to 2 decimal places (same logic as payments)
    const sellerAmountCalc = calculateSellerAmount(Number(ticketData.price));
    const sellerAmount = roundOrderAmount(sellerAmountCalc.totalAmount);

    // Create earnings record (hold ends at event end + PAYOUT_HOLD_PERIOD_HOURS; derived in queries)
    await earningsRepo.create({
      sellerUserId: listing.publisherUserId,
      listingTicketId,
      sellerAmount,
      currency: ticketData.currency,
      status: 'pending',
    });

    logger.info('Created seller earning', {
      listingTicketId,
      sellerUserId: listing.publisherUserId,
      sellerAmount,
      currency: ticketData.currency,
      eventEndDate: ticketData.eventEndDate,
    });
  }

  /**
   * Batch creates seller earnings for all sold tickets in an order
   * Called from PaymentWebhookAdapter after marking tickets as sold.
   * When trx is provided, all DB operations use the transaction.
   */
  async createEarningsForSoldTickets(
    orderId: string,
    trx?: Kysely<DB>,
  ): Promise<void> {
    const reservationsRepo = trx
      ? this.orderTicketReservationsRepository.withTransaction(trx)
      : this.orderTicketReservationsRepository;

    // Get all sold tickets from order (via order_ticket_reservations)
    const reservations = await reservationsRepo.getByOrderId(orderId);

    if (reservations.length === 0) {
      logger.warn('No reservations found for order', {orderId});
      return;
    }

    // Create earnings for each sold ticket
    await Promise.all(
      reservations.map(reservation =>
        this.createEarningFromSale(reservation.listingTicketId, trx),
      ),
    );

    logger.info('Created seller earnings for sold tickets', {
      orderId,
      ticketCount: reservations.length,
    });
  }

  /**
   * Gets seller balance grouped by currency and status
   * Returns available, retained, pending, payoutPending, paidOut, and total with ticket counts
   */
  async getSellerBalance(sellerUserId: string): Promise<SellerBalance> {
    const [available, retained, pending, payoutPending, paidOut, total] =
      await Promise.all([
        this.sellerEarningsRepository.getAvailableBalance(sellerUserId),
        this.sellerEarningsRepository.getRetainedBalance(sellerUserId),
        this.sellerEarningsRepository.getPendingBalance(sellerUserId),
        this.sellerEarningsRepository.getPayoutPendingBalance(sellerUserId),
        this.sellerEarningsRepository.getPaidOutBalance(sellerUserId),
        this.sellerEarningsRepository.getTotalBalance(sellerUserId),
      ]);

    return {
      available,
      retained,
      pending,
      payoutPending,
      paidOut,
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
        holdUntil: computeHoldEndsAt(
          ticket.eventEndDate,
          PAYOUT_HOLD_PERIOD_HOURS,
        ),
        listingId: ticket.listingId,
        publisherUserId: ticket.publisherUserId,
        eventName: ticket.eventName,
        eventStartDate: ticket.eventStartDate,
      })),
    };
  }

  /**
   * Background job logic to release holds
   * Finds pending earnings where event end + hold period has passed (see repository SQL)
   * Updates to 'available' if no reports, 'retained' if reports exist
   * Processes in batches to avoid transactional issues
   */
  async checkHoldPeriods(
    limit: number = SELLER_EARNINGS_HOLD_PERIOD_BATCH_SIZE,
  ): Promise<{
    released: number;
    retained: number;
  }> {
    const earningsReady =
      await this.sellerEarningsRepository.getEarningsReadyForRelease(
        PAYOUT_HOLD_PERIOD_HOURS,
        limit,
      );

    if (earningsReady.length === 0) {
      logger.debug('No earnings ready for release');
      return {released: 0, retained: 0};
    }

    // Repository query already excludes earnings with open ticket reports
    const earningsToRelease = earningsReady.map(e => e.id);

    // Process in batches to avoid transactional issues
    const BATCH_SIZE = 50;
    let totalReleased = 0;

    for (let i = 0; i < earningsToRelease.length; i += BATCH_SIZE) {
      const batch = earningsToRelease.slice(i, i + BATCH_SIZE);
      const batchRows = earningsReady.filter(e => batch.includes(e.id));

      await this.sellerEarningsRepository.executeTransaction(async trx => {
        const repo = this.sellerEarningsRepository.withTransaction(trx);
        await repo.updateStatus(batch, 'available');
      });

      totalReleased += batch.length;

      if (this.notificationService && batchRows.length > 0) {
        const grouped = aggregateReleasedEarningsBySeller(batchRows);
        for (const g of grouped) {
          notifySellerEarningsAvailable(this.notificationService, {
            sellerUserId: g.sellerUserId,
            lines: g.lines,
          }).catch(error => {
            logger.error('Failed to notify seller earnings available', {
              sellerUserId: g.sellerUserId,
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }
      }
    }

    logger.info('Released earnings from hold period', {
      count: totalReleased,
    });

    return {
      released: totalReleased,
      retained: 0, // Earnings with open reports are excluded by the repository query
    };
  }

  /**
   * Check for sold tickets where event has ended but seller didn't upload documents.
   *
   * For each match:
   * 1. Mark seller earnings as 'retained' with reason 'missing_document'
   * 2. Mark order ticket reservation as 'cancelled'
   * 3. Notify seller (earnings retained)
   * 4. Notify buyer (ticket cancelled, refund pending)
   *
   * This runs BEFORE checkHoldPeriods() in the cronjob so that retained earnings
   * are skipped by the hold period release logic.
   */
  async checkMissingDocumentsAfterEventEnd(
    limit: number = SELLER_EARNINGS_MISSING_DOCS_BATCH_SIZE,
  ): Promise<{
    processed: number;
  }> {
    const ticketsWithMissingDocs =
      await this.sellerEarningsRepository.getTicketsWithMissingDocumentsAfterEventEnd(
        limit,
      );

    if (ticketsWithMissingDocs.length === 0) {
      logger.debug('No tickets with missing documents after event end');
      return {processed: 0};
    }

    logger.info('Found tickets with missing documents after event end', {
      count: ticketsWithMissingDocs.length,
    });

    for (const item of ticketsWithMissingDocs) {
      try {
        // 1. Mark seller earnings as retained immediately
        await this.sellerEarningsRepository.updateStatusWithReason(
          item.earningsId,
          'retained',
          'missing_document',
        );

        // 2. Mark order ticket reservation as cancelled (buyer's view)
        await this.orderTicketReservationsRepository.updateStatus(
          item.reservationId,
          'cancelled',
        );

        // 3. Send notifications (fire-and-forget)
        if (this.notificationService) {
          notifySellerEarningsRetained(this.notificationService, {
            sellerUserId: item.sellerUserId,
            eventName: item.eventName,
            ticketCount: 1, // Per-ticket processing
            reason: 'missing_document',
          }).catch(err =>
            logger.error('Failed to notify seller about retained earnings', {
              error: err,
              sellerUserId: item.sellerUserId,
            }),
          );

          notifyBuyerTicketCancelled(this.notificationService, {
            buyerUserId: item.buyerUserId,
            eventName: item.eventName,
            ticketCount: 1, // Per-ticket processing
            reason: 'seller_failed_to_upload',
          }).catch(err =>
            logger.error('Failed to notify buyer about cancelled ticket', {
              error: err,
              buyerUserId: item.buyerUserId,
            }),
          );
        }

        logger.info('Processed missing document for ticket', {
          earningsId: item.earningsId,
          ticketId: item.ticketId,
          reservationId: item.reservationId,
          eventName: item.eventName,
        });
      } catch (error) {
        logger.error('Failed to process missing document for ticket', {
          error,
          earningsId: item.earningsId,
          ticketId: item.ticketId,
        });
        // Continue processing other tickets
      }
    }

    // Create one auto-case per reservation (not per order) for finer control —
    // an order may have multiple tickets where only some are missing docs.
    // Runs outside transactions per revendiste patterns.
    if (this.ticketReportsService) {
      for (const item of ticketsWithMissingDocs) {
        try {
          await this.ticketReportsService.createAutoCase({
            caseType: 'ticket_not_received',
            entityType: 'order_ticket_reservation',
            entityId: item.reservationId,
            source: 'auto_missing_document',
            reservationIds: [item.reservationId],
            reportedByUserId: item.buyerUserId ?? null,
            eventName: item.eventName,
          });
        } catch (err) {
          logger.error('Failed to create auto-case for reservation', {
            reservationId: item.reservationId,
            error: err,
          });
        }
      }
    }

    return {processed: ticketsWithMissingDocs.length};
  }
}
