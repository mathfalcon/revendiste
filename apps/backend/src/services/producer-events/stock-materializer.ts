import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {OFFICIAL_WAVE_ERROR_MESSAGES} from '~/constants/error-messages';
import {ValidationError} from '~/errors';
import {
  EventTicketWaveConfigsRepository,
  EventTicketWavesRepository,
  EventsRepository,
  ListingTicketsRepository,
  TicketListingsRepository,
} from '~/repositories';

export class OfficialWaveStockMaterializer {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventTicketWavesRepository: EventTicketWavesRepository,
    private readonly eventTicketWaveConfigsRepository: EventTicketWaveConfigsRepository,
    private readonly ticketListingsRepository: TicketListingsRepository,
    private readonly listingTicketsRepository: ListingTicketsRepository,
  ) {}

  withTransaction(trx: Kysely<DB>) {
    return new OfficialWaveStockMaterializer(
      this.eventsRepository.withTransaction(trx),
      this.eventTicketWavesRepository.withTransaction(trx),
      this.eventTicketWaveConfigsRepository.withTransaction(trx),
      this.ticketListingsRepository.withTransaction(trx),
      this.listingTicketsRepository.withTransaction(trx),
    );
  }

  async materializePublishedEventWaves(eventId: string) {
    const configs = await this.eventTicketWaveConfigsRepository.listByEventId(eventId);

    for (const config of configs) {
      await this.materializeWaveStock(eventId, config.eventTicketWaveId);
    }
  }

  async materializeWaveStock(eventId: string, waveId: string) {
    return await this.eventsRepository.executeTransaction(async trx => {
      const scoped = this.withTransaction(trx);
      return await scoped.materializeWaveStockWithTransaction(eventId, waveId);
    });
  }

  private async materializeWaveStockWithTransaction(
    eventId: string,
    waveId: string,
  ) {
    const event = await this.eventsRepository.getLifecycleEventById(eventId);
    if (!event?.isOfficial) {
      throw new ValidationError(OFFICIAL_WAVE_ERROR_MESSAGES.EVENT_NOT_OFFICIAL);
    }

    if (!event.eventProducerId) {
      throw new ValidationError(
        OFFICIAL_WAVE_ERROR_MESSAGES.EVENT_PRODUCER_REQUIRED,
      );
    }

    const wave = await this.eventTicketWavesRepository.getById(waveId);
    if (!wave || wave.eventId !== eventId) {
      throw new ValidationError(OFFICIAL_WAVE_ERROR_MESSAGES.WAVE_NOT_FOUND);
    }

    const config =
      await this.eventTicketWaveConfigsRepository.getByWaveIdForUpdate(waveId);
    if (!config) {
      throw new ValidationError(OFFICIAL_WAVE_ERROR_MESSAGES.CONFIG_NOT_FOUND);
    }

    let houseListingId = config.houseListingId;

    if (!houseListingId) {
      const houseListing = await this.ticketListingsRepository.createHouseListing(
        waveId,
        event.eventProducerId,
      );
      houseListingId = houseListing.id;
      await this.eventTicketWaveConfigsRepository.setHouseListingId(
        waveId,
        houseListing.id,
      );
    }

    const currentStock =
      await this.listingTicketsRepository.countByListingId(houseListingId);
    const missingStock = config.stock - currentStock;

    if (missingStock > 0) {
      await this.listingTicketsRepository.insertTicketsForListing(
        houseListingId,
        currentStock + 1,
        missingStock,
        Number(wave.faceValue),
      );
    }

    return await this.eventTicketWaveConfigsRepository.getByWaveId(waveId);
  }
}
