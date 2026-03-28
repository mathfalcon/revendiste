/**
 * Ticket Report Closed Email Template
 *
 * Sent to users when their ticket report case is closed by an admin.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface TicketReportClosedEmailProps {
  refundIssued?: boolean;
  reportUrl: string;
  appBaseUrl?: string;
}

export const TicketReportClosedEmail = ({
  refundIssued,
  reportUrl,
  appBaseUrl,
}: TicketReportClosedEmailProps) => (
  <BaseEmail
    title="Caso cerrado"
    preview="Tu caso fue revisado y cerrado"
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Tu caso fue revisado y cerrado por soporte.
    </Text>

    {refundIssued && (
      <Section className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-md mb-6">
        <Text className="text-sm text-foreground m-0">
          Se procesó un reembolso asociado a este caso. El monto se reflejará
          en tu medio de pago original.
        </Text>
      </Section>
    )}

    {/* CTA Button */}
    <Section className="text-center mb-6">
      <Button
        href={reportUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Ver detalles del caso
      </Button>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Si tenés alguna otra consulta, podés abrir un nuevo caso desde tu cuenta.
    </Text>
  </BaseEmail>
);

TicketReportClosedEmail.PreviewProps = {
  refundIssued: true,
  reportUrl: 'https://revendiste.com/cuenta/reportes/123',
} as TicketReportClosedEmailProps;

export default TicketReportClosedEmail;
