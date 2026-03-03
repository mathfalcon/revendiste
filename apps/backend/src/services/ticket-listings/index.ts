import {
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  ListingTicketsRepository,
  OrdersRepository,
  UsersRepository,
} from '~/repositories';
import { logger } from '~/utils';
import { NotFoundError, ValidationError, UnauthorizedError } from '~/errors';
import { CreateTicketListingRouteBody } from '~/controllers/ticket-listings/validation';
import { canUploadDocumentForPlatform } from './platform-helpers';
import {
  TICKET_LISTING_ERROR_MESSAGES,
  IDENTITY_VERIFICATION_ERROR_MESSAGES,
} from '~/constants/error-messages';
import { NotificationService } from '~/services/notifications';
import {
  notifySellerTicketSold,
  notifyDocumentReminder,
} from '~/services/notifications/helpers';
import {
  parseQrAvailabilityTiming,
  calculateHoursUntilEvent,
  isWithinUploadWindow,
  calculateMaxResalePrice,
} from '@revendiste/shared';
import type {Kysely} from 'kysely';
import type {DB, QrAvailabilityTiming} from '@revendiste/shared';

export interface SellerNotificationData {
  sellerUserId: string;
  listingId: string;
  eventName: string;
  eventStartDate: Date;
  eventEndDate: Date;
  platform: string;
  qrAvailabilityTiming: QrAvailabilityTiming | null;
  ticketCount: number;
}
import type {PaginationOptions} from '~/types/pagination';
import {createPaginatedResponse} from '~/middleware/pagination';

export class TicketListingsService {
  constructor(
    private readonly ticketListingsRepository: TicketListingsRepository,
    private readonly eventsRepository: EventsRepository,
    private readonly eventTicketWavesRepository: EventTicketWavesRepository,
    private readonly listingTicketsRepository: ListingTicketsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationService: NotificationService,
  ) { }

