/**
 * Buyer Ticket Cancelled Email Template
 *
 * Sent to buyers when their tickets are cancelled due to seller failure
 * (e.g., seller didn't upload documents before event ended).
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface BuyerTicketCancelledEmailProps {
  eventName: string;
  ticketCount: number;
  reason: 'seller_failed_to_upload' | 'seller_fraud' | 'other';
  orderId: string;
  orderUrl: string;
  appBaseUrl?: string;
}

function getReasonText(
  reason: 'seller_failed_to_upload' | 'seller_fraud' | 'other',
): string {
  switch (reason) {
    case 'seller_failed_to_upload':
      return 'El vendedor no subió los documentos de las entradas a tiempo.';
    case 'seller_fraud':
      return 'Se detectó un problema con el vendedor.';
    case 'other':
    default:
      return 'Hubo un problema con las entradas.';
  }
}

export const BuyerTicketCancelledEmail = ({
  eventName,
  ticketCount,
  reason,
  orderId,
  orderUrl,
  appBaseUrl,
}: BuyerTicketCancelledEmailProps) => {
  const ticketText =
    ticketCount === 1
      ? 'Tu entrada fue cancelada'
      : `Tus ${ticketCount} entradas fueron canceladas`;
  const reasonText = getReasonText(reason);

  return (
    <BaseEmail
      title="Entrada cancelada"
      preview={`${ticketText} para ${eventName}. Ya estamos procesando tu reembolso.`}
      appBaseUrl={appBaseUrl}
    >
      <Text className="text-foreground mb-4">
        Lamentablemente, {ticketText.toLowerCase()} para{' '}
        <strong>{eventName}</strong>.
      </Text>

      {/* Reason Section */}
      <Section className="bg-warning/10 border border-warning/20 p-4 rounded-md mb-4">
        <Text className="text-lg font-semibold text-foreground m-0 mb-2">
          ¿Qué pasó?
        </Text>
        <Text className="text-base text-foreground m-0">{reasonText}</Text>
      </Section>

      {/* What happens next */}
      <Section className="bg-muted/30 p-4 rounded-md mb-4">
        <Text className="text-lg font-semibold text-foreground m-0 mb-2">
          Ya estamos procesando tu reembolso
        </Text>
        <Text className="text-sm text-muted-foreground m-0 mb-2">
          • Nuestro equipo va a procesar tu reembolso lo antes posible.
        </Text>
        <Text className="text-sm text-muted-foreground m-0 mb-2">
          • El dinero vuelve a tu medio de pago original.
        </Text>
        <Text className="text-sm text-muted-foreground m-0">
          • Te avisamos cuando el reembolso esté listo.
        </Text>
      </Section>

      {/* CTA Button */}
      <Section className="text-center mb-6">
        <Button
          href={orderUrl}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
        >
          Ver mis tickets
        </Button>
      </Section>

      <Text className="text-sm text-muted-foreground mb-0">
        Si tenés alguna duda, escribinos desde tu cuenta. Disculpá las
        molestias.
      </Text>
    </BaseEmail>
  );
};

BuyerTicketCancelledEmail.PreviewProps = {
  eventName: 'Bad Bunny - Most Wanted Tour',
  ticketCount: 2,
  reason: 'seller_failed_to_upload',
  orderId: '123e4567-e89b-12d3-a456-426614174000',
  orderUrl: 'https://revendiste.com/cuenta/tickets?orderId=123',
} as BuyerTicketCancelledEmailProps;

export default BuyerTicketCancelledEmail;
