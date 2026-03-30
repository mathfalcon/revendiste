import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import type {EventImageType} from '@revendiste/shared';
import {EventsRepository, EventTicketWavesRepository} from '~/repositories';
import {NotFoundError, ValidationError, BadRequestError} from '~/errors';
import {
  ADMIN_EVENTS_ERROR_MESSAGES,
  EVENT_ERROR_MESSAGES,
} from '~/constants/error-messages';
import {EventImageService} from '~/services/scraping/image-service';
import {getStorageProvider} from '~/services';
import {logger} from '~/utils';
import type {PaginationOptions} from '~/types/pagination';

interface GetEventsFilters {
  includePast?: boolean;
  search?: string;
  status?: 'active' | 'inactive';
}

interface UpdateEventData {
  name?: string;
  description?: string | null;
  eventStartDate?: string;
  eventEndDate?: string;
  // Note: Venue is now managed via eventVenues table
  externalUrl?: string | null;
  qrAvailabilityTiming?: '3h' | '6h' | '12h' | '24h' | '48h' | '72h' | null;
  status?: 'active' | 'inactive';
}

interface CreateTicketWaveData {
  name: string;
  description?: string | null;
  faceValue: number;
  currency: 'UYU' | 'USD';
  isSoldOut: boolean;
  isAvailable: boolean;
  externalId?: string | null;
}

interface UpdateTicketWaveData {
  name?: string;
  description?: string | null;
  faceValue?: number;
  currency?: 'UYU' | 'USD';
  isSoldOut?: boolean;
  isAvailable?: boolean;
}

export class AdminEventsService {
  private eventsRepository: EventsRepository;
  private ticketWavesRepository: EventTicketWavesRepository;
  private imageService: EventImageService;
  private storageProvider: ReturnType<typeof getStorageProvider>;

  constructor(
    eventsRepository: EventsRepository,
    ticketWavesRepository: EventTicketWavesRepository,
    private db: Kysely<DB>,
  ) {
    this.eventsRepository = eventsRepository;
    this.ticketWavesRepository = ticketWavesRepository;
    this.imageService = new EventImageService();
    this.storageProvider = getStorageProvider();
  }

  // ============================================================================
  // Events
  // ============================================================================

  async getEvents(pagination: PaginationOptions, filters: GetEventsFilters) {
    return this.eventsRepository.findAllForAdmin(pagination, {
      includePast: filters.includePast,
      search: filters.search,
      status: filters.status,
    });
  }

  async getEventDetails(eventId: string) {
    const event = await this.eventsRepository.getByIdForAdmin(eventId);
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return event;
  }

  async updateEvent(eventId: string, data: UpdateEventData) {
    // Convert string dates to Date objects
    const updateData: Parameters<EventsRepository['updateEvent']>[1] = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.eventStartDate !== undefined)
      updateData.eventStartDate = new Date(data.eventStartDate);
    if (data.eventEndDate !== undefined)
      updateData.eventEndDate = new Date(data.eventEndDate);
    // Note: Venue is now managed via eventVenues table (venueId)
    // Updating venue directly on events is no longer supported
    if (data.externalUrl !== undefined)
      updateData.externalUrl = data.externalUrl ?? undefined;
    if (data.qrAvailabilityTiming !== undefined)
      updateData.qrAvailabilityTiming = data.qrAvailabilityTiming;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await this.eventsRepository.updateEvent(
      eventId,
      updateData,
    );
    if (!updated) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return updated;
  }

  async deleteEvent(eventId: string) {
    const deleted = await this.eventsRepository.softDeleteEvent(eventId);
    if (!deleted) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return deleted;
  }

  // ============================================================================
  // Ticket Waves
  // ============================================================================

  async createTicketWave(eventId: string, data: CreateTicketWaveData) {
    // Verify event exists
    const event = await this.eventsRepository.getByIdForAdmin(eventId);
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    return this.ticketWavesRepository.create(eventId, {
      name: data.name,
      description: data.description,
      faceValue: data.faceValue,
      currency: data.currency,
      isSoldOut: data.isSoldOut,
      isAvailable: data.isAvailable,
      externalId: data.externalId ?? undefined,
    });
  }

  async updateTicketWave(
    eventId: string,
    waveId: string,
    data: UpdateTicketWaveData,
  ) {
    // Verify the ticket wave belongs to the event
    const wave = await this.ticketWavesRepository.getById(waveId);
    if (!wave || wave.eventId !== eventId) {
      throw new NotFoundError(ADMIN_EVENTS_ERROR_MESSAGES.TICKET_WAVE_NOT_FOUND);
    }

    return this.ticketWavesRepository.update(waveId, data);
  }

  async deleteTicketWave(eventId: string, waveId: string) {
    // Verify the ticket wave belongs to the event
    const wave = await this.ticketWavesRepository.getById(waveId);
    if (!wave || wave.eventId !== eventId) {
      throw new NotFoundError(ADMIN_EVENTS_ERROR_MESSAGES.TICKET_WAVE_NOT_FOUND);
    }

    return this.ticketWavesRepository.softDelete(waveId);
  }

  // ============================================================================
  // Event Images
  // ============================================================================

  async uploadEventImage(
    eventId: string,
    file: Express.Multer.File,
    imageType: 'flyer' | 'hero',
  ) {
    if (!file) {
      throw new BadRequestError(ADMIN_EVENTS_ERROR_MESSAGES.NO_FILE_UPLOADED);
    }

    // Verify event exists
    const existingEvent = await this.eventsRepository.getByIdForAdmin(eventId);
    if (!existingEvent) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    // Validate image type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ValidationError(
        ADMIN_EVENTS_ERROR_MESSAGES.INVALID_IMAGE_FILE_TYPE,
      );
    }

    try {
      // Upload to storage
      const directory = `public/assets/events/${eventId}`;
      const filename = `${imageType}-${Date.now()}`;

      const uploadResult = await this.storageProvider.upload(file.buffer, {
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        directory,
        filename,
      });

      // Update database
      await this.eventsRepository.updateEventImages(eventId, [
        {type: imageType as EventImageType, url: uploadResult.url},
      ]);

      // Get the updated event to return the image with its ID
      const updatedEvent =
        await this.eventsRepository.getByIdForAdmin(eventId);
      if (!updatedEvent) {
        throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
      }
      const uploadedImage = updatedEvent.images.find(
        img => img.imageType === imageType,
      );

      return {
        id: uploadedImage?.id || '',
        url: uploadResult.url,
        imageType,
      };
    } catch (error) {
      logger.error('Failed to upload event image', {error, eventId, imageType});
      throw new BadRequestError(ADMIN_EVENTS_ERROR_MESSAGES.IMAGE_UPLOAD_ERROR);
    }
  }

  async deleteEventImage(eventId: string, imageId: string) {
    // Get the image to verify it belongs to the event
    const event = await this.eventsRepository.getByIdForAdmin(eventId);
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    const image = event.images.find(img => img.id === imageId);

    if (!image) {
      throw new NotFoundError(ADMIN_EVENTS_ERROR_MESSAGES.IMAGE_NOT_FOUND);
    }

    // Soft delete the image
    await this.db
      .updateTable('eventImages')
      .set({
        deletedAt: new Date(),
      })
      .where('id', '=', imageId)
      .execute();

    return {success: true};
  }
}
