/**
 * PaymentsService tests with mocked repositories and provider.
 */
import {PaymentsService} from '~/services/payments';
import type {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
} from '~/repositories';
import type {PaymentProvider} from '~/services/payments/providers';
import {ValidationError} from '~/errors';
import {PAYMENT_ERROR_MESSAGES} from '~/constants/error-messages';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockOrdersRepository: jest.Mocked<OrdersRepository>;
  let mockOrderTicketReservationsRepository: jest.Mocked<OrderTicketReservationsRepository>;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockPaymentEventsRepository: jest.Mocked<PaymentEventsRepository>;
  let mockPaymentProvider: jest.Mocked<PaymentProvider>;

  const params = {
    orderId: 'order-1',
    userId: 'user-1',
    userEmail: 'u@test.com',
    userFirstName: 'User',
    userLastName: 'One',
  };

  beforeEach(() => {
    mockOrdersRepository = {
      getByIdWithItems: jest.fn(),
      executeTransaction: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;

    mockOrderTicketReservationsRepository = {
      extendReservationsByOrderId: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrderTicketReservationsRepository>;

    mockPaymentsRepository = {
      getByOrderId: jest.fn(),
      create: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<PaymentsRepository>;

    mockPaymentEventsRepository = {
      create: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<PaymentEventsRepository>;

    mockPaymentProvider = {
      name: 'dlocal',
      createPayment: jest.fn(),
      getPayment: jest.fn(),
    } as unknown as jest.Mocked<PaymentProvider>;

    service = new PaymentsService(
      mockOrdersRepository,
      mockOrderTicketReservationsRepository,
      mockPaymentsRepository,
      mockPaymentEventsRepository,
      mockPaymentProvider,
    );
  });

  describe('createPaymentLink', () => {
    it('throws ValidationError when order is not pending', async () => {
      mockOrdersRepository.getByIdWithItems.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'confirmed',
        reservationExpiresAt: new Date(Date.now() + 600000),
      } as any);

      await expect(service.createPaymentLink(params)).rejects.toThrow(
        ValidationError,
      );
      await expect(service.createPaymentLink(params)).rejects.toMatchObject({
        message: PAYMENT_ERROR_MESSAGES.ORDER_NOT_PENDING('confirmed'),
      });
      expect(mockPaymentsRepository.getByOrderId).not.toHaveBeenCalled();
      expect(mockPaymentProvider.createPayment).not.toHaveBeenCalled();
    });

    it('throws ValidationError when order reservation has expired', async () => {
      mockOrdersRepository.getByIdWithItems.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'pending',
        reservationExpiresAt: new Date(Date.now() - 60000),
      } as any);

      await expect(service.createPaymentLink(params)).rejects.toThrow(
        ValidationError,
      );
      await expect(service.createPaymentLink(params)).rejects.toMatchObject({
        message: PAYMENT_ERROR_MESSAGES.ORDER_EXPIRED,
      });
    });

    it('returns existing redirect URL when pending payment exists for order', async () => {
      mockOrdersRepository.getByIdWithItems.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'pending',
        reservationExpiresAt: new Date(Date.now() + 600000),
      } as any);
      mockPaymentsRepository.getByOrderId.mockResolvedValue({
        id: 'pay-1',
        redirectUrl: 'https://pay.dlocal.com/xyz',
        status: 'pending',
      } as any);

      const result = await service.createPaymentLink(params);

      expect(result).toEqual({
        redirectUrl: 'https://pay.dlocal.com/xyz',
        paymentId: 'pay-1',
      });
      expect(mockPaymentProvider.createPayment).not.toHaveBeenCalled();
      expect(mockOrdersRepository.executeTransaction).not.toHaveBeenCalled();
    });
  });
});