  async createTicketListing(
    data: CreateTicketListingRouteBody,
    publisherUserId: string,
  ) {
    // Check if user is verified
    const user = await this.usersRepository.getById(publisherUserId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check verification status
    if (!user.documentVerified) {
      if (user.verificationStatus === 'requires_manual_review') {
        throw new ValidationError(
          IDENTITY_VERIFICATION_ERROR_MESSAGES.VERIFICATION_IN_MANUAL_REVIEW,
        );
      } else if (user.verificationStatus === 'failed') {
        throw new ValidationError(
          IDENTITY_VERIFICATION_ERROR_MESSAGES.VERIFICATION_FAILED,
        );
      } else {
        throw new ValidationError(
          IDENTITY_VERIFICATION_ERROR_MESSAGES.VERIFICATION_REQUIRED,
        );
      }
    }

    // Validate that the event exists and hasn't finished
    const event = await this.eventsRepository.getById(data.eventId);
    if (!event) {
      throw new NotFoundError(TICKET_LISTING_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    if (new Date() > event.eventEndDate) {
      throw new ValidationError(TICKET_LISTING_ERROR_MESSAGES.EVENT_FINISHED);
    }

    // Validate that the ticket wave exists and belongs to the event
    const ticketWave = await this.eventTicketWavesRepository.getById(
      data.ticketWaveId,
    );

    if (!ticketWave) {
      throw new NotFoundError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_WAVE_NOT_FOUND,
      );
    }

    if (ticketWave.eventId !== data.eventId) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_WAVE_INVALID_EVENT,
      );
    }

    // Validate price doesn't exceed max resale price (115% of face value)
    const maxResalePrice = calculateMaxResalePrice(Number(ticketWave.faceValue));
    if (data.price > maxResalePrice) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.PRICE_EXCEEDS_MAX_RESALE(
          maxResalePrice,
          ticketWave.currency,
        ),
      );
    }

    // Validate quantity is positive
    if (data.quantity <= 0) {
      throw new ValidationError(TICKET_LISTING_ERROR_MESSAGES.INVALID_QUANTITY);
    }

    // Create multiple listings in a single batch operation (already atomic)
    const createdListings = await this.ticketListingsRepository.createBatch({
      publisherUserId: publisherUserId,
      ...data,
    });

    logger.info(
      `Created ${data.quantity} ticket listings for user ${publisherUserId} on event ${data.eventId}`,
    );

    // Check if we should send immediate document upload reminder
    // Uses shared utility to determine if within upload window
    const shouldSendImmediateReminder = isWithinUploadWindow(
      event.eventStartDate,
      event.eventEndDate,
      event.qrAvailabilityTiming,
    );

    if (shouldSendImmediateReminder) {
      const ticketCount = createdListings.listingTickets.length;
      const hoursUntilEvent = calculateHoursUntilEvent(event.eventStartDate);

      // Send notification (fire-and-forget, don't block the response)
      notifyDocumentReminder(this.notificationService, {
        sellerUserId: publisherUserId,
        listingId: createdListings.id,
        eventName: event.name,
        eventStartDate: event.eventStartDate,
        ticketCount,
        hoursUntilEvent: Math.max(0, Math.ceil(hoursUntilEvent)),
      }).catch(error => {
        logger.error('Failed to send immediate document reminder notification', {
          publisherUserId,
          listingId: createdListings.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      logger.info('Sent immediate document upload reminder', {
        publisherUserId,
        listingId: createdListings.id,
        hoursUntilEvent: Math.round(hoursUntilEvent),
      });
    }

    return createdListings;
  }

  async getUserListingsWithTickets(
    userId: string,
    pagination: PaginationOptions,
  ) {
    const [listings, total] = await Promise.all([
      this.ticketListingsRepository.getListingsWithTicketsByUserId(userId, {
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.ticketListingsRepository.getListingsWithTicketsByUserIdCount(userId),
    ]);

    logger.info(`Retrieved ${listings.length} listings for user ${userId}`);

    // Enrich each ticket with upload availability based on QR availability timing
    const enrichedListings = listings.map(listing => {
      const eventStartDate = new Date(listing.event.eventStartDate);
      const eventEndDate = new Date(listing.event.eventEndDate);
      const platform = listing.event.platform;
      const qrAvailabilityTiming = listing.event.qrAvailabilityTiming || null;

      const enrichedTickets = listing.tickets.map(ticket => {
        const hasDocument = !!ticket.document;
        const uploadAvailability = canUploadDocumentForPlatform(
          platform,
          eventStartDate,
          eventEndDate,
          hasDocument,
          qrAvailabilityTiming,
        );

        return {
          ...ticket,
          hasDocument,
          canUploadDocument: uploadAvailability.canUpload,
          uploadUnavailableReason: uploadAvailability.reason,
          uploadAvailableAt: uploadAvailability.uploadAvailableAt?.toISOString(),
        };
      });

      return {
        ...listing,
        tickets: enrichedTickets,
      };
    });

    return createPaginatedResponse(enrichedListings, total, pagination);
  }

  /**
   * Update ticket price
   * Only active tickets (not reserved, sold, or cancelled) can be updated
   */
  async updateTicketPrice(ticketId: string, price: number, userId: string) {
    // Get ticket with full information including reservation status
    const ticket = await this.listingTicketsRepository.getTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_NOT_FOUND,
      );
    }

    // Validate ticket belongs to user
    if (ticket.publisherUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_LISTING_ERROR_MESSAGES.UNAUTHORIZED_TICKET_ACCESS,
      );
    }

    // Validate event hasn't ended
    if (new Date() > ticket.eventEndDate) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.EVENT_FINISHED_FOR_UPDATE,
      );
    }

    // Check if ticket is active (not sold, cancelled, or reserved)
    const ticketWithReservation =
      await this.listingTicketsRepository.getTicketWithReservationStatus(
        ticketId,
      );

    if (!ticketWithReservation) {
      throw new NotFoundError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_NOT_FOUND,
      );
    }

    // Check specific states and throw specific errors
    if (ticketWithReservation.soldAt !== null) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_SOLD,
      );
    }

    // Check if ticket is deleted (cancelled)
    if (ticketWithReservation.deletedAt !== null) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_DELETED,
      );
    }

    if (ticketWithReservation.reservationId !== null) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_RESERVED,
      );
    }

    // Validate price > 0
    if (price <= 0) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.INVALID_QUANTITY,
      );
    }

    // Validate price doesn't exceed max resale price (115% of face value)
    const maxResalePrice = calculateMaxResalePrice(Number(ticket.faceValue));
    if (price > maxResalePrice) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.PRICE_EXCEEDS_MAX_RESALE(
          maxResalePrice,
          ticket.currency,
        ),
      );
    }

    // Update ticket price
    const updatedTicket =
      await this.listingTicketsRepository.updateTicketPrice(ticketId, price);

    logger.info(`Updated ticket ${ticketId} price to ${price}`, {
      ticketId,
      userId,
      newPrice: price,
    });

    return updatedTicket;
  }

  /**
   * Remove (soft delete) a ticket
   * Only active tickets (not reserved, sold, or cancelled) can be removed
   */
  async removeTicket(ticketId: string, userId: string) {
    // Get ticket with full information
    const ticket = await this.listingTicketsRepository.getTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_NOT_FOUND,
      );
    }

    // Validate ticket belongs to user
    if (ticket.publisherUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_LISTING_ERROR_MESSAGES.UNAUTHORIZED_TICKET_ACCESS,
      );
    }

    // Validate event hasn't ended
    if (new Date() > ticket.eventEndDate) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.EVENT_FINISHED_FOR_UPDATE,
      );
    }

    // Check if ticket is active (not sold, cancelled, or reserved)
    const ticketWithReservation =
      await this.listingTicketsRepository.getTicketWithReservationStatus(
        ticketId,
      );

    if (!ticketWithReservation) {
      throw new NotFoundError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_NOT_FOUND,
      );
    }

    // Check specific states and throw specific errors
    if (ticketWithReservation.soldAt !== null) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_SOLD,
      );
    }

    // Check if ticket is already deleted (cancelled)
    if (ticketWithReservation.deletedAt !== null) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_DELETED,
      );
    }

    if (ticketWithReservation.reservationId !== null) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.TICKET_RESERVED,
      );
    }

    // Soft delete ticket (marks as cancelled)
    const deletedTicket =
      await this.listingTicketsRepository.softDeleteTicket(ticketId);

    logger.info(`Removed ticket ${ticketId}`, {
      ticketId,
      userId,
    });

    return deletedTicket;
  }

  /**
   * Mark tickets as sold and return seller notification data.
   * Caller is responsible for sending in_app notifications and enqueueing email jobs.
   * When trx is provided, all DB operations use the transaction.
   */
  async markTicketsAsSoldAndReturnSellerData(
    orderId: string,
    trx?: Kysely<DB>,
  ): Promise<{
    soldTickets: Array<{listingId: string}>;
    sellerNotifications: SellerNotificationData[];
  }> {
    const listingTicketsRepo = trx
      ? this.listingTicketsRepository.withTransaction(trx)
      : this.listingTicketsRepository;
    const ordersRepo = trx
      ? this.ordersRepository.withTransaction(trx)
      : this.ordersRepository;

    const soldTickets =
      await listingTicketsRepo.markTicketsAsSoldByOrderId(orderId);

    if (soldTickets.length === 0) {
      logger.warn('No tickets found to mark as sold', { orderId });
      return { soldTickets, sellerNotifications: [] };
    }

    const uniqueListingIds = [
      ...new Set(soldTickets.map(ticket => ticket.listingId)),
    ];

    const order = await ordersRepo.getByIdWithItems(orderId);
    if (!order || !order.event) {
      logger.warn('Order or event not found for seller notifications', {
        orderId,
      });
      return { soldTickets, sellerNotifications: [] };
    }

    const listings = await listingTicketsRepo.getListingsByIds(
      uniqueListingIds,
    );

    const ticketsByListing = new Map<string, number>();
    for (const ticket of soldTickets) {
      ticketsByListing.set(
        ticket.listingId,
        (ticketsByListing.get(ticket.listingId) || 0) + 1,
      );
    }

    const sellerCountMap = new Map<string, number>();
    for (const listing of listings) {
      const ticketCount = ticketsByListing.get(listing.id) || 0;
      if (ticketCount === 0) continue;
      const current = sellerCountMap.get(listing.publisherUserId) || 0;
      sellerCountMap.set(listing.publisherUserId, current + ticketCount);
    }

    const qrAvailabilityTiming = order.event.qrAvailabilityTiming ?? null;
    const sellerNotifications: SellerNotificationData[] = [];

    for (const [sellerUserId, totalTicketCount] of sellerCountMap) {
      const firstListing = listings.find(
        l => l.publisherUserId === sellerUserId,
      );
      if (
        firstListing &&
        order.event.name &&
        order.event.eventStartDate &&
        order.event.eventEndDate
      ) {
        sellerNotifications.push({
          sellerUserId,
          listingId: firstListing.id,
          eventName: order.event.name,
          eventStartDate: new Date(order.event.eventStartDate),
          eventEndDate: new Date(order.event.eventEndDate),
          platform: order.event.platform ?? 'unknown',
          qrAvailabilityTiming,
          ticketCount: totalTicketCount,
        });
      }
    }

    return { soldTickets, sellerNotifications };
  }

  /**
   * Mark tickets as sold and send notifications to sellers (legacy).
   * Prefer markTicketsAsSoldAndReturnSellerData + caller sending in_app and enqueueing emails.
   */
  async markTicketsAsSoldAndNotifySeller(
    orderId: string,
    trx?: Kysely<DB>,
  ) {
    const { soldTickets, sellerNotifications } =
      await this.markTicketsAsSoldAndReturnSellerData(orderId, trx);

    for (const seller of sellerNotifications) {
      notifySellerTicketSold(this.notificationService, {
        sellerUserId: seller.sellerUserId,
        listingId: seller.listingId,
        eventName: seller.eventName,
        eventStartDate: seller.eventStartDate,
        eventEndDate: seller.eventEndDate,
        platform: seller.platform,
        qrAvailabilityTiming: seller.qrAvailabilityTiming,
        ticketCount: seller.ticketCount,
      }).catch((error: unknown) => {
        logger.error('Failed to send seller notification', {
          sellerUserId: seller.sellerUserId,
          orderId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    return soldTickets;
  }
}
