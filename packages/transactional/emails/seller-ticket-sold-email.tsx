/**
 * Seller Ticket Sold Email Template
 *
 * Sent to sellers when their tickets are sold.
 * Conditionally shows upload button based on timing restrictions.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface SellerTicketSoldEmailProps {
  eventName: string;
  eventStartDate: string;
  ticketCount: number;
  uploadUrl?: string;
  hoursUntilAvailable?: number;
  appBaseUrl?: string;
}

export const SellerTicketSoldEmail = ({
  eventName,
  eventStartDate,
  ticketCount,
  uploadUrl,
  hoursUntilAvailable,
  appBaseUrl,
}: SellerTicketSoldEmailProps) => {
  const canUpload = !!uploadUrl;
  const hasTimingRestriction = hoursUntilAvailable !== undefined;

  return (
    <BaseEmail
      title="¡Tus entradas se vendieron!"
      preview={`Tus ${ticketCount} ${
        ticketCount === 1
          ? 'entrada se vendió'
          : 'entradas se vendieron'
      } para ${eventName}`}
      appBaseUrl={appBaseUrl}
    >
      <Text className="text-foreground mb-4">
        ¡Felicitaciones! Tus{' '}
        <strong>
          {ticketCount}{' '}
          {ticketCount === 1
            ? 'entrada se vendió'
            : 'entradas se vendieron'}
        </strong>{' '}
        para <strong>{eventName}</strong>.
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

      {canUpload ? (
        <>
          <Text className="text-foreground mb-4">
            Para completar la venta, por favor subí los documentos de tus
            tickets lo antes posible.
          </Text>

          <Section className="text-center mb-6">
            <Button
              href={uploadUrl}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
            >
              Subir documentos
            </Button>
          </Section>
        </>
      ) : hasTimingRestriction ? (
        <Section className="bg-secondary p-4 rounded-md mb-6">
          <Text className="text-sm text-foreground m-0 font-semibold mb-1">
            Próximamente disponible
          </Text>
          <Text className="text-sm text-muted-foreground m-0">
            Los documentos van a estar disponibles para subir en aproximadamente{' '}
            <strong>
              {hoursUntilAvailable}{' '}
              {hoursUntilAvailable === 1 ? 'hora' : 'horas'}
            </strong>
            . Te vamos a avisar cuando puedas subirlos.
          </Text>
        </Section>
      ) : (
        <Text className="text-foreground mb-6">
          Te vamos a avisar cuando puedas subir los documentos de tus
          tickets.
        </Text>
      )}

      <Text className="text-sm text-muted-foreground mb-0">
        Subir los documentos es obligatorio para completar la venta y recibir
        el pago.
      </Text>
    </BaseEmail>
  );
};

SellerTicketSoldEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  eventStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  ticketCount: 2,
  uploadUrl: 'https://revendiste.com/cuenta/publicaciones?subirTicket=123',
} as SellerTicketSoldEmailProps;

export default SellerTicketSoldEmail;
