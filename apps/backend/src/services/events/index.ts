import {EventsRepository} from '~/repositories';
import {WithPagination} from '~/types';
import {ScrapedEventData} from '../scraping';

export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getAllEventsPaginated(args: WithPagination<{}>) {
    return this.eventsRepository.findAllPaginatedWithImages(args.pagination);
  }

  async storeScrapedEvents(events: ScrapedEventData[]) {
    if (events.length === 0) {
      return [];
    }

    // Use the repository's batch method that handles transactions for each event
    return await this.eventsRepository.upsertEventsBatch(events);
  }
}
