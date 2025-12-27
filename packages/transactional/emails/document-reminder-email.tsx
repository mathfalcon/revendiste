/**
 * Document Reminder Email Template
 *
 * Sent to sellers as a reminder to upload ticket documents
 * when the event is approaching.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface DocumentReminderEmailProps {
  eventName: string;
  eventStartDate: string;
  ticketCount: number;
  hoursUntilEvent: number;
  uploadUrl: string;
  appBaseUrl?: string;
}

export const DocumentReminderEmail = ({
  eventName,
  eventStartDate,
  ticketCount,
  hoursUntilEvent,
  uploadUrl,
  appBaseUrl,
}: DocumentReminderEmailProps) => {
  const hoursText =
    hoursUntilEvent === 1 ? '1 hora' : `${hoursUntilEvent} horas`;

  return (
    <BaseEmail
      title="Recordatorio: Subí los documentos de tus tickets"
      preview={`El evento "${eventName}" empieza en ${hoursText}`}
      appBaseUrl={appBaseUrl}
    >
      <Text className="text-foreground mb-4">
        Che, el evento <strong>{eventName}</strong> empieza en{' '}
        <strong>{hoursText}</strong>.
      </Text>

      <Text className="text-foreground mb-4">
        Todavía tenés{' '}
        <strong>
          {ticketCount}{' '}
          {ticketCount === 1
            ? 'ticket sin documentar'
            : 'tickets sin documentar'}
        </strong>
        . Por favor, subí los documentos lo antes posible para evitar
        problemas.
      </Text>

      <Section className="bg-muted p-4 rounded-md mb-6">
        <Text className="text-sm text-foreground m-0 font-semibold mb-1">
          Fecha del evento:
        </Text>
        <Text className="text-sm text-muted-foreground m-0">
          {new Date(eventStartDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </Section>

      <Section className="text-center mb-6">
        <Button
          href={uploadUrl}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
        >
          Subir documentos
        </Button>
      </Section>

      <Text className="text-sm text-muted-foreground mb-0">
        Subir los documentos es obligatorio para completar la venta de tus
        tickets.
      </Text>
    </BaseEmail>
  );
};

DocumentReminderEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  eventStartDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  ticketCount: 3,
  hoursUntilEvent: 12,
  uploadUrl: 'https://revendiste.com/cuenta/publicaciones?subirTicket=123',
} as DocumentReminderEmailProps;

export default DocumentReminderEmail;
