/**
 * Order Invoice Email Template
 *
 * Sent to buyer or seller with the invoice PDF attached (deferred send after FEU issuance).
 * Shows a detailed breakdown: buyer = price paid + commission + total; seller = published total + commission + amount to receive.
 */

import React from 'react';
import {Section, Text, Hr} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface OrderInvoiceItem {
  ticketWaveName: string;
  quantity: number;
  pricePerTicket: string;
  subtotal: string;
}

export interface OrderInvoiceEmailProps {
  orderId: string;
  party: 'buyer' | 'seller';
  eventName?: string;
  appBaseUrl?: string;
  currency?: string;
  // Buyer breakdown
  subtotalAmount?: string;
  platformCommission?: string;
  vatOnCommission?: string;
  totalAmount?: string;
  items?: OrderInvoiceItem[];
  // Seller breakdown
  sellerSubtotal?: string;
  sellerCommission?: string;
  sellerVat?: string;
  sellerAmount?: string;
}

function formatPrice(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return `${num.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export const OrderInvoiceEmail = ({
  orderId,
  party,
  eventName,
  appBaseUrl,
  currency = 'UYU',
  subtotalAmount,
  platformCommission,
  vatOnCommission,
  totalAmount,
  items,
  sellerSubtotal,
  sellerCommission,
  sellerVat,
  sellerAmount,
}: OrderInvoiceEmailProps) => {
  const isBuyer = party === 'buyer';
  const title = isBuyer ? 'Tu factura de compra' : 'Tu factura de venta';
  const description = isBuyer
    ? 'Adjuntamos la factura de tu compra.'
    : 'Adjuntamos la factura correspondiente a la venta de tus entradas.';

  const hasBuyerBreakdown =
    isBuyer &&
    subtotalAmount != null &&
    platformCommission != null &&
    vatOnCommission != null &&
    totalAmount != null;
  const hasSellerBreakdown =
    !isBuyer &&
    sellerSubtotal != null &&
    sellerCommission != null &&
    sellerVat != null &&
    sellerAmount != null;

  return (
    <BaseEmail
      title={title}
      preview={eventName ? `${title} - ${eventName}` : title}
      appBaseUrl={appBaseUrl}
    >
      <Text className="text-foreground mb-4">
        {description}
        {eventName && (
          <>
            {' '}
            Evento: <strong>{eventName}</strong>.
          </>
        )}
      </Text>

      {hasBuyerBreakdown && (
        <Section className="mb-6">
          <Text className="text-foreground font-semibold mb-2">
            Detalle de tu compra
          </Text>
          {items && items.length > 0 && (
            <Section className="bg-muted p-4 rounded-md mb-3">
              {items.map((item, i) => (
                <Text
                  key={i}
                  className="text-sm text-foreground m-0 mb-1"
                  style={{marginBottom: '4px'}}
                >
                  {item.ticketWaveName}: {item.quantity} ×{' '}
                  {formatPrice(item.pricePerTicket, currency)} ={' '}
                  {formatPrice(item.subtotal, currency)}
                </Text>
              ))}
            </Section>
          )}
          <Section className="bg-muted p-4 rounded-md">
            <Text className="text-sm text-foreground m-0 mb-1">
              Subtotal (entradas): {formatPrice(subtotalAmount!, currency)}
            </Text>
            <Text className="text-sm text-foreground m-0 mb-1">
              Comisión por intermediación: {formatPrice(platformCommission!, currency)}
            </Text>
            <Text className="text-sm text-foreground m-0 mb-1">
              IVA sobre comisión: {formatPrice(vatOnCommission!, currency)}
            </Text>
            <Hr className="border-border my-2" />
            <Text className="text-sm font-semibold text-foreground m-0">
              Total pagado: {formatPrice(totalAmount!, currency)}
            </Text>
          </Section>
        </Section>
      )}

      {hasSellerBreakdown && (
        <Section className="mb-6">
          <Text className="text-foreground font-semibold mb-2">
            Detalle de tu venta
          </Text>
          <Section className="bg-muted p-4 rounded-md">
            <Text className="text-sm text-foreground m-0 mb-1">
              Precio publicado (tus entradas):{' '}
              {formatPrice(sellerSubtotal!, currency)}
            </Text>
            <Text className="text-sm text-foreground m-0 mb-1">
              Comisión por intermediación: {formatPrice(sellerCommission!, currency)}
            </Text>
            <Text className="text-sm text-foreground m-0 mb-1">
              IVA sobre comisión: {formatPrice(sellerVat!, currency)}
            </Text>
            <Hr className="border-border my-2" />
            <Text className="text-sm font-semibold text-foreground m-0">
              Total a recibir: {formatPrice(sellerAmount!, currency)}
            </Text>
          </Section>
        </Section>
      )}

      <Section className="bg-muted p-4 rounded-md mb-6">
        <Text className="text-sm text-foreground m-0">
          La factura en PDF está adjunta a este correo.
        </Text>
      </Section>
    </BaseEmail>
  );
};

OrderInvoiceEmail.PreviewProps = {
  orderId: '00000000-0000-0000-0000-000000000001',
  party: 'buyer' as const,
  eventName: 'Key Presenta Mau P & More',
  currency: 'UYU',
  subtotalAmount: '1000.00',
  platformCommission: '60.00',
  vatOnCommission: '13.20',
  totalAmount: '1073.20',
  items: [
    {
      ticketWaveName: 'Entrada general',
      quantity: 2,
      pricePerTicket: '500.00',
      subtotal: '1000.00',
    },
  ],
} as OrderInvoiceEmailProps;

export default OrderInvoiceEmail;
