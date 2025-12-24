import {
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  ListingTicketsRepository,
  OrdersRepository,
  UsersRepository,
} from '~/repositories';
import {logger} from '~/utils';
import {NotFoundError, ValidationError} from '~/errors';
import {CreateTicketListingRouteBody} from '~/controllers/ticket-listings/validation';
import {canUploadDocumentForPlatform} from './platform-helpers';
import {TICKET_LISTING_ERROR_MESSAGES} from '~/constants/error-messages';
import {NotificationService} from '~/services/notifications';
import {notifySellerTicketSold} from '~/services/notifications/helpers';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';

export class TicketListingsService {
  private notificationService: NotificationService;

  constructor(
    private readonly ticketListingsRepository: TicketListingsRepository,
    private readonly eventsRepository: EventsRepository,
    private readonly eventTicketWavesRepository: EventTicketWavesRepository,
    private readonly listingTicketsRepository: ListingTicketsRepository,
    private readonly ordersRepository: OrdersRepository,
    db: Kysely<DB>,
  ) {
    this.notificationService = new NotificationService(
      db,
      new UsersRepository(db),
    );
  }

  async createTicketListing(
    data: CreateTicketListingRouteBody,
    publisherUserId: string,
  ) {
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

    // Validate price doesn't exceed face value
    if (data.price > Number(ticketWave.faceValue)) {
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.PRICE_EXCEEDS_FACE_VALUE(
          String(ticketWave.faceValue),
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

    return createdListings;
  }

  async getUserListingsWithTickets(userId: string) {
    const listings =
      await this.ticketListingsRepository.getListingsWithTicketsByUserId(
        userId,
      );

    logger.info(`Retrieved ${listings.length} listings for user ${userId}`);

    // Enrich each ticket with upload availability based on platform rules
    const enrichedListings = listings.map(listing => {
      const eventStartDate = new Date(listing.event.eventStartDate);
      const eventEndDate = new Date(listing.event.eventEndDate);
      const platform = listing.event.platform;

      const enrichedTickets = listing.tickets.map(ticket => {
        const hasDocument = !!ticket.document;
        const uploadAvailability = canUploadDocumentForPlatform(
          platform,
          eventStartDate,
          eventEndDate,
          hasDocument,
        );

        return {
          ...ticket,
          hasDocument,
          canUploadDocument: uploadAvailability.canUpload,
          uploadUnavailableReason: uploadAvailability.reason,
        };
      });

      return {
        ...listing,
        tickets: enrichedTickets,
      };
    });

    return enrichedListings;
  }

  /**
   * Mark tickets as sold for an order and send notifications to sellers
   * This orchestrates the repository call and notification side effects
   */
  async markTicketsAsSoldAndNotifySeller(orderId: string) {
    // Mark tickets as sold (repository operation)
    const soldTickets =
      await this.listingTicketsRepository.markTicketsAsSoldByOrderId(orderId);

    if (soldTickets.length === 0) {
      logger.warn('No tickets found to mark as sold', {orderId});
      return soldTickets;
    }

    // Get unique listing IDs from sold tickets
    const uniqueListingIds = [
      ...new Set(soldTickets.map(ticket => ticket.listingId)),
    ];

    // Get order with event info for notifications (outside transaction)
    const order = await this.ordersRepository.getByIdWithItems(orderId);
    if (!order || !order.event) {
      logger.warn('Order or event not found for seller notifications', {
        orderId,
      });
      return soldTickets;
    }

    // Get listings with seller info
    const listings = await this.listingTicketsRepository.getListingsByIds(
      uniqueListingIds,
    );

    // Group tickets by listing to count per listing
    const ticketsByListing = new Map<string, number>();
    for (const ticket of soldTickets) {
      ticketsByListing.set(
        ticket.listingId,
        (ticketsByListing.get(ticket.listingId) || 0) + 1,
      );
    }

    // Get event ticket waves to get qrAvailabilityTiming
    const ticketWaves = await Promise.all(
      order.items
        .filter(item => item.ticketWaveId)
        .map(item =>
          this.eventTicketWavesRepository.getById(item.ticketWaveId!),
        ),
    );

    // Send notification to each seller (grouped by listing)
    const sellerNotifications = new Map<string, number>(); // sellerId -> total tickets sold

    for (const listing of listings) {
      const ticketCount = ticketsByListing.get(listing.id) || 0;
      if (ticketCount === 0) continue;

      const currentCount =
        sellerNotifications.get(listing.publisherUserId) || 0;
      sellerNotifications.set(
        listing.publisherUserId,
        currentCount + ticketCount,
      );
    }

    // Send one notification per seller with total ticket count
    // Use the first ticket wave's qrAvailabilityTiming (they should all be from same event)
    const qrAvailabilityTiming =
      ticketWaves.length > 0 && ticketWaves[0]
        ? ticketWaves[0].qrAvailabilityTiming
        : null;

    for (const [sellerUserId, totalTicketCount] of sellerNotifications) {
      // Use the first listing ID for the upload link (they're all from the same seller)
      const firstListingId = listings.find(
        l => l.publisherUserId === sellerUserId,
      )?.id;

      if (
        firstListingId &&
        order.event.name &&
        order.event.eventStartDate &&
        order.event.eventEndDate
      ) {
        notifySellerTicketSold(this.notificationService, {
          sellerUserId,
          listingId: firstListingId,
          eventName: order.event.name,
          eventStartDate: new Date(order.event.eventStartDate),
          eventEndDate: new Date(order.event.eventEndDate),
          platform:
            (order.event as {platform?: string | null}).platform || 'unknown',
          qrAvailabilityTiming,
          ticketCount: totalTicketCount,
        }).catch((error: unknown) => {
          console.error('Failed to send seller notification', error);
          logger.error('Failed to send seller notification', {
            sellerUserId,
            orderId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    }

    return soldTickets;
  }
}
