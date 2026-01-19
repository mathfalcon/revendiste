import {Kysely} from 'kysely';
import {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';
import {
  shouldSendDocumentReminder,
  parseQrAvailabilityTiming,
  calculateHoursUntilEvent,
} from '~/utils/document-reminder';

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
        'listingTickets.deletedAt',
        'listings.publisherUserId',
        'eventTicketWaves.name as ticketWaveName',
        'eventTicketWaves.faceValue',
        'eventTicketWaves.currency',
        'eventTicketWaves.eventId',
        'events.name as eventName',
        'events.eventStartDate',
        'events.eventEndDate',
        'events.qrAvailabilityTiming',
      ])
      .where('listingTickets.id', '=', ticketId)
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
   * Get sold tickets that need document upload reminders.
   *
   * Returns tickets that:
   * - Are sold and don't have documents yet
   * - Event hasn't started yet
   * - Are at a milestone time (72h, 48h, 24h, 12h, 6h, 3h, 2h, 1h ±30min before event)
   *
   * For events WITH qrAvailabilityTiming:
   * - Only include if we're within the QR availability window (milestone <= qrAvailabilityHours)
   *
   * For events WITHOUT qrAvailabilityTiming:
   * - Include at any milestone time
   */
  async getTicketsEnteringUploadWindow() {
    const now = new Date();

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
        'events.qrAvailabilityTiming',
      ])
      .where('listingTickets.soldAt', 'is not', null) // Sold tickets only
      .where('listingTickets.deletedAt', 'is', null)
      .where('listings.deletedAt', 'is', null)
      .where('ticketDocuments.id', 'is', null) // No documents yet
      .where('events.eventStartDate', 'is not', null)
      .where('events.eventStartDate', '>', now) // Event hasn't started yet
      .execute()
      .then(tickets => {
        // Filter tickets that are at milestone times using utility functions
        return tickets.filter(ticket => {
          if (!ticket.eventStartDate) {
            return false;
          }

          const eventStartDate = new Date(ticket.eventStartDate);
          const hoursUntilEvent = calculateHoursUntilEvent(eventStartDate, now);
          const qrAvailabilityHours = parseQrAvailabilityTiming(
            ticket.qrAvailabilityTiming,
          );

          return shouldSendDocumentReminder(
            hoursUntilEvent,
            qrAvailabilityHours,
          );
        });
      });
  }

  /**
   * Get sold tickets without documents for a specific user
   * Used by TicketDocumentService.getTicketsRequiringUpload
   */
  async getUserTicketsRequiringUpload(userId: string, ticketIds: string[]) {
    if (ticketIds.length === 0) {
      return [];
    }

    return await this.db
      .selectFrom('listingTickets as lt')
      .leftJoin('listings as tl', 'tl.id', 'lt.listingId')
      .leftJoin('eventTicketWaves as etw', 'etw.id', 'tl.ticketWaveId')
      .leftJoin('events as e', 'e.id', 'etw.eventId')
      .select([
        'lt.id',
        'lt.listingId',
        'lt.ticketNumber',
        'lt.soldAt',
        'e.name as eventName',
        'e.eventStartDate',
        'etw.name as ticketWaveName',
      ])
      .where('lt.id', 'in', ticketIds)
      .where('tl.publisherUserId', '=', userId)
      .where('lt.deletedAt', 'is', null)
      .where('tl.deletedAt', 'is', null)
      .execute();
  }

}
