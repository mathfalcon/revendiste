/**
 * Payout Cancelled Email Template
 *
 * Sent to sellers when their payout is cancelled.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface PayoutCancelledEmailProps {
  payoutId: string;
  amount: string;
  currency: 'UYU' | 'USD';
  cancellationReason: string;
  payoutUrl: string;
  appBaseUrl?: string;
}

function formatPrice(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return `${num.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export const PayoutCancelledEmail = ({
  payoutId,
  amount,
  currency,
  cancellationReason,
  payoutUrl,
  appBaseUrl,
}: PayoutCancelledEmailProps) => (
  <BaseEmail
    title="Retiro cancelado"
    preview={`Tu retiro de ${formatPrice(amount, currency)} ha sido cancelado`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Tu solicitud de retiro ha sido cancelada. Por favor, revisá los detalles a
      continuación.
    </Text>

    {/* CTA Button */}
    <Section className="text-center mb-6">
      <Button
        href={payoutUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Ver detalles del retiro
      </Button>
    </Section>

    {/* Payout Details */}
    <Section className="bg-muted/30 p-4 rounded-md mb-4">
      <Text className="text-lg font-semibold text-foreground m-0 mb-3">
        Detalles del retiro
      </Text>
      <Text className="text-sm text-muted-foreground m-0 mb-1">
        Retiro ID: <span style={{fontFamily: 'monospace'}}>{payoutId}</span>
      </Text>
      <Text className="text-base font-medium text-foreground m-0 mb-3">
        Monto: {formatPrice(amount, currency)}
      </Text>
      <Text className="text-base font-semibold text-foreground m-0 mb-2">
        Motivo de cancelación:
      </Text>
      <Text className="text-sm text-muted-foreground m-0">
        {cancellationReason}
      </Text>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Tu dinero sigue disponible en tu balance y podés solicitar un nuevo retiro
      cuando quieras. Si tenés alguna duda, podés contactarnos a
      soporte@revendiste.com.
    </Text>
  </BaseEmail>
);

PayoutCancelledEmail.PreviewProps = {
  payoutId: '123e4567-e89b-12d3-a456-426614174000',
  amount: '1500.00',
  currency: 'UYU',
  cancellationReason: 'Solicitud cancelada por el usuario',
  payoutUrl: 'https://revendiste.com/cuenta/retiro?payoutId=123',
} as PayoutCancelledEmailProps;

export default PayoutCancelledEmail;
