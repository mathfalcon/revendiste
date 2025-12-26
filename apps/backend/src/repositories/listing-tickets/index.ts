import {Kysely} from 'kysely';
import {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class ListingTicketsRepository extends BaseRepository<ListingTicketsRepository> {
  withTransaction(trx: Kysely<DB>): ListingTicketsRepository {
    return new ListingTicketsRepository(trx);
  }

  async findAvailableTicketsByPriceGroup(
    ticketWaveId: string,
    price: number,
    quantity: number,
  ) {
    return await this.db
      .selectFrom('listingTickets')
      .innerJoin('listings', 'listingTickets.listingId', 'listings.id')
      .leftJoin('orderTicketReservations', join =>
        join
          .onRef(
            'orderTicketReservations.listingTicketId',
            '=',
            'listingTickets.id',
          )
          .on('orderTicketReservations.deletedAt', 'is', null)
          .on('orderTicketReservations.reservedUntil', '>', new Date()),
      )
      .select([
        'listingTickets.id',
        'listingTickets.listingId',
        'listingTickets.ticketNumber',
        'listingTickets.price',
      ])
      .where('listings.ticketWaveId', '=', ticketWaveId)
      .where('listingTickets.price', '=', price.toString())
      .where('listingTickets.soldAt', 'is', null)
      .where('listingTickets.cancelledAt', 'is', null)
      .where('listingTickets.deletedAt', 'is', null)
      .where('listings.deletedAt', 'is', null)
      .where('orderTicketReservations.id', 'is', null) // Not reserved
      .orderBy('listingTickets.createdAt', 'asc')
      .limit(quantity)
      .execute();
  }

  async markTicketsAsSold(ticketIds: string[]) {
    return await this.db
      .updateTable('listingTickets')
      .set({
        soldAt: new Date(),
      })
      .where('id', 'in', ticketIds)
      .returningAll()
      .execute();
  }

  async markTicketsAsSoldByOrderId(orderId: string) {
    return await this.db
      .updateTable('listingTickets')
      .set({
        soldAt: new Date(),
      })
      .where('id', 'in', eb =>
        eb
          .selectFrom('orderTicketReservations')
          .select('listingTicketId')
          .where('orderId', '=', orderId)
          .where('deletedAt', 'is', null),
      )
      .returningAll()
      .execute();
  }

  async getListingsByIds(listingIds: string[]) {
    return await this.db
      .selectFrom('listings')
      .select(['id', 'publisherUserId'])
      .where('id', 'in', listingIds)
      .where('deletedAt', 'is', null)
      .execute();
  }

  /**
   * Get ticket by ID with listing and event information
   * Note: Document information now lives in ticket_documents table
   * Use TicketDocumentsRepository to fetch document data
   */
  async getTicketById(ticketId: string) {
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
        'listingTickets.listingId',
        'listingTickets.ticketNumber',
        'listingTickets.price',
        'listingTickets.soldAt',
        'listingTickets.cancelledAt',
        'listings.publisherUserId',
        'eventTicketWaves.name as ticketWaveName',
        'eventTicketWaves.faceValue',
        'eventTicketWaves.currency',
        'eventTicketWaves.eventId',
        'events.name as eventName',
        'events.eventStartDate',
        'events.eventEndDate',
      ])
      .where('listingTickets.id', '=', ticketId)
      .where('listingTickets.deletedAt', 'is', null)
      .where('listings.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Get ticket with reservation status
   * Checks if ticket has an active reservation
   */
  async getTicketWithReservationStatus(ticketId: string) {
    return await this.db
      .selectFrom('listingTickets')
      .leftJoin('orderTicketReservations', join =>
        join
          .onRef(
            'orderTicketReservations.listingTicketId',
            '=',
            'listingTickets.id',
          )
          .on('orderTicketReservations.deletedAt', 'is', null)
          .on('orderTicketReservations.reservedUntil', '>', new Date()),
      )
      .select([
        'listingTickets.id',
        'listingTickets.soldAt',
        'listingTickets.cancelledAt',
        'listingTickets.deletedAt',
        'orderTicketReservations.id as reservationId',
      ])
      .where('listingTickets.id', '=', ticketId)
      .executeTakeFirst();
  }

  /**
   * Update ticket price
   */
  async updateTicketPrice(ticketId: string, price: number) {
    return await this.db
      .updateTable('listingTickets')
      .set({
        price: price.toString(),
        updatedAt: new Date(),
      })
      .where('id', '=', ticketId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Soft delete a ticket
   */
  async softDeleteTicket(ticketId: string) {
    return await this.db
      .updateTable('listingTickets')
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', ticketId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Get ticket for buyer verification
   * Used by buyers to verify ownership of purchased tickets
   */
  async getTicketByOrderId(orderId: string, ticketId: string) {
    return await this.db
      .selectFrom('listingTickets')
      .innerJoin(
        'orderTicketReservations',
        'listingTickets.id',
        'orderTicketReservations.listingTicketId',
      )
      .innerJoin('orders', 'orderTicketReservations.orderId', 'orders.id')
      .select([
        'listingTickets.id',
        'listingTickets.listingId',
        'listingTickets.ticketNumber',
        'orders.userId as buyerUserId',
        'orders.status as orderStatus',
      ])
      .where('orders.id', '=', orderId)
      .where('listingTickets.id', '=', ticketId)
      .where('orders.status', '=', 'confirmed')
      .where('orderTicketReservations.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Get sold tickets that are entering the upload availability window or at milestone times
   * Based on qrAvailabilityTiming (e.g., 12h before event start)
   * Returns tickets that don't have documents yet and are:
   * - At QR availability time (±30min window)
   * - OR at milestone times (24h, 12h, 6h, 3h, 2h, 1h ±30min window) that are after QR availability
   */
  async getTicketsEnteringUploadWindow() {
    const now = new Date();
    const MILESTONE_THRESHOLDS = [24, 12, 6, 3, 2, 1];

    return await this.db
      .selectFrom('listingTickets')
      .innerJoin('listings', 'listingTickets.listingId', 'listings.id')
      .innerJoin(
        'eventTicketWaves',
        'listings.ticketWaveId',
        'eventTicketWaves.id',
      )
      .innerJoin('events', 'eventTicketWaves.eventId', 'events.id')
      .leftJoin('ticketDocuments', join =>
        join
          .onRef('ticketDocuments.ticketId', '=', 'listingTickets.id')
          .on('ticketDocuments.isPrimary', '=', true)
          .on('ticketDocuments.deletedAt', 'is', null),
      )
      .select([
        'listingTickets.id as ticketId',
        'listingTickets.listingId',
        'listings.publisherUserId as sellerUserId',
        'events.name as eventName',
        'events.eventStartDate',
        'eventTicketWaves.qrAvailabilityTiming',
      ])
      .where('listingTickets.soldAt', 'is not', null) // Sold tickets only
      .where('listingTickets.deletedAt', 'is', null)
      .where('listingTickets.cancelledAt', 'is', null)
      .where('listings.deletedAt', 'is', null)
      .where('ticketDocuments.id', 'is', null) // No documents yet
      .where('eventTicketWaves.qrAvailabilityTiming', 'is not', null) // Has timing restriction
      .where('events.eventStartDate', 'is not', null)
      .where('events.eventStartDate', '>', now) // Event hasn't started yet
      .execute()
      .then(tickets => {
        // Filter tickets that are at QR availability time OR at milestone times
        return tickets.filter(ticket => {
          if (!ticket.qrAvailabilityTiming || !ticket.eventStartDate) {
            return false;
          }

          // Parse hours from timing (e.g., "12h" -> 12)
          const qrAvailabilityHours = parseInt(
            ticket.qrAvailabilityTiming.replace('h', ''),
            10,
          );

          if (isNaN(qrAvailabilityHours)) {
            return false;
          }

          const eventStartDate = new Date(ticket.eventStartDate);
          const hoursUntilEvent = Math.ceil(
            (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60),
          );

          // Check if we're at QR availability time (±30 minutes)
          const qrAvailableAt = new Date(eventStartDate);
          qrAvailableAt.setHours(qrAvailableAt.getHours() - qrAvailabilityHours);

          const qrWindowStart = new Date(qrAvailableAt);
          qrWindowStart.setMinutes(qrWindowStart.getMinutes() - 30);

          const qrWindowEnd = new Date(qrAvailableAt);
          qrWindowEnd.setMinutes(qrWindowEnd.getMinutes() + 30);

          const atQrAvailability =
            now >= qrWindowStart && now <= qrWindowEnd;

          if (atQrAvailability) {
            return true;
          }

          // Check if we're at any milestone time (±30 minutes)
          // Only consider milestones that are after QR availability time
          for (const milestone of MILESTONE_THRESHOLDS) {
            if (milestone > qrAvailabilityHours) {
              continue; // Skip milestones before QR availability
            }

            const milestoneWindowStart = milestone - 0.5;
            const milestoneWindowEnd = milestone + 0.5;

            if (
              hoursUntilEvent >= milestoneWindowStart &&
              hoursUntilEvent <= milestoneWindowEnd
            ) {
              return true;
            }
          }

          return false;
        });
      });
  }
}
