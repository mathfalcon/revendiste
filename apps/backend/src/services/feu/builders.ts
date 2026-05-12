import { FEU_SUCURSAL } from '~/config/env';
import type { FeuComprobantePayload } from './types';

/**
 * Emisión de e-ticket sin receptor identificado (consumidor final).
 * No enviamos objeto "cliente" porque no siempre tenemos datos del comprador/vendedor.
 * Payload: sucursal, tipo_comprobante 101, forma_pago 1, moneda, cod_montos_brutos 1,
 * fecha_comprobante, items[], adenda (opcional). id_externo opcional para idempotencia.
 *
 * Number alignment (order ↔ UI ↔ charge ↔ FEU):
 * - Order/UI/charge use @revendiste/shared: calculateOrderFees with rates from env
 *   (PLATFORM_COMMISSION_RATE, VAT_RATE).
 * - We store platformCommission (base) and vatOnCommission = round(base × VAT_RATE).
 * - With cod_montos_brutos 1, FEU treats item precio as TOTAL (IVA incluido). It back-derives
 *   subtotal = total/1.22. So we send precio = base + VAT so the PDF "total" matches what we charge.
 */

/** Doc: fecha_comprobante AAAA-MM-DD, válida 01/10/2011 a 31/12/2050, ≤ hoy + 60 días */
function formatFeuDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Doc: concepto máximo 80 caracteres */
function truncateConcepto(text: string, max = 80): string {
  return text.length <= max ? text : text.slice(0, max - 3) + '...';
}

/** Doc: adenda.texto máximo 150 caracteres */
function truncateAdendaTexto(text: string, max = 150): string {
  return text.length <= max ? text : text.slice(0, max - 3) + '...';
}

/** Order-like shape with commission and event info for invoice building */
export interface OrderWithCommission {
  id: string;
  currency: string;
  platformCommission: string | number;
  vatOnCommission: string | number;
  event?: { name?: string | null } | null;
}

/**
 * Build e-ticket (101) payload for buyer commission invoice.
 * With cod_montos_brutos 1, FEU treats precio as total (IVA incluido) and derives subtotal.
 * We send precio = platformCommission + vatOnCommission so PDF total matches what we charge.
 */
export function buildBuyerInvoicePayload(
  order: OrderWithCommission,
): FeuComprobantePayload {
  const total =
    Number(order.platformCommission) + Number(order.vatOnCommission);
  return {
    sucursal: FEU_SUCURSAL ?? 1,
    tipo_comprobante: 101,
    forma_pago: 1,
    moneda: order.currency,
    cod_montos_brutos: 1,
    fecha_comprobante: formatFeuDate(new Date()),
    id_externo: `revendiste:${order.id}:buyer`,
    items: [
      {
        cantidad: 1,
        concepto: truncateConcepto(
          `Comisión por intermediación (comprador) - Orden ${order.id.slice(0, 8)}`,
        ),
        precio: total,
        indicador_facturacion: 3, // Gravado Tasa Básica 22%; FEU treats precio as total (IVA incluido)
        unidad: 'Un',
      },
    ],
    adenda: {
      texto: truncateAdendaTexto(
        `Evento: ${order.event?.name ?? 'Evento'} | Orden: ${order.id}`,
      ),
    },
  };
}

/**
 * Build e-ticket (101) payload for seller commission invoice.
 * baseAmount and vatAmount are this seller's portion (from their tickets in the order).
 * With cod_montos_brutos 1, FEU treats precio as total (IVA incluido). We send base + VAT.
 */
export function buildSellerInvoicePayload(
  order: OrderWithCommission,
  sellerUserId: string,
  baseAmount: number,
  vatAmount: number,
): FeuComprobantePayload {
  const total = baseAmount + vatAmount;
  return {
    sucursal: FEU_SUCURSAL ?? 1,
    tipo_comprobante: 101, // Doc: 101 = eTicket
    forma_pago: 1, // Doc: 1 = Contado
    moneda: order.currency, // Doc: ISO 4217 (UYU, USD, EUR, etc.)
    cod_montos_brutos: 1,
    fecha_comprobante: formatFeuDate(new Date()),
    id_externo: `revendiste:${order.id}:seller:${sellerUserId}`,
    items: [
      {
        cantidad: 1,
        concepto: truncateConcepto(
          `Comisión por intermediación (vendedor) - Orden ${order.id.slice(0, 8)}`,
        ),
        precio: total, // FEU treats as total (IVA incluido), derives subtotal
        indicador_facturacion: 3,
        unidad: 'Un',
      },
    ],
    adenda: {
      texto: truncateAdendaTexto(
        `Evento: ${order.event?.name ?? 'Evento'} | Orden: ${order.id}`,
      ),
    },
  };
}
