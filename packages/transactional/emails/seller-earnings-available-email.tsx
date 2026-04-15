/**
 * Seller earnings available email — hold period ended, seller can request withdrawal
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface SellerEarningsAvailableLine {
  currency: 'UYU' | 'USD';
  amount: string;
  earningCount: number;
}

export interface SellerEarningsAvailableEmailProps {
  lines: SellerEarningsAvailableLine[];
  withdrawalUrl: string;
  appBaseUrl?: string;
}

function formatLine(line: SellerEarningsAvailableLine): string {
  const num = parseFloat(line.amount);
  const formatted = `${num.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${line.currency}`;
  return line.earningCount === 1
    ? `${formatted} (1 venta)`
    : `${formatted} (${line.earningCount} ventas)`;
}

export const SellerEarningsAvailableEmail = ({
  lines,
  withdrawalUrl,
  appBaseUrl,
}: SellerEarningsAvailableEmailProps) => {
  const preview =
    'Tus ganancias ya están disponibles para retirar. Ingresá a Retiro para solicitar el envío.';

  return (
    <BaseEmail
      title="Ganancias disponibles para retirar"
      preview={preview}
      appBaseUrl={appBaseUrl}
    >
      <Text className="text-foreground mb-4">
        <strong>Tus ganancias ya están disponibles para retirar.</strong> Ya
        finalizó el período de retención que aplica a estas ventas; los montos
        figuran en tu saldo disponible. Podés solicitar el retiro cuando lo
        necesites.
      </Text>

      <Section className="bg-muted/30 p-4 rounded-md mb-4">
        <Text className="text-lg font-semibold text-foreground m-0 mb-3">
          Detalle por moneda
        </Text>
        {lines.map((line, i) => (
          <Text
            key={`${line.currency}-${i}`}
            className="text-base text-foreground m-0 mb-2"
          >
            {formatLine(line)}
          </Text>
        ))}
      </Section>

      <Section className="text-center mb-6">
        <Button
          href={withdrawalUrl}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
        >
          Solicitar retiro
        </Button>
      </Section>

      <Text className="text-sm text-muted-foreground mb-0">
        Si tenés dudas sobre retiros o sobre los plazos de acreditación, podés
        escribirnos a ayuda@revendiste.com.
      </Text>
    </BaseEmail>
  );
};

SellerEarningsAvailableEmail.PreviewProps = {
  lines: [
    {currency: 'UYU', amount: '1250.50', earningCount: 2},
    {currency: 'USD', amount: '80.00', earningCount: 1},
  ],
  withdrawalUrl: 'https://revendiste.com/cuenta/retiro',
} as SellerEarningsAvailableEmailProps;

export default SellerEarningsAvailableEmail;
