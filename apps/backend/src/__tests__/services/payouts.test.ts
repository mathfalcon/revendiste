/**
 * Comprehensive PayoutsService tests.
 *
 * Covers:
 * - requestPayout: validation, UYU direct, USD direct
 * - processPayout: happy path, FX metadata, non-pending rejection
 * - failPayout: earnings cloning for audit trail, notification fire-and-forget
 * - cancelPayout: 'error' vs 'other' reason types, earnings cloning
 * - refreshPayoutRateLock: new rate, below-minimum guard
 * - Currency / method compatibility matrix
 */
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
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
jest.mock('~/services/exchange-rates/providers/UruguayBankProvider', () => ({
  fetchBrouEbrouVentaRate: jest.fn().mockResolvedValue(41.05),
}));
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
import {selectPayoutProvider} from '~/services/payouts/providers/PayoutProviderRegistry';
import {ManualBankTransferProvider} from '~/services/payouts/providers/ManualBankTransferProvider';

type PayoutMethodRow = NonNullable<
  Awaited<ReturnType<PayoutMethodsRepository['getById']>>
>;
type PayoutRow = NonNullable<Awaited<ReturnType<PayoutsRepository['getById']>>>;
type PayoutWithLinkedEarningsRow = NonNullable<
  Awaited<ReturnType<PayoutsRepository['getWithLinkedEarnings']>>
>;
type PayoutCreateResult = Awaited<ReturnType<PayoutsRepository['create']>>;
type PayoutUpdateResult = NonNullable<
  Awaited<ReturnType<PayoutsRepository['updateStatus']>>
>;
type CreatePayoutArg = Parameters<PayoutsRepository['create']>[0];
type UpdatePayoutStatusArg = Parameters<PayoutsRepository['updateStatus']>[2];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeMockPayoutsRepo(): jest.Mocked<PayoutsRepository> {
  return {
    getById: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    updateProcessingFee: jest.fn(),
    executeTransaction: jest
      .fn()
      .mockImplementation(async <U>(cb: (trx: Kysely<DB>) => Promise<U>) =>
        cb({} as unknown as Kysely<DB>),
      ),
    withTransaction: jest.fn().mockReturnThis(),
    getWithLinkedEarnings: jest.fn(),
    getPayoutSettlementInfo: jest.fn(),
    getDb: jest.fn(),
  } as unknown as jest.Mocked<PayoutsRepository>;
}

const VALID_BROU_ACCOUNT_14 = '00099299700002';

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
  accountHolderName: 'Test',
  accountHolderSurname: 'User',
  metadata: {
    bankName: 'BROU',
    accountNumber: VALID_BROU_ACCOUNT_14,
  },
} as unknown as PayoutMethodRow;

