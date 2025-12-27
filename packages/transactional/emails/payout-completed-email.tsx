/**
 * Payout Completed Email Template
 *
 * Sent to sellers when their payout is completed.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface PayoutCompletedEmailProps {
  payoutId: string;
  amount: string;
  currency: 'UYU' | 'USD';
  transactionReference?: string;
  completedAt: string;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-UY', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export const PayoutCompletedEmail = ({
  payoutId,
  amount,
  currency,
  transactionReference,
  completedAt,
  payoutUrl,
  appBaseUrl,
}: PayoutCompletedEmailProps) => (
  <BaseEmail
    title="¡Retiro completado!"
    preview={`Tu retiro de ${formatPrice(
      amount,
      currency,
    )} ha sido completado exitosamente`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      ¡Excelente noticia! Tu retiro ha sido completado exitosamente y el dinero
      debería estar disponible en tu cuenta bancaria.
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
      <Text className="text-base font-medium text-foreground m-0 mb-2">
        Monto: {formatPrice(amount, currency)}
      </Text>
      {transactionReference && (
        <Text className="text-sm text-muted-foreground m-0 mb-1">
          Referencia de transacción: {transactionReference}
        </Text>
      )}
      <Text className="text-sm text-muted-foreground m-0">
        Completado el: {formatDate(completedAt)}
      </Text>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      El dinero debería estar disponible en tu cuenta bancaria en los próximos
      días hábiles. Si tenés alguna duda, podés contactarnos a
      soporte@revendiste.com.
    </Text>
  </BaseEmail>
);

PayoutCompletedEmail.PreviewProps = {
  payoutId: '123e4567-e89b-12d3-a456-426614174000',
  amount: '1500.00',
  currency: 'UYU',
  transactionReference: 'TXN-123456',
  completedAt: new Date().toISOString(),
  payoutUrl: 'https://revendiste.com/cuenta/retiro?payoutId=123',
} as PayoutCompletedEmailProps;

export default PayoutCompletedEmail;
