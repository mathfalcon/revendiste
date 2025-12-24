/**
 * Document Uploaded Email Template
 *
 * Sent to buyers when seller uploads ticket documents.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface DocumentUploadedEmailProps {
  eventName: string;
  ticketCount: number;
  orderUrl: string;
  appBaseUrl?: string;
}

export const DocumentUploadedEmail = ({
  eventName,
  ticketCount,
  orderUrl,
  appBaseUrl,
}: DocumentUploadedEmailProps) => (
  <BaseEmail
    title="¡Tus entradas están listas!"
    preview={`El vendedor subió los documentos de tus ${ticketCount} ${
      ticketCount === 1 ? 'entrada' : 'entradas'
    } para ${eventName}`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      El vendedor ya subió los documentos de tus entradas para{' '}
      <strong>{eventName}</strong>.
    </Text>

    <Section className="bg-primary/10 p-4 rounded-md mb-6">
      <Text className="text-sm text-foreground m-0 font-semibold mb-1">
        Evento:
      </Text>
      <Text className="text-base text-foreground m-0 mb-3 font-semibold">
        {eventName}
      </Text>
      <Text className="text-sm text-foreground m-0 font-semibold mb-1">
        Entradas listas:
      </Text>
      <Text className="text-2xl font-bold text-primary m-0">
        {ticketCount} {ticketCount === 1 ? 'entrada' : 'entradas'}
      </Text>
    </Section>

    <Text className="text-foreground mb-6">
      Ya podés acceder a tus entradas y descargarlas. Asegurate de tenerlas
      listas para el día del evento.
    </Text>

    <Section className="text-center mb-6">
      <Button
        href={orderUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Ver y descargar entradas
      </Button>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Presentá tu entrada digital en la entrada del evento. Si tenés alguna
      duda, podés contactarnos desde tu cuenta.
    </Text>
  </BaseEmail>
);

DocumentUploadedEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  ticketCount: 2,
  orderUrl: 'https://revendiste.com/cuenta/tickets?orderId=123',
} as DocumentUploadedEmailProps;

export default DocumentUploadedEmail;
