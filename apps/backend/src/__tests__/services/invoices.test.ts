/**
 * InvoiceService tests with mocked repositories, FEU client, and storage.
 */
import { InvoiceService } from '~/services/invoices';
import type {
  InvoicesRepository,
  OrderTicketReservationsRepository,
  OrdersRepository,
} from '~/repositories';
import type { FeuClient } from '~/services/feu/FeuClient';
import type { IStorageProvider } from '~/services/storage/IStorageProvider';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockInvoicesRepository: jest.Mocked<InvoicesRepository>;
  let mockOrdersRepository: jest.Mocked<OrdersRepository>;
  let mockOrderTicketReservationsRepository: jest.Mocked<OrderTicketReservationsRepository>;
  let mockFeuClient: jest.Mocked<FeuClient>;
  let mockStorageProvider: jest.Mocked<IStorageProvider>;

  beforeEach(() => {
    mockInvoicesRepository = {
      getByOrderAndParty: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      getById: jest.fn(),
      getFailedInvoices: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<InvoicesRepository>;

    mockOrdersRepository = {
      getByIdWithItems: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;

    mockOrderTicketReservationsRepository = {
      getByOrderIdWithSellerAndPrice: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrderTicketReservationsRepository>;

    mockFeuClient = {
      createComprobante: jest.fn(),
      getPdfByCfeId: jest.fn(),
    } as unknown as jest.Mocked<FeuClient>;

    mockStorageProvider = {
      getBuffer: jest.fn(),
      upload: jest.fn(),
    } as unknown as jest.Mocked<IStorageProvider>;

    service = new InvoiceService({
      invoicesRepository: mockInvoicesRepository,
      ordersRepository: mockOrdersRepository,
      orderTicketReservationsRepository: mockOrderTicketReservationsRepository,
      feuClient: mockFeuClient,
      storageProvider: mockStorageProvider,
    });
  });

  describe('issueInvoice', () => {
    it('returns existing issued invoice and PDF buffer when invoice already issued (idempotency)', async () => {
      const existingInvoice = {
        id: 'inv-1',
        orderId: 'order-1',
        party: 'buyer',
        status: 'issued',
        pdfStoragePath: 'invoices/order-1/buyer-invoice.pdf',
      } as any;
      const pdfBuffer = Buffer.from('pdf-content');

      mockInvoicesRepository.getByOrderAndParty.mockResolvedValue(existingInvoice);
      mockStorageProvider.getBuffer.mockResolvedValue(pdfBuffer);

      const result = await service.issueInvoice('order-1', 'buyer');

      expect(result.pdfBuffer).toBe(pdfBuffer);
      expect(result.invoice).toEqual(existingInvoice);
      expect(mockInvoicesRepository.getByOrderAndParty).toHaveBeenCalledWith(
        'order-1',
        'buyer',
        undefined,
      );
      expect(mockStorageProvider.getBuffer).toHaveBeenCalledWith(
        'invoices/order-1/buyer-invoice.pdf',
      );
      expect(mockOrdersRepository.getByIdWithItems).not.toHaveBeenCalled();
      expect(mockFeuClient.createComprobante).not.toHaveBeenCalled();
    });

    it('throws when order is not found', async () => {
      mockInvoicesRepository.getByOrderAndParty.mockResolvedValue(undefined);
      mockOrdersRepository.getByIdWithItems.mockResolvedValue(undefined);

      await expect(service.issueInvoice('order-missing', 'buyer')).rejects.toThrow(
        'Order order-missing not found or not confirmed',
      );

      expect(mockFeuClient.createComprobante).not.toHaveBeenCalled();
    });

    it('throws when order is not confirmed', async () => {
      mockInvoicesRepository.getByOrderAndParty.mockResolvedValue(undefined);
      mockOrdersRepository.getByIdWithItems.mockResolvedValue({
        id: 'order-1',
        status: 'pending',
      } as any);

      await expect(service.issueInvoice('order-1', 'buyer')).rejects.toThrow(
        'Order order-1 not found or not confirmed',
      );

      expect(mockFeuClient.createComprobante).not.toHaveBeenCalled();
    });

    it('creates invoice via FEU and storage when no existing issued invoice', async () => {
      const confirmedOrder = {
        id: 'order-1',
        status: 'confirmed',
        userId: 'user-1',
        platformCommission: '10',
        vatOnCommission: '2',
        currency: 'UYU',
        totalAmount: '100',
        subtotalAmount: '88',
        items: [],
        event: {},
      } as any;
      const pendingInvoice = {
        id: 'inv-1',
        orderId: 'order-1',
        party: 'buyer',
        status: 'pending',
      } as any;
      const feuResponse = { id: 12345, serie: 'A', numero: 1 } as any;
      const pdfBuffer = Buffer.from('pdf-bytes');
      const uploadPath = 'invoices/order-1/buyer-invoice.pdf';
      const updatedInvoice = {
        ...pendingInvoice,
        status: 'issued',
        pdfStoragePath: uploadPath,
      } as any;

      mockInvoicesRepository.getByOrderAndParty.mockResolvedValue(undefined);
      mockOrdersRepository.getByIdWithItems.mockResolvedValue(confirmedOrder);
      mockInvoicesRepository.create.mockResolvedValue(pendingInvoice);
      mockFeuClient.createComprobante.mockResolvedValue(feuResponse);
      mockFeuClient.getPdfByCfeId.mockResolvedValue(pdfBuffer);
      mockStorageProvider.upload.mockResolvedValue({ path: uploadPath } as any);
      mockInvoicesRepository.update.mockResolvedValue(updatedInvoice);

      const result = await service.issueInvoice('order-1', 'buyer');

      expect(result.pdfBuffer).toBe(pdfBuffer);
      expect(result.invoice.status).toBe('issued');
      expect(result.invoice.pdfStoragePath).toBe(uploadPath);
      expect(mockInvoicesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          party: 'buyer',
          sellerUserId: null,
        }),
      );
      expect(mockFeuClient.createComprobante).toHaveBeenCalled();
      expect(mockFeuClient.getPdfByCfeId).toHaveBeenCalledWith(12345);
      expect(mockStorageProvider.upload).toHaveBeenCalledWith(
        pdfBuffer,
        expect.objectContaining({
          directory: 'invoices/order-1',
          filename: 'buyer-invoice',
          mimeType: 'application/pdf',
        }),
      );
      expect(mockInvoicesRepository.update).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({
          status: 'issued',
          pdfStoragePath: uploadPath,
        }),
      );
    });
  });

  describe('markEmailSent', () => {
    it('updates invoice with emailSentAt', async () => {
      mockInvoicesRepository.update.mockResolvedValue({} as any);

      await service.markEmailSent('inv-1');

      expect(mockInvoicesRepository.update).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({
          emailSentAt: expect.any(Date),
        }),
      );
    });
  });
});
