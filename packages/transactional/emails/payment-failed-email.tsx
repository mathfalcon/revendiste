/**
 * Payment Failed Email Template
 *
 * Sent to buyers when payment processing fails.
 */

import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface PaymentFailedEmailProps {
  eventName: string;
  errorMessage?: string;
  retryUrl: string;
  appBaseUrl?: string;
}

export const PaymentFailedEmail = ({
  eventName,
  errorMessage,
  retryUrl,
  appBaseUrl,
}: PaymentFailedEmailProps) => (
  <BaseEmail
    title="Pago fallido"
    preview={`El pago para tu orden de ${eventName} ha fallado`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      El pago para tu orden de <strong>{eventName}</strong> no pudo ser
      procesado.
    </Text>

    {errorMessage && (
      <Section
        className="bg-destructive p-4 mb-6"
        style={{
          backgroundColor: '#fee2e2',
          borderLeft: '4px solid #ef4444',
          borderRadius: '4px',
        }}
      >
        <Text className="text-sm text-foreground m-0 font-semibold mb-1">
          Detalles del error:
        </Text>
        <Text className="text-sm text-foreground m-0">{errorMessage}</Text>
      </Section>
    )}

    <Text className="text-foreground mb-6">
      Por favor, verifica los datos de tu método de pago e intenta nuevamente.
      Si el problema persiste, contacta con tu banco o método de pago.
    </Text>

    <Section className="text-center mb-6">
      <Button
        href={retryUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Reintentar pago
      </Button>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Tu orden se mantendrá reservada por un tiempo limitado. Si no completas el
      pago, la orden expirará y las entradas estarán disponibles nuevamente.
    </Text>
  </BaseEmail>
);

PaymentFailedEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  errorMessage:
    'Tarjeta rechazada. Por favor, verifica los datos de tu tarjeta.',
  retryUrl: 'https://revendiste.com/checkout/123',
} as PaymentFailedEmailProps;

export default PaymentFailedEmail;
