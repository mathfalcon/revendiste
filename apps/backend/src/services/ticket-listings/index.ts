import {
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
} from '~/repositories';
import {logger} from '~/utils';
import {NotFoundError, ValidationError} from '~/errors';
import {CreateTicketListingRouteBody} from '~/controllers/ticket-listings/validation';
import {canUploadDocumentForPlatform} from './platform-helpers';
import {TICKET_LISTING_ERROR_MESSAGES} from '~/constants/error-messages';

export class TicketListingsService {
  constructor(
    private readonly ticketListingsRepository: TicketListingsRepository,
    private readonly eventsRepository: EventsRepository,
    private readonly eventTicketWavesRepository: EventTicketWavesRepository,
  ) {}

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
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.EVENT_FINISHED,
      );
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
      throw new ValidationError(
        TICKET_LISTING_ERROR_MESSAGES.INVALID_QUANTITY,
      );
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
}
