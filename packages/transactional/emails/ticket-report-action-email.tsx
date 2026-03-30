/**
 * Ticket Report Action Added Email Template
 *
 * Sent to users when an admin adds a comment or action to their report.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface TicketReportActionEmailProps {
  actionDescription: string;
  comment?: string;
  reportUrl: string;
  appBaseUrl?: string;
}

export const TicketReportActionEmail = ({
  actionDescription,
  comment,
  reportUrl,
  appBaseUrl,
}: TicketReportActionEmailProps) => (
  <BaseEmail
    title="Novedad en tu caso"
    preview="Soporte actualizó tu caso"
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">{actionDescription}</Text>

    {comment && (
      <Section className="bg-muted p-4 rounded-md mb-6">
        <Text className="text-sm text-muted-foreground m-0 mb-1">
          <strong>Mensaje:</strong>
        </Text>
        <Text className="text-sm text-foreground m-0">{comment}</Text>
      </Section>
    )}

    {/* CTA Button */}
    <Section className="text-center mb-6">
      <Button
        href={reportUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Ver mi caso
      </Button>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Si tenés alguna duda, podés responder directamente desde tu caso.
    </Text>
  </BaseEmail>
);

TicketReportActionEmail.PreviewProps = {
  actionDescription:
    'Soporte agregó una actualización a tu caso.',
  comment: 'Estamos revisando tu caso. Te avisamos pronto.',
  reportUrl: 'https://revendiste.com/cuenta/reportes/123',
} as TicketReportActionEmailProps;

export default TicketReportActionEmail;
