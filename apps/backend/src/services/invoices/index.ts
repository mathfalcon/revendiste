import { roundOrderAmount } from '@revendiste/shared';
import { logger } from '~/utils';
import {
  InvoicesRepository,
  OrderTicketReservationsRepository,
  OrdersRepository,
} from '~/repositories';
import { FeuClient } from '~/services/feu';
import {
  buildBuyerInvoicePayload,
  buildSellerInvoicePayload,
} from '~/services/feu/builders';
import { calculateSellerAmount } from '~/utils/fees';
import type { IStorageProvider } from '~/services/storage/IStorageProvider';
import type { Invoices } from '@revendiste/shared';

export interface InvoiceServiceDeps {
  invoicesRepository: InvoicesRepository;
  ordersRepository: OrdersRepository;
  orderTicketReservationsRepository: OrderTicketReservationsRepository;
  feuClient: FeuClient;
  storageProvider: IStorageProvider;
}

/**
 * Issues electronic invoices via FEU and stores PDFs.
 * Returns PDF buffer for email attachment.
 * For seller invoices, pass sellerUserId so we issue one invoice per seller with their commission share.
 */
export class InvoiceService {
  constructor(private readonly deps: InvoiceServiceDeps) {}

  /**
   * Issue an invoice for an order party.
   * For party 'seller', sellerUserId is required and we issue one invoice per seller with commission from that seller's tickets.
   */
  async issueInvoice(
    orderId: string,
    party: 'buyer' | 'seller',
    sellerUserId?: string,
  ): Promise<{
    pdfBuffer: Buffer;
    invoice: Invoices;
    sellerBreakdown?: {
      sellerSubtotal: string;
      sellerCommission: string;
      sellerVat: string;
      sellerAmount: string;
      currency: string;
    };
  }> {
    const {
      invoicesRepository,
      ordersRepository,
      orderTicketReservationsRepository,
      feuClient,
      storageProvider,
    } = this.deps;

    if (party === 'seller' && !sellerUserId) {
      throw new Error('sellerUserId is required when party is seller');
    }

    const sellerIdForQuery = party === 'seller' ? sellerUserId : null;
    let invoice = await invoicesRepository.getByOrderAndParty(
      orderId,
      party,
      sellerIdForQuery ?? undefined,
    );

    if (
      invoice?.status === 'issued' &&
      invoice.pdfStoragePath
    ) {
      const pdfBuffer = await storageProvider.getBuffer(invoice.pdfStoragePath);
      return { pdfBuffer, invoice: invoice as unknown as Invoices };
    }

    const order = await ordersRepository.getByIdWithItems(orderId);
    if (!order || order.status !== 'confirmed') {
      throw new Error(`Order ${orderId} not found or not confirmed`);
    }

    if (party === 'buyer') {
      if (!invoice) {
        invoice = await invoicesRepository.create({
          orderId,
          party: 'buyer',
          sellerUserId: null,
          status: 'pending',
          externalId: `revendiste:${orderId}:buyer`,
          baseAmount: order.platformCommission,
          vatAmount: order.vatOnCommission,
          totalAmount: String(
            Number(order.platformCommission) + Number(order.vatOnCommission),
          ),
          currency: order.currency,
        });
      }

      const payload = buildBuyerInvoicePayload(order);
      return this.issueAndUpload(
        invoicesRepository,
        feuClient,
        storageProvider,
        orderId,
        invoice!,
        payload,
        'buyer',
        'buyer-invoice',
      );
    }

    // Seller: compute this seller's commission from their tickets in the order.
    // Same per-ticket logic as SellerEarningsService.createEarningFromSale (calculateSellerAmount(price));
    // invoice total = sum(platformCommission + vatOnCommission) = sum(price - sellerAmount) for this seller's tickets.
    const ticketsWithSeller =
      await orderTicketReservationsRepository.getByOrderIdWithSellerAndPrice(
        orderId,
      );
    const thisSellerTickets = ticketsWithSeller.filter(
      row => row.publisherUserId === sellerUserId,
    );
    if (thisSellerTickets.length === 0) {
      throw new Error(
        `No tickets found for seller ${sellerUserId} in order ${orderId}`,
      );
    }

    let sellerBaseAmount = 0;
    let sellerVatAmount = 0;
    let sellerSubtotalSum = 0;
    let sellerAmountSum = 0;
    for (const row of thisSellerTickets) {
      const price = Number(row.price);
      const fee = calculateSellerAmount(price);
      sellerBaseAmount += Number(fee.platformCommission);
      sellerVatAmount += Number(fee.vatOnCommission);
      sellerSubtotalSum += price;
      sellerAmountSum += Number(fee.totalAmount);
    }
    sellerBaseAmount = Number(roundOrderAmount(String(sellerBaseAmount)));
    sellerVatAmount = Number(roundOrderAmount(String(sellerVatAmount)));
    const sellerTotal = sellerBaseAmount + sellerVatAmount;
    const sellerSubtotalRounded = Number(roundOrderAmount(String(sellerSubtotalSum)));
    const sellerAmountRounded = Number(roundOrderAmount(String(sellerAmountSum)));

    if (!invoice) {
      invoice = await invoicesRepository.create({
        orderId,
        party: 'seller',
        sellerUserId: sellerUserId!,
        status: 'pending',
        externalId: `revendiste:${orderId}:seller:${sellerUserId}`,
        baseAmount: String(sellerBaseAmount),
        vatAmount: String(sellerVatAmount),
        totalAmount: String(sellerTotal),
        currency: order.currency,
      });
    }

    const payload = buildSellerInvoicePayload(
      order,
      sellerUserId!,
      sellerBaseAmount,
      sellerVatAmount,
    );
    const result = await this.issueAndUpload(
      invoicesRepository,
      feuClient,
      storageProvider,
      orderId,
      invoice!,
      payload,
      'seller',
      `seller-${sellerUserId}-invoice`,
    );
    return {
      ...result,
      sellerBreakdown: {
        sellerSubtotal: String(sellerSubtotalRounded),
        sellerCommission: String(sellerBaseAmount),
        sellerVat: String(sellerVatAmount),
        sellerAmount: String(sellerAmountRounded),
        currency: order.currency,
      },
    };
  }

