/**
 * PayoutsService tests with mocked repositories.
 */
import {PayoutsService} from '~/services/payouts';
import type {
  PayoutsRepository,
  PayoutMethodsRepository,
  SellerEarningsRepository,
  PayoutEventsRepository,
} from '~/repositories';
import type {PayoutDocumentsService} from '~/services/payout-documents';
import type {NotificationService} from '~/services/notifications';
import {ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';

describe('PayoutsService', () => {
  let service: PayoutsService;
  let mockPayoutsRepository: jest.Mocked<PayoutsRepository>;
  let mockPayoutMethodsRepository: jest.Mocked<PayoutMethodsRepository>;
  let mockSellerEarningsRepository: jest.Mocked<SellerEarningsRepository>;
  let mockPayoutEventsRepository: jest.Mocked<PayoutEventsRepository>;
  let mockPayoutDocumentsService: jest.Mocked<PayoutDocumentsService>;
  let mockNotificationService: NotificationService;

  beforeEach(() => {
    mockPayoutsRepository = {
      getById: jest.fn(),
      updateStatus: jest.fn(),
      executeTransaction: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<PayoutsRepository>;

    mockPayoutMethodsRepository = {
      getById: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<PayoutMethodsRepository>;

    mockSellerEarningsRepository = {
      validateEarningsSelection: jest.fn(),
      markEarningsAsPaidOut: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<SellerEarningsRepository>;

    mockPayoutEventsRepository = {
      create: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<PayoutEventsRepository>;

    mockPayoutDocumentsService = {} as jest.Mocked<PayoutDocumentsService>;
    mockNotificationService = {} as NotificationService;

    service = new PayoutsService(
      mockPayoutsRepository,
      mockPayoutMethodsRepository,
      mockSellerEarningsRepository,
      mockPayoutEventsRepository,
      mockNotificationService,
      mockPayoutDocumentsService,
    );
  });

  describe('requestPayout', () => {
    it('throws ValidationError when no earnings selected', async () => {
      mockPayoutMethodsRepository.getById.mockResolvedValue({
        id: 'pm-1',
        userId: 'user-1',
        payoutType: 'bank_transfer',
        currency: 'UYU',
      } as any);

      await expect(
        service.requestPayout({
          sellerUserId: 'user-1',
          payoutMethodId: 'pm-1',
        }),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.requestPayout({
          sellerUserId: 'user-1',
          payoutMethodId: 'pm-1',
        }),
      ).rejects.toMatchObject({
        message: PAYOUT_ERROR_MESSAGES.NO_EARNINGS_SELECTED,
      });
      expect(mockSellerEarningsRepository.validateEarningsSelection).not.toHaveBeenCalled();
    });

    it('throws ValidationError when payout method belongs to another user', async () => {
      mockPayoutMethodsRepository.getById.mockResolvedValue({
        id: 'pm-1',
        userId: 'other-user',
        payoutType: 'bank_transfer',
        currency: 'UYU',
      } as any);

      await expect(
        service.requestPayout({
          sellerUserId: 'user-1',
          payoutMethodId: 'pm-1',
          listingTicketIds: ['lt-1'],
        }),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.requestPayout({
          sellerUserId: 'user-1',
          payoutMethodId: 'pm-1',
          listingTicketIds: ['lt-1'],
        }),
      ).rejects.toMatchObject({
        message: PAYOUT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      });
    });
  });

  describe('processPayout', () => {
    it('throws ValidationError when payout is not pending', async () => {
      mockPayoutsRepository.getById.mockResolvedValue({
        id: 'payout-1',
        status: 'completed',
      } as any);

      await expect(
        service.processPayout('payout-1', 'admin-1', {}),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.processPayout('payout-1', 'admin-1', {}),
      ).rejects.toMatchObject({
        message: PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_PENDING('completed'),
      });
      expect(mockSellerEarningsRepository.markEarningsAsPaidOut).not.toHaveBeenCalled();
    });
  });
});
