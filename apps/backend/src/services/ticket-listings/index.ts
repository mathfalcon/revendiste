import {
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
} from '~/repositories';
import {logger} from '~/utils';
import {NotFoundError, ValidationError} from '~/errors';
import {CreateTicketListingRouteBody} from '~/controllers/ticket-listings/validation';

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
      throw new NotFoundError('Event not found');
    }

    if (new Date() > event.eventEndDate) {
      throw new ValidationError(
        'Cannot create listing for an event that has already finished',
      );
    }

    // Validate that the ticket wave exists and belongs to the event
    const ticketWave = await this.eventTicketWavesRepository.getById(
      data.ticketWaveId,
    );

    if (!ticketWave) {
      throw new NotFoundError('Ticket wave not found');
    }

    if (ticketWave.eventId !== data.eventId) {
      throw new ValidationError(
        'Ticket wave does not belong to the specified event',
      );
    }

    // Validate price doesn't exceed face value
    if (data.price > Number(ticketWave.faceValue)) {
      throw new ValidationError(
        `Price cannot exceed face value of ${ticketWave.faceValue} ${ticketWave.currency}`,
      );
    }

    // Validate quantity is positive
    if (data.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
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
}
