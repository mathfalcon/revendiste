/**
 * Ticket Sold Email Template
 *
 * Sent to buyers when their ticket purchase is successful.
 * Prompts them to upload ticket documents.
 */

import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface TicketSoldEmailProps {
  eventName: string;
  ticketCount: number;
  uploadUrl: string;
  appBaseUrl?: string;
}

export const TicketSoldEmail = ({
  eventName,
  ticketCount,
  uploadUrl,
  appBaseUrl,
}: TicketSoldEmailProps) => (
  <BaseEmail
    title="¡Tu compra fue exitosa!"
    preview={`Has comprado ${ticketCount} ${
      ticketCount === 1 ? 'entrada' : 'entradas'
    } para ${eventName}`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      ¡Felicitaciones! Has comprado{' '}
      <strong>
        {ticketCount} {ticketCount === 1 ? 'entrada' : 'entradas'}
      </strong>{' '}
      para <strong>{eventName}</strong>.
    </Text>

    <Text className="text-foreground mb-6">
      Para completar tu compra, por favor sube los documentos de tus tickets.
      Esto nos permite verificar la autenticidad de las entradas y proteger tu
      compra.
    </Text>

    <Section className="text-center mb-6">
      <Button
        href={uploadUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Subir documentos
      </Button>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
    </Text>
  </BaseEmail>
);

TicketSoldEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  ticketCount: 2,
  uploadUrl: 'https://revendiste.com/cuenta/publicaciones?subirTicket=123',
} as TicketSoldEmailProps;

export default TicketSoldEmail;
