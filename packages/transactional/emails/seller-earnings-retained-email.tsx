/**
 * Seller Earnings Retained Email Template
 *
 * Sent to sellers when their earnings are retained due to missing documents
 * or other issues.
 */

import React from 'react';
import {Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface SellerEarningsRetainedEmailProps {
  eventName: string;
  ticketCount: number;
  reason: 'missing_document' | 'dispute' | 'fraud' | 'other';
  totalAmount?: string;
  currency?: 'UYU' | 'USD';
  appBaseUrl?: string;
}

function getReasonText(
  reason: 'missing_document' | 'dispute' | 'fraud' | 'other',
): string {
  switch (reason) {
    case 'missing_document':
      return 'No subiste los documentos de los tickets antes de que el evento terminara.';
    case 'dispute':
      return 'El comprador abrió una disputa sobre los tickets.';
    case 'fraud':
      return 'Se detectó actividad sospechosa en tu cuenta.';
    case 'other':
    default:
      return 'Se detectó un problema con los tickets.';
  }
}

export const SellerEarningsRetainedEmail = ({
  eventName,
  ticketCount,
  reason,
  totalAmount,
  currency,
  appBaseUrl,
}: SellerEarningsRetainedEmailProps) => {
  const ticketText =
    ticketCount === 1 ? '1 ticket' : `${ticketCount} tickets`;
  const reasonText = getReasonText(reason);

  return (
    <BaseEmail
      title="Ganancias retenidas"
      preview={`Tus ganancias por ${ticketText} de ${eventName} fueron retenidas`}
      appBaseUrl={appBaseUrl}
    >
      <Text className="text-foreground mb-4">
        Lamentamos informarte que tus ganancias por la venta de{' '}
        <strong>{ticketText}</strong> para <strong>{eventName}</strong> han sido
        retenidas.
      </Text>

      {/* Reason Section */}
      <Section className="bg-destructive/10 border border-destructive/20 p-4 rounded-md mb-4">
        <Text className="text-lg font-semibold text-foreground m-0 mb-2">
          Motivo de la retención
        </Text>
        <Text className="text-base text-foreground m-0">{reasonText}</Text>
      </Section>

      {/* What happens next */}
      <Section className="bg-muted/30 p-4 rounded-md mb-4">
        <Text className="text-lg font-semibold text-foreground m-0 mb-2">
          ¿Qué sucede ahora?
        </Text>
        <Text className="text-sm text-muted-foreground m-0 mb-2">
          • El comprador será reembolsado por los tickets afectados.
        </Text>
        <Text className="text-sm text-muted-foreground m-0 mb-2">
          • Las ganancias retenidas quedarán bajo revisión de nuestro equipo.
        </Text>
        <Text className="text-sm text-muted-foreground m-0">
          • Si tenés dudas, podés contactarnos desde tu cuenta.
        </Text>
      </Section>

      {totalAmount && currency && (
        <Text className="text-sm text-muted-foreground mb-0">
          Monto retenido:{' '}
          {parseFloat(totalAmount).toLocaleString('es-UY', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          {currency}
        </Text>
      )}

      <Text className="text-sm text-muted-foreground mb-0 mt-4">
        Recordá que es importante subir los documentos de tus tickets a tiempo
        para evitar retenciones futuras.
      </Text>
    </BaseEmail>
  );
};

SellerEarningsRetainedEmail.PreviewProps = {
  eventName: 'Bad Bunny - Most Wanted Tour',
  ticketCount: 2,
  reason: 'missing_document',
  totalAmount: '3500.00',
  currency: 'UYU',
} as SellerEarningsRetainedEmailProps;

export default SellerEarningsRetainedEmail;
