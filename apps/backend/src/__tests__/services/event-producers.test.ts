import {EventProducersService} from '~/services/event-producers';
import type {
  EventProducerMembersRepository,
  EventProducersRepository,
  UsersRepository,
} from '~/repositories';
import {EVENT_PRODUCER_ERROR_MESSAGES} from '~/constants/error-messages';

describe('EventProducersService', () => {
  let service: EventProducersService;
  let eventProducersRepository: jest.Mocked<EventProducersRepository>;
  let eventProducerMembersRepository: jest.Mocked<EventProducerMembersRepository>;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    eventProducersRepository = {
      list: jest.fn(),
      getById: jest.fn(),
      slugExists: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      executeTransaction: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<EventProducersRepository>;

    eventProducerMembersRepository = {
      listByEventProducerId: jest.fn(),
      getActiveByEventProducerAndUser: jest.fn(),
      create: jest.fn(),
      updateRole: jest.fn(),
      softDeleteByEventProducerAndUser: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<EventProducerMembersRepository>;

    usersRepository = {
      getById: jest.fn(),
      getByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateLastActiveAt: jest.fn(),
      getAll: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    eventProducersRepository.executeTransaction.mockImplementation(
      async callback => callback({} as any),
    );
    eventProducersRepository.withTransaction.mockReturnValue(
      eventProducersRepository,
    );
    eventProducerMembersRepository.withTransaction.mockReturnValue(
      eventProducerMembersRepository,
    );

    service = new EventProducersService(
      eventProducersRepository,
      eventProducerMembersRepository,
      usersRepository,
    );
  });

  describe('createEventProducer', () => {
    it('throws ValidationError when requested slug already exists', async () => {
      eventProducersRepository.slugExists.mockResolvedValue(true);

      await expect(
        service.createEventProducer({
          name: 'Productora Delta',
          slug: 'delta',
        }),
      ).rejects.toMatchObject({
        message: EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_SLUG_ALREADY_EXISTS,
      });

      expect(eventProducersRepository.create).not.toHaveBeenCalled();
    });

    it('throws ValidationError when fee amount is provided without fee currency', async () => {
      await expect(
        service.createEventProducer({
          name: 'Productora Delta',
          defaultProducerFeeAmount: 100,
        }),
      ).rejects.toMatchObject({
        message: EVENT_PRODUCER_ERROR_MESSAGES.DEFAULT_FEE_PAIR_REQUIRED,
      });
      expect(eventProducersRepository.slugExists).not.toHaveBeenCalled();
    });
  });

  describe('updateEventProducer', () => {
    it('throws ValidationError when fee pair becomes inconsistent', async () => {
      eventProducersRepository.getById.mockResolvedValue({
        id: 'producer-1',
        defaultProducerFeeAmount: null,
        defaultProducerFeeCurrency: null,
      } as any);

      await expect(
        service.updateEventProducer('producer-1', {
          defaultProducerFeeAmount: 250,
        }),
      ).rejects.toMatchObject({
        message: EVENT_PRODUCER_ERROR_MESSAGES.DEFAULT_FEE_PAIR_REQUIRED,
      });
      expect(eventProducersRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('member management', () => {
    it('updates member role and then removes member in the expected flow', async () => {
      const deletedAt = new Date('2030-01-01T00:00:00.000Z');
      eventProducersRepository.getById.mockResolvedValue({id: 'producer-1'} as any);
      eventProducerMembersRepository.getActiveByEventProducerAndUser.mockResolvedValue(
        {
          id: 'member-1',
          eventProducerId: 'producer-1',
          userId: 'user-1',
          role: 'viewer',
        } as any,
      );
      eventProducerMembersRepository.updateRole.mockResolvedValue({
        id: 'member-1',
        eventProducerId: 'producer-1',
        userId: 'user-1',
        role: 'manager',
      } as any);
      eventProducerMembersRepository.softDeleteByEventProducerAndUser.mockResolvedValue(
        {
          id: 'member-1',
          eventProducerId: 'producer-1',
          userId: 'user-1',
          deletedAt,
        } as any,
      );

      const updated = await service.updateMemberRole(
        'producer-1',
        'user-1',
        'manager',
      );
      const removed = await service.removeMember('producer-1', 'user-1');

      expect(updated.role).toBe('manager');
      expect(eventProducerMembersRepository.updateRole).toHaveBeenCalledWith(
        'producer-1',
        'user-1',
        'manager',
      );
      expect(
        eventProducerMembersRepository.softDeleteByEventProducerAndUser,
      ).toHaveBeenCalledWith('producer-1', 'user-1');
      expect(removed.deletedAt).toBe(deletedAt);
    });
  });
});
