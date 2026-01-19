/**
 * Document Uploaded Batch Email Template
 *
 * Sent to buyers when seller uploads multiple ticket documents within a debounce window.
 * Consolidates multiple upload notifications into a single email.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface DocumentUploadedBatchEmailProps {
  eventName: string;
  uploadedCount: number;
  tickets: Array<{
    ticketNumber: string;
    eventName: string;
  }>;
  orderUrl: string;
  appBaseUrl?: string;
}

export const DocumentUploadedBatchEmail = ({
  eventName,
  uploadedCount,
  orderUrl,
  appBaseUrl,
}: DocumentUploadedBatchEmailProps) => (
  <BaseEmail
    title="¡Tus entradas están listas!"
    preview={`${uploadedCount} ${
      uploadedCount === 1 ? 'entrada está lista' : 'entradas están listas'
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
        {uploadedCount} {uploadedCount === 1 ? 'entrada' : 'entradas'}
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
      duda, podés contactarnos a ayuda@revendiste.com.
    </Text>
  </BaseEmail>
);

DocumentUploadedBatchEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  uploadedCount: 3,
  tickets: [
    {ticketNumber: '1', eventName: 'Key Presenta Mau P & More'},
    {ticketNumber: '2', eventName: 'Key Presenta Mau P & More'},
    {ticketNumber: '3', eventName: 'Key Presenta Mau P & More'},
  ],
  orderUrl: 'https://revendiste.com/cuenta/tickets?orderId=123',
} as DocumentUploadedBatchEmailProps;

export default DocumentUploadedBatchEmail;
