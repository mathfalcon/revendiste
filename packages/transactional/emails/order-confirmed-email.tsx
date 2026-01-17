/**
 * Order Confirmed Email Template
 *
 * Sent to buyers when their order is confirmed.
 */

import React from 'react';
import {Button, Section, Text, Hr} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface OrderItem {
  id: string;
  ticketWaveName: string;
  quantity: number;
  pricePerTicket: string;
  subtotal: string;
  currency?: string;
}

export interface OrderConfirmedEmailProps {
  eventName: string;
  eventStartDate?: string;
  eventEndDate?: string;
  venueName?: string;
  venueAddress?: string;
  flyerImageUrl?: string;
  orderId: string;
  confirmedAt?: string;
  totalAmount: string;
  subtotalAmount: string;
  platformCommission: string;
  vatOnCommission: string;
  currency: string;
  items: OrderItem[];
  orderUrl: string;
  appBaseUrl?: string;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('es-UY', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

function formatPrice(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return `${num.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export const OrderConfirmedEmail = ({
  eventName,
  eventStartDate,
  eventEndDate,
  venueName,
  venueAddress,
  flyerImageUrl,
  orderId,
  confirmedAt,
  totalAmount,
  subtotalAmount,
  platformCommission,
  vatOnCommission,
  currency,
  items,
  orderUrl,
  appBaseUrl,
}: OrderConfirmedEmailProps) => (
  <BaseEmail
    title="¡Pago confirmado!"
    preview={`Tu orden para ${eventName} fue confirmada exitosamente`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Tu compra se procesó correctamente. Tu orden para{' '}
      <strong>{eventName}</strong> ya está confirmada.
    </Text>

    {/* CTA Button - Moved up to prevent truncation */}
    <Section className="text-center mb-6">
      <Button
        href={orderUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Ver mis tickets
      </Button>
    </Section>

    {/* Event Details */}
    <Section className="bg-muted/30 p-4 rounded-md mb-4">
      <Text className="text-lg font-semibold text-foreground m-0 mb-3">
        Detalles del evento
      </Text>
      {flyerImageUrl && (
        <img
          src={flyerImageUrl}
          alt={`Flyer de ${eventName}`}
          style={{
            width: '128px',
            height: '128px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        />
      )}
      <Text className="text-base font-medium text-foreground m-0 mb-2">
        {eventName}
      </Text>
      {eventStartDate && (
        <Text className="text-sm text-muted-foreground m-0 mb-1">
          📅 {formatDate(eventStartDate)}
        </Text>
      )}
      {venueName && (
        <Text className="text-sm text-muted-foreground m-0">
          📍 {venueName}
          {venueAddress && ` - ${venueAddress}`}
        </Text>
      )}
    </Section>

    {/* Order Details */}
    <Section className="mb-4">
      <Text className="text-lg font-semibold text-foreground m-0 mb-2">
        Detalles de la orden
      </Text>
      <Text className="text-sm text-muted-foreground m-0 mb-1">
        Orden ID: <span style={{fontFamily: 'monospace'}}>{orderId}</span>
      </Text>
      {confirmedAt && (
        <Text className="text-sm text-muted-foreground m-0">
          Confirmada el: {formatDate(confirmedAt)}
        </Text>
      )}
    </Section>

    {/* Tickets - grouped by ticket wave */}
    <Section className="mb-4">
      <Text className="text-lg font-semibold text-foreground m-0 mb-3">
        Tus entradas
      </Text>
      {items.map(item => (
        <div
          key={item.id}
          style={{
            borderRadius: '8px',
            marginBottom: '12px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Ticket Wave Header */}
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '10px 14px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <Text className="text-sm font-semibold text-foreground m-0">
              {item.ticketWaveName}
            </Text>
          </div>

          {/* Ticket Item */}
          <div
            style={{
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              role="presentation"
            >
              <tr>
                <td style={{verticalAlign: 'middle'}}>
                  {/* Ticket Icon + Info */}
                  <table cellPadding="0" cellSpacing="0" role="presentation">
                    <tr>
                      <td
                        style={{verticalAlign: 'middle', paddingRight: '12px'}}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(222, 36, 134, 0.1)',
                            display: 'table-cell',
                            verticalAlign: 'middle',
                            textAlign: 'center',
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#de2486"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{verticalAlign: 'middle'}}
                          >
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                            <path d="M13 5v2" />
                            <path d="M13 17v2" />
                            <path d="M13 11v2" />
                          </svg>
                        </div>
                      </td>
                      <td style={{verticalAlign: 'middle'}}>
                        <Text className="text-sm font-medium text-foreground m-0">
                          {item.quantity}{' '}
                          {item.quantity === 1 ? 'entrada' : 'entradas'}
                        </Text>
                        <Text className="text-xs text-muted-foreground m-0">
                          {formatPrice(
                            item.pricePerTicket,
                            item.currency || currency,
                          )}{' '}
                          c/u
                        </Text>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style={{verticalAlign: 'middle', textAlign: 'right'}}>
                  <Text className="text-base font-semibold text-foreground m-0">
                    {formatPrice(item.subtotal, item.currency || currency)}
                  </Text>
                </td>
              </tr>
            </table>
          </div>
        </div>
      ))}
    </Section>

    {/* Payment Summary */}
    <Section className="mb-4">
      <Hr className="border-border my-3" />
      <Text className="text-sm text-foreground m-0 mb-1">
        Subtotal: {formatPrice(subtotalAmount, currency)}
      </Text>
      <Text className="text-sm text-muted-foreground m-0 mb-1">
        Comisión de plataforma (6%): {formatPrice(platformCommission, currency)}
      </Text>
      <Text className="text-sm text-muted-foreground m-0 mb-3">
        IVA sobre comisión (22%): {formatPrice(vatOnCommission, currency)}
      </Text>
      <Hr className="border-border my-3" />
      <Text className="text-lg font-bold text-foreground m-0">
        Total pagado: {formatPrice(totalAmount, currency)}
      </Text>
    </Section>

    {/* Next Steps */}
    <Section className="bg-muted/30 p-4 rounded-md mb-4">
      <Text className="text-base font-semibold text-foreground m-0 mb-2">
        ¿Qué sigue ahora?
      </Text>
      <Text className="text-sm text-muted-foreground m-0 mb-1">
        ✓ Revisá tu correo para encontrar todos los detalles de tu compra
      </Text>
      <Text className="text-sm text-muted-foreground m-0 mb-1">
        ✓ Accedé a tus entradas cuando quieras desde tu perfil
      </Text>
      <Text className="text-sm text-muted-foreground m-0">
        ✓ Te vamos a avisar cuando el vendedor suba los documentos de tus
        tickets
      </Text>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Presentá tu entrada digital en la entrada del evento. Si tenés alguna
      duda, podés contactarnos a ayuda@revendiste.com.
    </Text>
  </BaseEmail>
);

OrderConfirmedEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  eventStartDate: new Date().toISOString(),
  venueName: 'Teatro Solís',
  venueAddress: 'Buenos Aires 678, Montevideo',
  orderId: '123e4567-e89b-12d3-a456-426614174000',
  confirmedAt: new Date().toISOString(),
  totalAmount: '250.00',
  subtotalAmount: '235.85',
  platformCommission: '14.15',
  vatOnCommission: '3.11',
  currency: 'EUR',
  items: [
    {
      id: '1',
      ticketWaveName: 'General',
      quantity: 2,
      pricePerTicket: '70.75',
      subtotal: '141.50',
      currency: 'EUR',
    },
    {
      id: '2',
      ticketWaveName: 'VIP',
      quantity: 1,
      pricePerTicket: '94.35',
      subtotal: '94.35',
      currency: 'EUR',
    },
  ],
  orderUrl: 'https://revendiste.com/cuenta/tickets?orderId=123',
} as OrderConfirmedEmailProps;

export default OrderConfirmedEmail;
