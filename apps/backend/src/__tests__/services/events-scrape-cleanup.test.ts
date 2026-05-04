/**
 * EventsService scrape cleanup: guest-list deletes vs stale cleanup (past eventEndDate only).
 */
import {EventsService} from '~/services/events';
import type {EventsRepository} from '~/repositories';
import type {ScrapedEventData} from '~/services/scraping';
import {Platform} from '~/services/scraping';

function stubScraped(
  partial: Partial<ScrapedEventData> & {externalId: string},
): ScrapedEventData {
  return {
    name: 'Test',
    description: '',
    eventStartDate: new Date(),
    eventEndDate: new Date(Date.now() + 86400000),
    scrapedVenueAddress: '',
    externalUrl: 'https://example.com/e',
    images: [],
    ticketWaves: [],
    platform: Platform.Entraste,
    ...partial,
  } as ScrapedEventData;
}

describe('EventsService scrape cleanup', () => {
  let service: EventsService;
  let mockEventsRepository: jest.Mocked<EventsRepository>;

  beforeEach(() => {
    mockEventsRepository = {
      softDeleteEventsByExternalIds: jest.fn(),
      softDeleteEventsNotInScrapedResultsForPlatform: jest.fn(),
      softDeleteRelatedTicketWaves: jest.fn(),
      getActiveEventCountByPlatform: jest.fn(),
      getAllActiveEventExternalIdsForPlatform: jest.fn(),
    } as unknown as jest.Mocked<EventsRepository>;

    service = new EventsService(mockEventsRepository);
  });

  describe('softDeleteGuestListScrapedEvents', () => {
    it('does not call repository when externalIds is empty', async () => {
      await expect(
        service.softDeleteGuestListScrapedEvents('entraste', []),
      ).resolves.toEqual([]);

      expect(
        mockEventsRepository.softDeleteEventsByExternalIds,
      ).not.toHaveBeenCalled();
    });

    it('dedupes external ids and soft-deletes without onlyPastEventEndDate (guest list)', async () => {
      mockEventsRepository.softDeleteEventsByExternalIds.mockResolvedValue([
        {id: 'event-1', externalId: 'ext-a', name: 'Guest show'},
      ]);

      const result = await service.softDeleteGuestListScrapedEvents(
        'entraste',
        ['ext-a', 'ext-a'],
      );

      expect(
        mockEventsRepository.softDeleteEventsByExternalIds,
      ).toHaveBeenCalledWith(['ext-a'], expect.any(Date), {
        platform: 'entraste',
      });
      expect(
        mockEventsRepository.softDeleteRelatedTicketWaves,
      ).toHaveBeenCalledWith(['event-1'], expect.any(Date));
      expect(result).toHaveLength(1);
    });
  });

  describe('cleanupStaleEventsForPlatform', () => {
    it('uses repository platform cleanup (past end date enforced in SQL) when scraped id count is <= 1000', async () => {
      mockEventsRepository.getActiveEventCountByPlatform.mockResolvedValue(0);
      mockEventsRepository.softDeleteEventsNotInScrapedResultsForPlatform.mockResolvedValue(
        [],
      );

      const scraped = [stubScraped({externalId: 'still-here'})];

      await service.cleanupStaleEventsForPlatform(Platform.Entraste, scraped);

      expect(
        mockEventsRepository.softDeleteEventsNotInScrapedResultsForPlatform,
      ).toHaveBeenCalledWith(
        Platform.Entraste,
        ['still-here'],
        expect.any(Date),
      );
      expect(
        mockEventsRepository.softDeleteEventsByExternalIds,
      ).not.toHaveBeenCalled();
    });

    it('batches soft delete with platform and onlyPastEventEndDate when scraped id count is > 1000', async () => {
      mockEventsRepository.getActiveEventCountByPlatform.mockResolvedValue(0);
      const scraped = Array.from({length: 1001}, (_, i) =>
        stubScraped({externalId: `s-${i}`}),
      );
      mockEventsRepository.getAllActiveEventExternalIdsForPlatform.mockResolvedValue(
        ['orphan-not-in-scrape'],
      );
      mockEventsRepository.softDeleteEventsByExternalIds.mockResolvedValue([
        {
          id: 'id-orphan',
          externalId: 'orphan-not-in-scrape',
          name: 'Old',
        },
      ]);

      await service.cleanupStaleEventsForPlatform(Platform.Entraste, scraped);

      expect(
        mockEventsRepository.softDeleteEventsByExternalIds,
      ).toHaveBeenCalledWith(['orphan-not-in-scrape'], expect.any(Date), {
        platform: Platform.Entraste,
        onlyPastEventEndDate: true,
      });
      expect(
        mockEventsRepository.softDeleteEventsNotInScrapedResultsForPlatform,
      ).not.toHaveBeenCalled();
    });
  });
});
