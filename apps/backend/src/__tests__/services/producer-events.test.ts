import {ProducerEventsService} from '~/services/producer-events';
import type {
  EventProducerMembersRepository,
  EventProducersRepository,
  EventsRepository,
} from '~/repositories';
import {EVENT_LIFECYCLE_ERROR_MESSAGES} from '~/constants/error-messages';

describe('ProducerEventsService', () => {
  let service: ProducerEventsService;
  let eventsRepository: jest.Mocked<EventsRepository>;
  let eventProducersRepository: jest.Mocked<EventProducersRepository>;
  let eventProducerMembersRepository: jest.Mocked<EventProducerMembersRepository>;

  beforeEach(() => {
    eventsRepository = {
      slugExists: jest.fn(),
      createEvent: jest.fn(),
      getLifecycleEventById: jest.fn(),
      updateOfficialDraftEvent: jest.fn(),
      updateEvent: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<EventsRepository>;

    eventProducersRepository = {
      getById: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<EventProducersRepository>;

    eventProducerMembersRepository = {
      getActiveByEventProducerAndUser: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<EventProducerMembersRepository>;

    service = new ProducerEventsService(
      eventsRepository,
      eventProducersRepository,
      eventProducerMembersRepository,
    );
  });

  it('creates official drafts with compatibility placeholders', async () => {
    eventProducerMembersRepository.getActiveByEventProducerAndUser.mockResolvedValue(
      {
        id: 'member-1',
        role: 'owner',
      } as any,
    );
    eventProducersRepository.getById.mockResolvedValue({
      id: 'producer-1',
      slug: 'productora-test',
    } as any);
    eventsRepository.slugExists.mockResolvedValue(false);
    eventsRepository.createEvent.mockResolvedValue({
      id: 'event-1',
      eventProducerId: 'producer-1',
      isOfficial: true,
      status: 'draft',
    } as any);

    const result = await service.saveDraft('user-1', {
      eventProducerId: 'producer-1',
      name: 'Fiesta Oficial',
      draftPayload: {step: 1},
    });

    expect(eventsRepository.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventProducerId: 'producer-1',
        isOfficial: true,
        status: 'draft',
        platform: 'official_internal',
      }),
    );
    expect(result.id).toBe('event-1');
  });

  it('submits draft events for review', async () => {
    eventProducerMembersRepository.getActiveByEventProducerAndUser.mockResolvedValue(
      {
        id: 'member-1',
        role: 'manager',
      } as any,
    );
    eventsRepository.getLifecycleEventById.mockResolvedValue({
      id: 'event-1',
      eventProducerId: 'producer-1',
      isOfficial: true,
      status: 'draft',
      name: 'Evento listo',
      draftPayload: {step: 6},
      eventStartDate: new Date('2030-01-01T00:00:00.000Z'),
      eventEndDate: new Date('2030-01-01T05:00:00.000Z'),
    } as any);
    eventsRepository.updateEvent.mockResolvedValue({
      id: 'event-1',
      status: 'under_review',
    } as any);

    const result = await service.submitForReview('user-1', 'event-1');

    expect(eventsRepository.updateEvent).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        status: 'under_review',
      }),
    );
    expect(result.status).toBe('under_review');
  });

  it('rejects submit transitions from non-draft statuses', async () => {
    eventProducerMembersRepository.getActiveByEventProducerAndUser.mockResolvedValue(
      {
        id: 'member-1',
        role: 'owner',
      } as any,
    );
    eventsRepository.getLifecycleEventById.mockResolvedValue({
      id: 'event-1',
      eventProducerId: 'producer-1',
      isOfficial: true,
      status: 'published',
      name: 'Evento publicado',
      draftPayload: {step: 6},
      eventStartDate: new Date('2030-01-01T00:00:00.000Z'),
      eventEndDate: new Date('2030-01-01T05:00:00.000Z'),
    } as any);

    await expect(service.submitForReview('user-1', 'event-1')).rejects.toMatchObject(
      {
        message: EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_SUBMIT_TRANSITION(
          'published',
        ),
      },
    );
    expect(eventsRepository.updateEvent).not.toHaveBeenCalled();
  });
});
