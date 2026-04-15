/**
 * Comprehensive PayoutsService tests.
 *
 * Covers:
 * - requestPayout: validation, UYU direct, USD direct, UYU→USD PayPal conversion (FX)
 * - processPayout: happy path, FX metadata, non-pending rejection
 * - failPayout: earnings cloning for audit trail, notification fire-and-forget
 * - cancelPayout: 'error' vs 'other' reason types, earnings cloning
 * - refreshPayoutRateLock: new rate, below-minimum guard
 * - Currency / method compatibility matrix
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
import {NotFoundError, ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';

// ---------------------------------------------------------------------------
// Mock the external rate provider so no real HTTP calls are made
// ---------------------------------------------------------------------------
jest.mock(
  '~/services/exchange-rates/providers/UruguayBankProvider',
  () => ({
    fetchBrouEbrouVentaRate: jest.fn().mockResolvedValue(41.05),
  }),
);
import {fetchBrouEbrouVentaRate} from '~/services/exchange-rates/providers/UruguayBankProvider';
const mockedFetchRate = fetchBrouEbrouVentaRate as jest.MockedFunction<
  typeof fetchBrouEbrouVentaRate
>;
const MOCK_BROU_RATE = 41.05;

// Mock notification helpers to avoid real calls
jest.mock('~/services/notifications/helpers', () => ({
  notifyPayoutCompleted: jest.fn().mockResolvedValue(undefined),
  notifyPayoutFailed: jest.fn().mockResolvedValue(undefined),
  notifyPayoutCancelled: jest.fn().mockResolvedValue(undefined),
}));
import {
  notifyPayoutCompleted,
  notifyPayoutFailed,
  notifyPayoutCancelled,
} from '~/services/notifications/helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeMockPayoutsRepo(): jest.Mocked<PayoutsRepository> {
  return {
    getById: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    updateProcessingFee: jest.fn(),
    executeTransaction: jest.fn().mockImplementation(async (cb: any) => cb({})),
    withTransaction: jest.fn().mockReturnThis(),
    getWithLinkedEarnings: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<PayoutsRepository>;
}

function makeMockPayoutMethodsRepo(): jest.Mocked<PayoutMethodsRepository> {
  return {
    getById: jest.fn(),
    withTransaction: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<PayoutMethodsRepository>;
}

function makeMockSellerEarningsRepo(): jest.Mocked<SellerEarningsRepository> {
  return {
    validateEarningsSelection: jest.fn(),
    linkSelectedEarningsToPayout: jest.fn(),
    markEarningsAsPaidOut: jest.fn(),
    releaseEarningsFromPayout: jest.fn(),
    cloneEarningsForFailedPayout: jest.fn().mockResolvedValue(2),
    withTransaction: jest.fn().mockReturnThis(),
    executeTransaction: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<SellerEarningsRepository>;
}

function makeMockPayoutEventsRepo(): jest.Mocked<PayoutEventsRepository> {
  return {
    create: jest.fn(),
    withTransaction: jest.fn().mockReturnThis(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<PayoutEventsRepository>;
}

/** Standard UYU bank payout method */
const UYU_BANK_METHOD = {
  id: 'pm-uyu',
  userId: 'seller-1',
  payoutType: 'uruguayan_bank' as const,
  currency: 'UYU' as const,
  metadata: {bankName: 'BROU', accountNumber: '123456'},
} as any;

/** Standard USD bank payout method */
const USD_BANK_METHOD = {
  id: 'pm-usd',
  userId: 'seller-1',
  payoutType: 'uruguayan_bank' as const,
  currency: 'USD' as const,
  metadata: {bankName: 'BROU', accountNumber: '789'},
} as any;

/** PayPal payout method (always USD) */
const PAYPAL_METHOD = {
  id: 'pm-paypal',
  userId: 'seller-1',
  payoutType: 'paypal' as const,
  currency: 'USD' as const,
  metadata: {email: 'seller@paypal.com'},
} as any;

function uyuEarnings(count: number, amount = 350) {
  return Array.from({length: count}, (_, i) => ({
    id: `e-uyu-${i}`,
    listingTicketId: `lt-uyu-${i}`,
    sellerAmount: String(amount),
    currency: 'UYU' as const,
  }));
}

