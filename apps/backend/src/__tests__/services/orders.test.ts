/**
 * OrdersService tests with mocked repositories.
 */
import {OrdersService} from '~/services/orders';
import type {
  OrdersRepository,
  OrderItemsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  ListingTicketsRepository,
  OrderTicketReservationsRepository,
} from '~/repositories';
import type {PaymentSyncService} from '~/services/payments/sync';
import {ValidationError, NotFoundError} from '~/errors';
import {ORDER_ERROR_MESSAGES} from '~/constants/error-messages';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrdersRepository: jest.Mocked<OrdersRepository>;
  let mockOrderItemsRepository: jest.Mocked<OrderItemsRepository>;
  let mockEventsRepository: jest.Mocked<EventsRepository>;
  let mockEventTicketWavesRepository: jest.Mocked<EventTicketWavesRepository>;
  let mockListingTicketsRepository: jest.Mocked<ListingTicketsRepository>;
  let mockOrderTicketReservationsRepository: jest.Mocked<OrderTicketReservationsRepository>;
  let mockPaymentSyncService: jest.Mocked<PaymentSyncService>;

  beforeEach(() => {
    mockOrdersRepository = {
      getPendingOrderByUserAndEvent: jest.fn(),
      getByIdWithItems: jest.fn(),
      executeTransaction: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      getByUserId: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      getExpiredPendingOrders: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;

    mockOrderItemsRepository = {
      createBatch: jest.fn(),
      getByOrderId: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrderItemsRepository>;

    mockEventsRepository = {
      getById: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<EventsRepository>;

    mockEventTicketWavesRepository = {
      getById: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<EventTicketWavesRepository>;

    mockListingTicketsRepository = {
      findAvailableTicketsByPriceGroup: jest.fn(),
      findAvailableTicketsByPriceGroupForUpdate: jest.fn(),
      getListingsByIds: jest.fn(),
      markTicketsAsSoldByOrderId: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<ListingTicketsRepository>;
    mockListingTicketsRepository.withTransaction.mockReturnValue(
      mockListingTicketsRepository,
    );

    mockOrderTicketReservationsRepository = {
      createReservations: jest.fn(),
      cleanupExpiredReservationsForTickets: jest.fn(),
      releaseByOrderId: jest.fn(),
      getByOrderId: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrderTicketReservationsRepository>;
    mockOrderTicketReservationsRepository.withTransaction.mockReturnValue(
      mockOrderTicketReservationsRepository,
    );
    mockOrdersRepository.executeTransaction.mockImplementation(
      async (fn: any) => fn({}),
    );
    mockOrdersRepository.withTransaction.mockReturnValue(mockOrdersRepository);
    mockOrderItemsRepository.withTransaction.mockReturnValue(
      mockOrderItemsRepository,
    );

    mockPaymentSyncService = {
      syncPendingOrderPayment: jest.fn(),
    } as unknown as jest.Mocked<PaymentSyncService>;

    service = new OrdersService(
      mockOrdersRepository,
      mockOrderItemsRepository,
      mockEventsRepository,
      mockEventTicketWavesRepository,
      mockListingTicketsRepository,
      mockOrderTicketReservationsRepository,
      mockPaymentSyncService,
    );
  });

  describe('createOrder', () => {
    it('throws ValidationError when user already has pending order for event', async () => {
      const userId = 'user-1';
      const eventId = 'event-1';
      mockOrdersRepository.getPendingOrderByUserAndEvent.mockResolvedValue({
        id: 'order-existing',
        reservationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const data = {
        eventId,
        ticketSelections: {
          'wave-1': { '100': 1 },
        },
      };

      await expect(service.createOrder(data, userId)).rejects.toThrow(
        ValidationError,
      );
      await expect(service.createOrder(data, userId)).rejects.toMatchObject({
        message: ORDER_ERROR_MESSAGES.PENDING_ORDER_EXISTS('order-existing'),
        metadata: {orderId: 'order-existing'},
      });

      expect(
        mockOrdersRepository.getPendingOrderByUserAndEvent,
      ).toHaveBeenCalledWith(userId, eventId);
      expect(mockEventsRepository.getById).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when event does not exist', async () => {
      mockOrdersRepository.getPendingOrderByUserAndEvent.mockResolvedValue(
        undefined,
      );
      mockEventsRepository.getById.mockResolvedValue(undefined as any);

      const data = {
        eventId: 'event-missing',
        ticketSelections: { 'wave-1': { '100': 1 } },
      };

      await expect(
        service.createOrder(data, 'user-1'),
      ).rejects.toThrow(NotFoundError);
      await expect(service.createOrder(data, 'user-1')).rejects.toMatchObject({
        message: ORDER_ERROR_MESSAGES.EVENT_NOT_FOUND,
      });

      expect(mockEventsRepository.getById).toHaveBeenCalledWith('event-missing');
    });

    it('throws ValidationError when insufficient tickets available', async () => {
      mockOrdersRepository.getPendingOrderByUserAndEvent.mockResolvedValue(
        undefined,
      );
      const event = {
        id: 'event-1',
        eventEndDate: new Date(Date.now() + 86400000),
      };
      mockEventsRepository.getById.mockResolvedValue(event as any);
      const wave = {
        id: 'wave-1',
        eventId: 'event-1',
        name: 'General',
        currency: 'UYU',
      };
      mockEventTicketWavesRepository.getById.mockResolvedValue(wave as any);
      // User wants 3 tickets but only 2 available (locked inside tx via ForUpdate)
      mockListingTicketsRepository.findAvailableTicketsByPriceGroupForUpdate.mockResolvedValue(
        [{ id: 't1', listingId: 'l1' }, { id: 't2', listingId: 'l1' }] as any,
      );

      const data = {
        eventId: 'event-1',
        ticketSelections: { 'wave-1': { '100': 3 } },
      };

      await expect(service.createOrder(data, 'user-1')).rejects.toThrow(
        ValidationError,
      );
      await expect(service.createOrder(data, 'user-1')).rejects.toMatchObject({
        message: expect.stringContaining('Solo hay 2 entradas disponibles'),
      });
    });

    it('throws ValidationError when user tries to buy own tickets', async () => {
      mockOrdersRepository.getPendingOrderByUserAndEvent.mockResolvedValue(
        undefined,
      );
      const event = {
        id: 'event-1',
        eventEndDate: new Date(Date.now() + 86400000),
      };
      mockEventsRepository.getById.mockResolvedValue(event as any);
      mockEventTicketWavesRepository.getById.mockResolvedValue({
        id: 'wave-1',
        eventId: 'event-1',
        name: 'General',
        currency: 'UYU',
      } as any);
      mockListingTicketsRepository.findAvailableTicketsByPriceGroupForUpdate.mockResolvedValue(
        [{ id: 't1', listingId: 'l1' }, { id: 't2', listingId: 'l1' }] as any,
      );
      // Listings belong to user-1 (the buyer)
      mockListingTicketsRepository.getListingsByIds.mockResolvedValue([
        { id: 'l1', publisherUserId: 'user-1' },
      ] as any);

      const data = {
        eventId: 'event-1',
        ticketSelections: { 'wave-1': { '100': 2 } },
      };

      await expect(service.createOrder(data, 'user-1')).rejects.toThrow(
        ValidationError,
      );
      await expect(service.createOrder(data, 'user-1')).rejects.toMatchObject({
        message: ORDER_ERROR_MESSAGES.CANNOT_BUY_OWN_TICKETS,
      });
    });
  });

  describe('cancelOrder', () => {
    it('throws ValidationError when order is not pending', async () => {
      mockOrdersRepository.getByIdWithItems.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'confirmed',
      } as any);

      await expect(
        service.cancelOrder('order-1', 'user-1'),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.cancelOrder('order-1', 'user-1'),
      ).rejects.toMatchObject({
        message: ORDER_ERROR_MESSAGES.ORDER_NOT_CANCELLABLE,
      });
      expect(mockOrdersRepository.executeTransaction).not.toHaveBeenCalled();
    });
  });

  describe('getOrderById', () => {
    it('throws NotFoundError when order belongs to another user', async () => {
      mockOrdersRepository.getByIdWithItems.mockResolvedValue({
        id: 'order-1',
        userId: 'other-user',
        status: 'pending',
      } as any);

      await expect(
        service.getOrderById('order-1', 'user-1'),
      ).rejects.toThrow(NotFoundError);
      await expect(
        service.getOrderById('order-1', 'user-1'),
      ).rejects.toMatchObject({
        message: ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND,
      });
    });
  });
});
