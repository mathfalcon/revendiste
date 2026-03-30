/**
 * PaymentWebhookAdapter tests: idempotency and amount validation.
 */
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import type {PaymentProvider} from '~/services/payments/providers';
import type {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
  ListingTicketsRepository,
  TicketListingsRepository,
} from '~/repositories';
import type {TicketListingsService} from '~/services/ticket-listings';
import type {SellerEarningsService} from '~/services/seller-earnings';
import type {NotificationService} from '~/services/notifications';
import {ValidationError} from '~/errors';
import {PAYMENT_ERROR_MESSAGES} from '~/constants/error-messages';

function createAdapterMocks() {
  const mockOrdersRepository = {
    getByIdWithItems: jest.fn(),
    executeTransaction: jest.fn(),
    withTransaction: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<OrdersRepository>;

  const mockOrderTicketReservationsRepository = {
    getByOrderId: jest.fn(),
    confirmOrderReservations: jest.fn(),
    releaseByOrderId: jest.fn(),
    withTransaction: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<OrderTicketReservationsRepository>;

  const mockPaymentsRepository = {
    getByProviderPaymentId: jest.fn(),
    update: jest.fn(),
    withTransaction: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<PaymentsRepository>;

  const mockPaymentEventsRepository = {
    logStatusChange: jest.fn(),
    logWebhookReceived: jest.fn(),
    logStatusSynced: jest.fn(),
    withTransaction: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<PaymentEventsRepository>;

  const mockListingTicketsRepository = {
    markTicketsAsSoldByOrderId: jest.fn(),
    withTransaction: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<ListingTicketsRepository>;

  const mockTicketListingsRepository = {
    checkAndMarkListingsAsSold: jest.fn(),
    withTransaction: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<TicketListingsRepository>;

  const mockTicketListingsService = {
    markTicketsAsSoldAndNotifySeller: jest.fn(),
    markTicketsAsSoldAndReturnSellerData: jest.fn().mockResolvedValue({
      soldTickets: [],
      sellerNotifications: [],
    }),
  } as unknown as jest.Mocked<TicketListingsService>;

  const mockJobQueueService = {
    enqueue: jest.fn().mockResolvedValue(undefined),
  };

  const mockSellerEarningsService = {
    createEarningsForSoldTickets: jest.fn(),
  } as unknown as jest.Mocked<SellerEarningsService>;

  const mockNotificationService = {} as unknown as NotificationService;

  const mockProvider: jest.Mocked<PaymentProvider> = {
    name: 'dlocal',
    getPayment: jest.fn(),
    createPayment: jest.fn(),
    normalizeStatus: jest.fn((s: string) => s.toLowerCase() as any),
  };

  const adapter = new PaymentWebhookAdapter(
    mockProvider,
    mockOrdersRepository,
    mockOrderTicketReservationsRepository,
    mockPaymentsRepository,
    mockPaymentEventsRepository,
    mockListingTicketsRepository,
    mockTicketListingsRepository,
    mockTicketListingsService,
    mockSellerEarningsService,
    mockNotificationService,
    () => mockJobQueueService as any,
  );

  return {
    adapter,
    mockOrdersRepository,
    mockPaymentsRepository,
    mockPaymentEventsRepository,
    mockTicketListingsService,
    mockSellerEarningsService,
    mockProvider,
    mockJobQueueService,
  };
}

describe('PaymentWebhookAdapter', () => {
  describe('processWebhook', () => {
    it('does not run confirm flow when order is already confirmed (idempotent)', async () => {
      const mocks = createAdapterMocks();
      mocks.mockProvider.getPayment.mockResolvedValue({
        id: 'ext-1',
        status: 'PAID',
        amount: 100,
        currency: 'UYU',
      } as any);
      mocks.mockPaymentsRepository.getByProviderPaymentId.mockResolvedValue({
        id: 'pay-1',
        orderId: 'order-1',
        status: 'pending',
      } as any);
      mocks.mockOrdersRepository.getByIdWithItems.mockResolvedValue({
        id: 'order-1',
        status: 'confirmed',
        totalAmount: '100',
      } as any);
      mocks.mockPaymentsRepository.update.mockResolvedValue({} as any);

      await mocks.adapter.processWebhook('ext-1');

      expect(mocks.mockOrdersRepository.executeTransaction).not.toHaveBeenCalled();
      expect(mocks.mockTicketListingsService.markTicketsAsSoldAndReturnSellerData).not.toHaveBeenCalled();
      expect(mocks.mockSellerEarningsService.createEarningsForSoldTickets).not.toHaveBeenCalled();
    });

    it('throws ValidationError when payment amount does not match order total', async () => {
      const mocks = createAdapterMocks();
      mocks.mockProvider.getPayment.mockResolvedValue({
        id: 'ext-1',
        status: 'PAID',
        amount: 99,
        currency: 'UYU',
      } as any);
      mocks.mockPaymentsRepository.getByProviderPaymentId.mockResolvedValue({
        id: 'pay-1',
        orderId: 'order-1',
        status: 'pending',
      } as any);
      mocks.mockOrdersRepository.getByIdWithItems.mockResolvedValue({
        id: 'order-1',
        status: 'pending',
        totalAmount: '100',
      } as any);

      await expect(mocks.adapter.processWebhook('ext-1')).rejects.toThrow(
        ValidationError,
      );
      await expect(mocks.adapter.processWebhook('ext-1')).rejects.toMatchObject({
        message: PAYMENT_ERROR_MESSAGES.PAYMENT_AMOUNT_MISMATCH,
      });
      expect(mocks.mockOrdersRepository.executeTransaction).not.toHaveBeenCalled();
    });
  });
});
