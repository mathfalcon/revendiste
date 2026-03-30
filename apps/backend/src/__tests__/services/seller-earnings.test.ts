/**
 * SellerEarningsService tests with mocked repositories.
 */
import {SellerEarningsService} from '~/services/seller-earnings';
import type {
  SellerEarningsRepository,
  OrderTicketReservationsRepository,
} from '~/repositories';

describe('SellerEarningsService', () => {
  let service: SellerEarningsService;
  let mockSellerEarningsRepository: jest.Mocked<SellerEarningsRepository>;
  let mockOrderTicketReservationsRepository: jest.Mocked<OrderTicketReservationsRepository>;

  beforeEach(() => {
    mockSellerEarningsRepository = {
      getEarningsByListingTicketIds: jest.fn(),
      getTicketDataForEarnings: jest.fn(),
      getListingPublisherUserId: jest.fn(),
      create: jest.fn(),
      getEarningsReadyForRelease: jest.fn(),
      updateStatus: jest.fn(),
      executeTransaction: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<SellerEarningsRepository>;

    mockOrderTicketReservationsRepository = {
      getByOrderId: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrderTicketReservationsRepository>;

    service = new SellerEarningsService(
      mockSellerEarningsRepository,
      mockOrderTicketReservationsRepository,
    );
  });

  describe('createEarningsForSoldTickets', () => {
    it('does nothing when no reservations exist for order', async () => {
      mockOrderTicketReservationsRepository.getByOrderId.mockResolvedValue([]);

      await service.createEarningsForSoldTickets('order-1');

      expect(mockSellerEarningsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('createEarningFromSale', () => {
    it('skips create when active earning already exists for ticket (idempotency)', async () => {
      mockSellerEarningsRepository.getEarningsByListingTicketIds.mockResolvedValue([
        { id: 'e1', listingTicketId: 'lt1', status: 'available' },
      ] as any);

      await service.createEarningFromSale('lt1');

      expect(mockSellerEarningsRepository.create).not.toHaveBeenCalled();
      expect(mockSellerEarningsRepository.getTicketDataForEarnings).not.toHaveBeenCalled();
    });
  });

  describe('checkHoldPeriods', () => {
    it('processes earnings in batches of 50', async () => {
      const sixtyIds = Array.from({ length: 60 }, (_, i) => ({
        id: `earnings-${i + 1}`,
      }));
      mockSellerEarningsRepository.getEarningsReadyForRelease.mockResolvedValue(
        sixtyIds as any,
      );
      mockSellerEarningsRepository.executeTransaction.mockImplementation(
        async callback => callback({} as any),
      );
      mockSellerEarningsRepository.withTransaction.mockReturnValue(
        mockSellerEarningsRepository as any,
      );

      const result = await service.checkHoldPeriods(100);

      expect(result.released).toBe(60);
      expect(mockSellerEarningsRepository.updateStatus).toHaveBeenCalledTimes(2);
      expect(mockSellerEarningsRepository.updateStatus).toHaveBeenNthCalledWith(
        1,
        sixtyIds.slice(0, 50).map(e => e.id),
        'available',
      );
      expect(mockSellerEarningsRepository.updateStatus).toHaveBeenNthCalledWith(
        2,
        sixtyIds.slice(50, 60).map(e => e.id),
        'available',
      );
    });
  });
});