/** Standard USD bank payout method */
const USD_BANK_METHOD = {
  id: 'pm-usd',
  userId: 'seller-1',
  payoutType: 'uruguayan_bank' as const,
  currency: 'USD' as const,
  accountHolderName: 'Test',
  accountHolderSurname: 'User',
  metadata: {
    bankName: 'BROU',
    accountNumber: VALID_BROU_ACCOUNT_14,
  },
} as unknown as PayoutMethodRow;

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
    payoutsRepo.withTransaction.mockReturnValue(payoutsRepo);
    earningsRepo.withTransaction.mockReturnValue(earningsRepo);
    eventsRepo.withTransaction.mockReturnValue(eventsRepo);

    payoutsRepo.executeTransaction.mockImplementation(
      async <U>(cb: (trx: Kysely<DB>) => Promise<U>) =>
        cb({} as unknown as Kysely<DB>),
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
      methodsRepo.getById.mockResolvedValue(undefined);

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
      payoutsRepo.create.mockResolvedValue({
        id: 'payout-1',
      } as unknown as PayoutCreateResult);

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
      const createCall = payoutsRepo.create.mock.calls[0][0] as CreatePayoutArg;
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
      payoutsRepo.create.mockResolvedValue({
        id: 'payout-2',
      } as unknown as PayoutCreateResult);

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

    // --- Earnings linking ---
    it('links earnings to payout inside transaction', async () => {
      const earnings = uyuEarnings(3, 400);
      methodsRepo.getById.mockResolvedValue(UYU_BANK_METHOD);
      earningsRepo.validateEarningsSelection.mockResolvedValue({
        valid: true,
        earnings,
      });
      payoutsRepo.create.mockResolvedValue({
        id: 'payout-link',
      } as unknown as PayoutCreateResult);

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
      payoutsRepo.create.mockResolvedValue({
        id: 'payout-evt',
      } as unknown as PayoutCreateResult);

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
    beforeEach(() => {
      methodsRepo.getById.mockResolvedValue(UYU_BANK_METHOD);
    });

    it('throws NotFoundError when payout does not exist', async () => {
      payoutsRepo.getById.mockResolvedValue(undefined);

      await expect(
        service.processPayout('nonexistent', 'admin-1', {}),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when payout is not pending', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-1',
        status: 'completed',
      } as unknown as PayoutRow);

      await expect(service.processPayout('p-1', 'admin-1', {})).rejects.toThrow(
        ValidationError,
      );
    });

    it('completes payout, marks earnings as paid_out, and logs event', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-1',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '1200',
        currency: 'UYU',
        payoutMethodId: 'pm-uyu',
        payoutProvider: 'manual_bank',
        metadata: {},
      } as unknown as PayoutRow);
      payoutsRepo.updateStatus.mockResolvedValue({
        id: 'p-1',
      } as unknown as PayoutUpdateResult);

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
      methodsRepo.getById.mockResolvedValue(USD_BANK_METHOD);
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-1',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '60',
        currency: 'USD',
        payoutMethodId: 'pm-usd',
        payoutProvider: 'manual_bank',
        metadata: {},
      } as unknown as PayoutRow);
      payoutsRepo.updateStatus.mockResolvedValue({
        id: 'p-1',
      } as unknown as PayoutUpdateResult);

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
      methodsRepo.getById.mockResolvedValue(USD_BANK_METHOD);
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-fx',
        status: 'pending',
        sellerUserId: 'seller-1',
        amount: '33.77',
        currency: 'USD',
        payoutMethodId: 'pm-usd',
        payoutProvider: 'manual_bank',
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
      } as unknown as PayoutRow);
      payoutsRepo.updateStatus.mockResolvedValue({
        id: 'p-fx',
      } as unknown as PayoutUpdateResult);

      await service.processPayout('p-fx', 'admin-1', {
        actualBankRate: 41.1,
        actualUyuCost: 1388.15,
      });

      const updateCall = payoutsRepo.updateStatus.mock.calls[0];
      const metadata = (
        updateCall[2] as unknown as {
          metadata: {
            fxProcessing: {
              actualBankRate: number;
              actualUyuCost: number;
            };
          };
        }
      ).metadata;
      expect(metadata.fxProcessing.actualBankRate).toBe(41.1);
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
        payoutMethodId: 'pm-uyu',
        payoutProvider: 'manual_bank',
        metadata: {},
      } as unknown as PayoutRow);
      payoutsRepo.updateStatus.mockResolvedValue({
        id: 'p-doc',
      } as unknown as PayoutUpdateResult);

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
      payoutsRepo.getById.mockResolvedValue(undefined);

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
      } as unknown as PayoutRow);
      payoutsRepo.updateStatus.mockResolvedValue({
        id: 'p-fail',
      } as unknown as PayoutUpdateResult);

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
      } as unknown as PayoutRow);
      payoutsRepo.updateStatus.mockResolvedValue({
        id: 'p-fail',
      } as unknown as PayoutUpdateResult);

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
      } as unknown as PayoutRow);
      payoutsRepo.updateStatus.mockResolvedValue({
        id: 'p-cancel',
      } as unknown as PayoutUpdateResult);
    });

    it('throws ValidationError when payout is not pending', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-cancel',
        status: 'completed',
      } as unknown as PayoutRow);

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
      const updateData = payoutsRepo.updateStatus.mock.calls[0][2] as
        | UpdatePayoutStatusArg
        | undefined;
      expect(updateData?.failedAt).toBeUndefined();

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
      } as unknown as PayoutRow);
      payoutsRepo.updateStatus.mockResolvedValue({
        id: 'p-cancel',
      } as unknown as PayoutUpdateResult);

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
      payoutsRepo.getById.mockResolvedValue(undefined);

      await expect(
        service.refreshPayoutRateLock('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when payout is not pending', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-r',
        status: 'completed',
      } as unknown as PayoutRow);

      await expect(
        service.refreshPayoutRateLock('p-r', 'admin-1'),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when payout has no rateLock metadata', async () => {
      payoutsRepo.getById.mockResolvedValue({
        id: 'p-r',
        status: 'pending',
        metadata: {},
      } as unknown as PayoutRow);

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
      } as unknown as PayoutRow);
      // After refresh, the service calls getPayoutDetailsForAdmin which we need to mock
      payoutsRepo.getWithLinkedEarnings.mockResolvedValue({
        id: 'p-r',
        status: 'pending',
        metadata: {rateLock: EXISTING_RATE_LOCK},
        payoutMethodId: 'pm-usd',
      } as unknown as PayoutWithLinkedEarningsRow);
      methodsRepo.getById.mockResolvedValue(USD_BANK_METHOD);
      mockedFetchRate.mockResolvedValue(41.05);

      // mock getPayoutDocuments
      const mockDocs = {getPayoutDocuments: jest.fn().mockResolvedValue([])};
      (
        service as unknown as {payoutDocumentsService: PayoutDocumentsService}
      ).payoutDocumentsService = mockDocs as unknown as PayoutDocumentsService;
      payoutsRepo.getPayoutSettlementInfo.mockResolvedValue(null);

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

      const updatedMeta = (
        payoutsRepo.updateStatus.mock.calls[0][2] as unknown as {
          metadata: {
            rateLock: {convertedAmount: number; brouVentaRate: number};
          };
        }
      ).metadata;
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
      } as unknown as PayoutRow);
      mockedFetchRate.mockResolvedValue(41.05);

      await expect(
        service.refreshPayoutRateLock('p-r', 'admin-1'),
      ).rejects.toThrow(ValidationError);
    });
  });

  // =========================================================================
  describe('PayoutProviderRegistry (strategy)', () => {
    it('selectPayoutProvider returns ManualBankTransferProvider for uruguayan_bank', () => {
      const p = selectPayoutProvider({payoutType: 'uruguayan_bank'});
      expect(p).toBeInstanceOf(ManualBankTransferProvider);
      expect(p.name).toBe('manual_bank');
    });

    it('initiatePayout returns Spanish summary and no externalId', async () => {
      const p = selectPayoutProvider({payoutType: 'uruguayan_bank'});
      const r = await p.initiatePayout({
        payoutId: 'p-x',
        amount: 100,
        currency: 'UYU',
        payoutMethodMetadata: {},
        accountHolderName: 'A',
        accountHolderSurname: 'B',
      });
      expect(r.instructions.summary).toContain(
        'Transferencia bancaria Uruguay',
      );
      expect(r.externalId).toBeUndefined();
    });

    it('processPayout returns completed', async () => {
      const p = selectPayoutProvider({payoutType: 'uruguayan_bank'});
      const r = await p.processPayout({
        payoutId: 'p-x',
        amount: 100,
        currency: 'UYU',
        payoutMethodMetadata: {},
        accountHolderName: 'A',
        accountHolderSurname: 'B',
      });
      expect(r.status).toBe('completed');
    });
  });
});