  private async issueAndUpload(
    invoicesRepository: InvoicesRepository,
    feuClient: FeuClient,
    storageProvider: IStorageProvider,
    orderId: string,
    invoice: Awaited<ReturnType<InvoicesRepository['getById']>> & {
      id: string;
      orderId: string;
      party: 'buyer' | 'seller';
      pdfStoragePath: string | null;
      providerResponse: unknown;
    },
    payload: Parameters<FeuClient['createComprobante']>[0],
    party: 'buyer' | 'seller',
    filename: string,
  ): Promise<{ pdfBuffer: Buffer; invoice: Invoices }> {
    const feuResponse = await feuClient.createComprobante(payload);
    const pdfBuffer = await feuClient.getPdfByCfeId(feuResponse.id);

    const uploadResult = await storageProvider.upload(pdfBuffer, {
      directory: `invoices/${orderId}`,
      filename,
      mimeType: 'application/pdf',
      originalName: `factura-${party}.pdf`,
      sizeBytes: pdfBuffer.length,
    });

    const updated = await invoicesRepository.update(invoice.id, {
      status: 'issued',
      providerResponse: { ...feuResponse },
      pdfStoragePath: uploadResult.path,
      issuedAt: new Date(),
    });

    if (!updated) {
      throw new Error('Failed to update invoice after FEU issuance');
    }

    logger.info('Invoice issued successfully', {
      invoiceId: updated.id,
      orderId,
      party,
      sellerUserId: updated.sellerUserId ?? undefined,
      serie: feuResponse.serie,
      numero: feuResponse.numero,
    });

    return { pdfBuffer, invoice: updated as unknown as Invoices };
  }

  /**
   * Mark invoice email as sent
   */
  async markEmailSent(invoiceId: string): Promise<void> {
    await this.deps.invoicesRepository.update(invoiceId, {
      emailSentAt: new Date(),
    });
  }
}