function usdEarnings(count: number, amount = 50) {
  return Array.from({length: count}, (_, i) => ({
    id: `e-usd-${i}`,
    listingTicketId: `lt-usd-${i}`,
    sellerAmount: String(amount),
    currency: 'USD' as const,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PayoutsService', () => {
  let service: PayoutsService;
  let payoutsRepo: jest.Mocked<PayoutsRepository>;
  let methodsRepo: jest.Mocked<PayoutMethodsRepository>;
  let earningsRepo: jest.Mocked<SellerEarningsRepository>;
  let eventsRepo: jest.Mocked<PayoutEventsRepository>;
  let payoutDocumentsService: {getPayoutDocuments: jest.Mock};

  beforeEach(() => {
    jest.clearAllMocks();
    payoutsRepo = makeMockPayoutsRepo();
    methodsRepo = makeMockPayoutMethodsRepo();
    earningsRepo = makeMockSellerEarningsRepo();
    eventsRepo = makeMockPayoutEventsRepo();
    payoutDocumentsService = {
      getPayoutDocuments: jest.fn().mockResolvedValue([]),
    };

    // Make the transactional repos return themselves
    const trxRepos = {
      payoutsRepo,
      earningsRepo,
      eventsRepo,
    };
    payoutsRepo.withTransaction.mockReturnValue(payoutsRepo as any);
    earningsRepo.withTransaction.mockReturnValue(earningsRepo as any);
    eventsRepo.withTransaction.mockReturnValue(eventsRepo as any);

    payoutsRepo.executeTransaction.mockImplementation(async (cb: any) =>
      cb({} as any),
    );

    service = new PayoutsService(
      payoutsRepo,
      methodsRepo,
      earningsRepo,
      eventsRepo,
      {} as NotificationService,
      payoutDocumentsService as unknown as PayoutDocumentsService,
    );
  });

  // =========================================================================
  // requestPayout
  // =========================================================================
  describe('requestPayout', () => {
    // --- Validation ---
    it('throws NotFoundError when payout method does not exist', async () => {
      methodsRepo.getById.mockResolvedValue(undefined as any);

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-nonexistent',
          listingIds: ['l-1'],
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when payout method belongs to another user', async () => {
      methodsRepo.getById.mockResolvedValue({
        ...UYU_BANK_METHOD,
        userId: 'other-seller',
      });

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-uyu',
          listingTicketIds: ['lt-1'],
        }),
      ).rejects.toMatchObject({
        message: PAYOUT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      });
    });

    it('throws ValidationError when no earnings are selected', async () => {
      methodsRepo.getById.mockResolvedValue(UYU_BANK_METHOD);

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-uyu',
        }),
      ).rejects.toMatchObject({
        message: PAYOUT_ERROR_MESSAGES.NO_EARNINGS_SELECTED,
      });
    });

    it('throws ValidationError when validation finds no available earnings', async () => {
      methodsRepo.getById.mockResolvedValue(UYU_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: false,
        earnings: [],
        error: 'No available earnings found for selected tickets/listings',
      });

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-uyu',
          listingIds: ['listing-1'],
        }),
      ).rejects.toThrow(ValidationError);
    });

    // --- Currency / method compatibility ---
    it('throws ValidationError when UYU bank method receives USD earnings', async () => {
      methodsRepo.getById.mockResolvedValue(UYU_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings: usdEarnings(2, 50),
      });

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-uyu',
          listingTicketIds: ['lt-usd-0', 'lt-usd-1'],
        }),
      ).rejects.toMatchObject({
        message:
          PAYOUT_ERROR_MESSAGES.CURRENCY_MISMATCH_UYU_METHOD_USD_EARNINGS,
      });
    });

    it('throws ValidationError when USD bank method receives UYU earnings', async () => {
      methodsRepo.getById.mockResolvedValue(USD_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings: uyuEarnings(3, 400),
      });

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-usd',
          listingIds: ['listing-1'],
        }),
      ).rejects.toMatchObject({
        message:
          PAYOUT_ERROR_MESSAGES.CURRENCY_MISMATCH_USD_METHOD_UYU_EARNINGS,
      });
    });

    // --- Below-minimum threshold ---
    it('throws ValidationError when UYU amount is below minimum (1000)', async () => {
      methodsRepo.getById.mockResolvedValue(UYU_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings: uyuEarnings(2, 200), // total 400 UYU < 1000
      });

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-uyu',
          listingIds: ['listing-1'],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when USD amount is below minimum (25)', async () => {
      methodsRepo.getById.mockResolvedValue(USD_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings: usdEarnings(1, 10), // 10 USD < 25
      });

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-usd',
          listingTicketIds: ['lt-usd-0'],
        }),
      ).rejects.toThrow(ValidationError);
    });

    // --- Happy path: UYU → UYU bank (no conversion) ---
    it('creates UYU payout to bank with correct amount, no FX', async () => {
      const earnings = uyuEarnings(3, 400); // 1200 UYU
      methodsRepo.getById.mockResolvedValue(UYU_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings,
      });
      payoutsRepo.create.mockResolvedValue({id: 'payout-1'} as any);

      await service.requestPayout({
        sellerUserId: 'seller-1',
        payoutMethodId: 'pm-uyu',
        listingIds: ['listing-1'],
      });

      expect(payoutsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sellerUserId: 'seller-1',
          amount: 1200,
          currency: 'UYU',
          payoutProvider: 'manual_bank',
        }),
      );

      // Metadata should NOT have rateLock
      const createCall = payoutsRepo.create.mock.calls[0][0] as any;
      expect(createCall.metadata).not.toHaveProperty('rateLock');
    });

    // --- Happy path: USD → USD bank (no conversion) ---
    it('creates USD payout to bank with correct amount, no FX', async () => {
      const earnings = usdEarnings(2, 30); // 60 USD
      methodsRepo.getById.mockResolvedValue(USD_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings,
      });
      payoutsRepo.create.mockResolvedValue({id: 'payout-2'} as any);

      await service.requestPayout({
        sellerUserId: 'seller-1',
        payoutMethodId: 'pm-usd',
        listingTicketIds: ['lt-usd-0', 'lt-usd-1'],
      });

      expect(payoutsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 60,
          currency: 'USD',
          payoutProvider: 'manual_bank',
        }),
      );
    });

    // --- Happy path: USD → PayPal (no conversion) ---
    it('creates USD payout to PayPal without conversion when earnings are USD', async () => {
      const earnings = usdEarnings(2, 30);
      methodsRepo.getById.mockResolvedValue(PAYPAL_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings,
      });
      payoutsRepo.create.mockResolvedValue({id: 'payout-3'} as any);

      await service.requestPayout({
        sellerUserId: 'seller-1',
        payoutMethodId: 'pm-paypal',
        listingTicketIds: ['lt-usd-0', 'lt-usd-1'],
      });

      expect(payoutsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 60,
          currency: 'USD',
          payoutProvider: 'manual_paypal',
        }),
      );
      const meta = payoutsRepo.create.mock.calls[0][0] as any;
      expect(meta.metadata).not.toHaveProperty('rateLock');
    });

    // --- Happy path: UYU → PayPal with FX conversion ---
    it('converts UYU to USD using BROU rate + spread for PayPal payout', async () => {
      const earnings = uyuEarnings(4, 350); // 1400 UYU
      methodsRepo.getById.mockResolvedValue(PAYPAL_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings,
      });
      payoutsRepo.create.mockResolvedValue({id: 'payout-fx'} as any);
      mockedFetchRate.mockResolvedValue(MOCK_BROU_RATE);

      await service.requestPayout({
        sellerUserId: 'seller-1',
        payoutMethodId: 'pm-paypal',
        listingIds: ['listing-1'],
      });

      // effectiveRate = 41.05 * (1 + 0.01) = 41.4605
      // convertedAmount = round(1400 / 41.4605, 2) = 33.77
      const expectedRate = MOCK_BROU_RATE * 1.01;
      const expectedUsd = Math.round((1400 / expectedRate) * 100) / 100;

      expect(payoutsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expectedUsd,
          currency: 'USD',
          payoutProvider: 'manual_paypal',
        }),
      );

      // Verify rateLock metadata
      const meta = (payoutsRepo.create.mock.calls[0][0] as any).metadata;
      expect(meta).toHaveProperty('rateLock');
      expect(meta.rateLock.originalAmount).toBe(1400);
      expect(meta.rateLock.originalCurrency).toBe('UYU');
      expect(meta.rateLock.convertedAmount).toBe(expectedUsd);
      expect(meta.rateLock.convertedCurrency).toBe('USD');
      expect(meta.rateLock.brouVentaRate).toBe(MOCK_BROU_RATE);
      expect(meta.rateLock.spreadPercent).toBe(1);
      expect(meta.rateLock).toHaveProperty('lockedAt');
      expect(meta.rateLock).toHaveProperty('rateExpiresAt');
    });

    it('rejects UYU→PayPal conversion if resulting USD is below minimum', async () => {
      // 500 UYU / 41.4605 ≈ 12.06 USD < 25
      const earnings = uyuEarnings(1, 500);
      methodsRepo.getById.mockResolvedValue(PAYPAL_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings,
      });
      mockedFetchRate.mockResolvedValue(MOCK_BROU_RATE);

      await expect(
        service.requestPayout({
          sellerUserId: 'seller-1',
          payoutMethodId: 'pm-paypal',
          listingIds: ['listing-1'],
        }),
      ).rejects.toThrow(ValidationError);
    });

    // --- Earnings linking ---
    it('links earnings to payout inside transaction', async () => {
      const earnings = uyuEarnings(3, 400);
      methodsRepo.getById.mockResolvedValue(UYU_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings,
      });
      payoutsRepo.create.mockResolvedValue({id: 'payout-link'} as any);

      await service.requestPayout({
        sellerUserId: 'seller-1',
        payoutMethodId: 'pm-uyu',
        listingIds: ['listing-1'],
      });

      expect(earningsRepo.linkSelectedEarningsToPayout).toHaveBeenCalledWith(
        'payout-link',
        undefined, // listingTicketIds not provided
        ['listing-1'],
      );
    });

    it('logs payout_requested event', async () => {
      const earnings = usdEarnings(1, 30);
      methodsRepo.getById.mockResolvedValue(USD_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings,
      });
      payoutsRepo.create.mockResolvedValue({id: 'payout-evt'} as any);

      await service.requestPayout({
        sellerUserId: 'seller-1',
        payoutMethodId: 'pm-usd',
        listingTicketIds: ['lt-usd-0'],
      });

      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payoutId: 'payout-evt',
          eventType: 'payout_requested',
          eventData: expect.objectContaining({
            sellerUserId: 'seller-1',
            amount: 30,
            currency: 'USD',
            earningsCount: 1,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // processPayout
  // =========================================================================
  describe('processPayout', () => {
    it('throws NotFoundError when payout does not exist', async () => {
      payoutsRepo.getById.mockResolvedValue(undefined as any);

      await expect(
        service.processPayout('nonexistent', 'admin-1', {}),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when payout is not pending', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-1',
        status: 'completed',
      } as any);

      await expect(
        service.processPayout('p-1', 'admin-1', {}),
      ).rejects.toThrow(ValidationError);
    });

    it('completes payout, marks earnings as paid_out, and logs event', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-1',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '1200',
        currency: 'UYU',
        metadata: {},
      } as any);
      payoutsRepo.updateStatus.mockResolvedValue({id: 'p-1'} as any);

      await service.processPayout('p-1', 'admin-1', {
        processingFee: 50,
        transactionReference: 'TX-123',
        notes: 'Done',
      });

      expect(payoutsRepo.updateStatus).toHaveBeenCalledWith(
        'p-1',
        'completed',
        expect.objectContaining({
          processedBy: 'admin-1',
        }),
      );
      expect(earningsRepo.markEarningsAsPaidOut).toHaveBeenCalledWith('p-1');
      expect(payoutsRepo.updateProcessingFee).toHaveBeenCalledWith('p-1', 50);
      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payoutId: 'p-1',
          eventType: 'transfer_completed',
          fromStatus: 'pending',
          toStatus: 'completed',
        }),
      );
    });

    it('fires payout completed notification (fire-and-forget)', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-1',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '60',
        currency: 'USD',
        metadata: {},
      } as any);
      payoutsRepo.updateStatus.mockResolvedValue({id: 'p-1'} as any);

      await service.processPayout('p-1', 'admin-1', {});

      expect(notifyPayoutCompleted).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sellerUserId: 'seller-1',
          payoutId: 'p-1',
          amount: '60',
          currency: 'USD',
        }),
      );
    });

    it('stores FX processing metadata when actualBankRate is provided', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-fx',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '33.77',
        currency: 'USD',
        metadata: {
          rateLock: {
            lockedRate: 41.4605,
            brouVentaRate: 41.05,
            spreadPercent: 1,
            lockedAt: '2026-04-13T00:00:00.000Z',
            rateExpiresAt: '2026-04-16T00:00:00.000Z',
            originalAmount: 1400,
            originalCurrency: 'UYU',
            convertedAmount: 33.77,
            convertedCurrency: 'USD',
          },
        },
      } as any);
      payoutsRepo.updateStatus.mockResolvedValue({id: 'p-fx'} as any);

      await service.processPayout('p-fx', 'admin-1', {
        actualBankRate: 41.10,
        actualUyuCost: 1388.15,
      });

      const updateCall = payoutsRepo.updateStatus.mock.calls[0];
      const metadata = (updateCall[2] as any).metadata;
      expect(metadata.fxProcessing.actualBankRate).toBe(41.10);
      expect(metadata.fxProcessing.actualUyuCost).toBe(1388.15);
      expect(metadata.fxProcessing).toHaveProperty('processedAt');
    });

    it('does not persist payout metadata when completing without FX fields', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-doc',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '100',
        currency: 'UYU',
        metadata: {},
      } as any);
      payoutsRepo.updateStatus.mockResolvedValue({id: 'p-doc'} as any);

      await service.processPayout('p-doc', 'admin-1', {});

      const updatePayload = payoutsRepo.updateStatus.mock.calls[0][2] as {
        metadata?: unknown;
      };
      expect(updatePayload.metadata).toBeUndefined();
      expect(payoutDocumentsService.getPayoutDocuments).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // failPayout
  // =========================================================================
  describe('failPayout', () => {
    it('throws NotFoundError when payout does not exist', async () => {
      payoutsRepo.getById.mockResolvedValue(undefined as any);

      await expect(
        service.failPayout('nonexistent', 'admin-1', 'reason'),
      ).rejects.toThrow(NotFoundError);
    });

    it('sets status to failed, clones earnings, and logs event inside transaction', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-fail',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '1200',
        currency: 'UYU',
      } as any);
      payoutsRepo.updateStatus.mockResolvedValue({id: 'p-fail'} as any);

      await service.failPayout('p-fail', 'admin-1', 'Bank rejected');

      expect(payoutsRepo.updateStatus).toHaveBeenCalledWith(
        'p-fail',
        'failed',
        expect.objectContaining({failureReason: 'Bank rejected'}),
      );
      expect(earningsRepo.cloneEarningsForFailedPayout).toHaveBeenCalledWith(
        'p-fail',
      );
      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'transfer_failed',
          toStatus: 'failed',
        }),
      );
    });

    it('sends failed notification outside transaction', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-fail',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '60',
        currency: 'USD',
      } as any);
      payoutsRepo.updateStatus.mockResolvedValue({id: 'p-fail'} as any);

      await service.failPayout('p-fail', 'admin-1', 'Bank rejected');

      expect(notifyPayoutFailed).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sellerUserId: 'seller-1',
          payoutId: 'p-fail',
          failureReason: 'Bank rejected',
        }),
      );
    });
  });

  // =========================================================================
  // cancelPayout
  // =========================================================================
  describe('cancelPayout', () => {
    beforeEach(() => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-cancel',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '1200',
        currency: 'UYU',
      } as any);
      payoutsRepo.updateStatus.mockResolvedValue({id: 'p-cancel'} as any);
    });

    it('throws ValidationError when payout is not pending', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-cancel',
        status: 'completed',
      } as any);

      await expect(
        service.cancelPayout('p-cancel', 'admin-1', 'other', 'User request'),
      ).rejects.toThrow(ValidationError);
    });

    it('uses "failed" status and sets failedAt for reasonType=error', async () => {
      await service.cancelPayout(
        'p-cancel',
        'admin-1',
        'error',
        'Wrong account',
      );

      expect(payoutsRepo.updateStatus).toHaveBeenCalledWith(
        'p-cancel',
        'failed',
        expect.objectContaining({
          status: 'failed',
          failureReason: 'Wrong account',
          failedAt: expect.any(Date),
        }),
      );
      expect(notifyPayoutFailed).toHaveBeenCalled();
      expect(notifyPayoutCancelled).not.toHaveBeenCalled();
    });

    it('uses "cancelled" status without failedAt for reasonType=other', async () => {
      await service.cancelPayout(
        'p-cancel',
        'admin-1',
        'other',
        'User changed mind',
      );

      expect(payoutsRepo.updateStatus).toHaveBeenCalledWith(
        'p-cancel',
        'cancelled',
        expect.objectContaining({
          status: 'cancelled',
          failureReason: 'User changed mind',
        }),
      );
      // For 'other', failedAt should NOT be set
      const updateData = payoutsRepo.updateStatus.mock.calls[0][2] as any;
      expect(updateData.failedAt).toBeUndefined();

      expect(notifyPayoutCancelled).toHaveBeenCalled();
      expect(notifyPayoutFailed).not.toHaveBeenCalled();
    });

    it('clones earnings for audit trail in both cancel types', async () => {
      await service.cancelPayout(
        'p-cancel',
        'admin-1',
        'other',
        'User changed mind',
      );

      expect(earningsRepo.cloneEarningsForFailedPayout).toHaveBeenCalledWith(
        'p-cancel',
      );
    });

    it('logs correct event type based on reasonType', async () => {
      await service.cancelPayout(
        'p-cancel',
        'admin-1',
        'error',
        'Wrong account',
      );
      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({eventType: 'transfer_failed'}),
      );

      jest.clearAllMocks();
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-cancel',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '1200',
        currency: 'UYU',
      } as any);
      payoutsRepo.updateStatus.mockResolvedValue({id: 'p-cancel'} as any);

      await service.cancelPayout(
        'p-cancel',
        'admin-1',
        'other',
        'User changed mind',
      );
      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({eventType: 'cancelled'}),
      );
    });
  });

  // =========================================================================
  // refreshPayoutRateLock
  // =========================================================================
  describe('refreshPayoutRateLock', () => {
    const EXISTING_RATE_LOCK = {
      lockedRate: 40.0,
      brouVentaRate: 39.6,
      spreadPercent: 1,
      lockedAt: '2026-04-10T00:00:00.000Z',
      rateExpiresAt: '2026-04-13T00:00:00.000Z',
      originalAmount: 2000,
      originalCurrency: 'UYU',
      convertedAmount: 50.0,
      convertedCurrency: 'USD',
    };

    it('throws NotFoundError when payout does not exist', async () => {
      payoutsRepo.getById.mockResolvedValue(undefined as any);

      await expect(
        service.refreshPayoutRateLock('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when payout is not pending', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-r',
        status: 'completed',
      } as any);

      await expect(
        service.refreshPayoutRateLock('p-r', 'admin-1'),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when payout has no rateLock metadata', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-r',
        status: 'pending',
        metadata: {},
      } as any);

      await expect(
        service.refreshPayoutRateLock('p-r', 'admin-1'),
      ).rejects.toMatchObject({
        message: PAYOUT_ERROR_MESSAGES.PAYOUT_HAS_NO_RATE_LOCK,
      });
    });

    it('recalculates USD amount from UYU principal with fresh BROU rate', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-r',
        status: 'pending',
        metadata: {rateLock: EXISTING_RATE_LOCK},
      } as any);
      // After refresh, the service calls getPayoutDetailsForAdmin which we need to mock
      payoutsRepo.getWithLinkedEarnings.mockResolvedValue({
        id: 'p-r',
        status: 'pending',
        metadata: {rateLock: EXISTING_RATE_LOCK},
        payoutMethodId: 'pm-paypal',
      } as any);
      methodsRepo.getById.mockResolvedValue(PAYPAL_METHOD);
      mockedFetchRate.mockResolvedValue(41.05);

      // mock getPayoutDocuments
      const mockDocs = {getPayoutDocuments: jest.fn().mockResolvedValue([])};
      (service as any).payoutDocumentsService = mockDocs;
      // mock getPayoutSettlementInfo
      payoutsRepo.getPayoutSettlementInfo = jest.fn().mockResolvedValue(null) as any;

      await service.refreshPayoutRateLock('p-r', 'admin-1');

      // New rate = 41.05 * 1.01 = 41.4605
      // New USD = round(2000 / 41.4605, 2) = 48.24
      const expectedRate = 41.05 * 1.01;
      const expectedUsd = Math.round((2000 / expectedRate) * 100) / 100;

      expect(payoutsRepo.updateStatus).toHaveBeenCalledWith(
        'p-r',
        'pending',
        expect.objectContaining({amount: expectedUsd}),
      );

      const updatedMeta = (payoutsRepo.updateStatus.mock.calls[0][2] as any)
        .metadata;
      expect(updatedMeta.rateLock.convertedAmount).toBe(expectedUsd);
      expect(updatedMeta.rateLock.brouVentaRate).toBe(41.05);
    });

    it('throws ValidationError if refreshed USD would be below minimum', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-r',
        status: 'pending',
        metadata: {
          rateLock: {
            ...EXISTING_RATE_LOCK,
            originalAmount: 500, // 500 UYU / 41.4605 ≈ 12.06 < 25
          },
        },
      } as any);
      mockedFetchRate.mockResolvedValue(41.05);

      await expect(
        service.refreshPayoutRateLock('p-r', 'admin-1'),
      ).rejects.toThrow(ValidationError);
    });
  });

  // =========================================================================
});
