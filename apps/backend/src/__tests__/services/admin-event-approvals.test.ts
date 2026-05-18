import {AdminEventApprovalsService} from '~/services/admin-event-approvals';
import type {EventsRepository} from '~/repositories';
import {EVENT_LIFECYCLE_ERROR_MESSAGES} from '~/constants/error-messages';
import type {OfficialWaveStockMaterializer} from '~/services/producer-events/stock-materializer';

describe('AdminEventApprovalsService', () => {
  let service: AdminEventApprovalsService;
  let eventsRepository: jest.Mocked<EventsRepository>;
  let stockMaterializer: jest.Mocked<OfficialWaveStockMaterializer>;

  beforeEach(() => {
    eventsRepository = {
      getLifecycleEventById: jest.fn(),
      updateEvent: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<EventsRepository>;

    stockMaterializer = {
      materializePublishedEventWaves: jest.fn(),
    } as unknown as jest.Mocked<OfficialWaveStockMaterializer>;

    service = new AdminEventApprovalsService(
      eventsRepository,
      stockMaterializer,
    );
  });

  it('approves events only from under_review', async () => {
    eventsRepository.getLifecycleEventById.mockResolvedValue({
      id: 'event-1',
      status: 'under_review',
    } as any);
    eventsRepository.updateEvent.mockResolvedValue({
      id: 'event-1',
      status: 'published',
      isOfficial: true,
    } as any);

    const result = await service.approveEvent('event-1', 'admin-1');

    expect(eventsRepository.updateEvent).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        status: 'published',
        approvedByUserId: 'admin-1',
      }),
    );
    expect(result.status).toBe('published');
    expect(stockMaterializer.materializePublishedEventWaves).toHaveBeenCalledWith(
      'event-1',
    );
  });

  it('rejects approval attempts from invalid statuses', async () => {
    eventsRepository.getLifecycleEventById.mockResolvedValue({
      id: 'event-1',
      status: 'draft',
    } as any);

    await expect(service.approveEvent('event-1', 'admin-1')).rejects.toMatchObject(
      {
        message: EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_APPROVAL_TRANSITION(
          'draft',
        ),
      },
    );
    expect(eventsRepository.updateEvent).not.toHaveBeenCalled();
  });

  it('rejects events with a mandatory reason', async () => {
    eventsRepository.getLifecycleEventById.mockResolvedValue({
      id: 'event-1',
      status: 'under_review',
    } as any);
    eventsRepository.updateEvent.mockResolvedValue({
      id: 'event-1',
      status: 'rejected',
      rejectedReason: 'Faltan datos clave',
    } as any);

    const result = await service.rejectEvent('event-1', 'Faltan datos clave');

    expect(eventsRepository.updateEvent).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        status: 'rejected',
        rejectedReason: 'Faltan datos clave',
      }),
    );
    expect(result.status).toBe('rejected');
  });
});
