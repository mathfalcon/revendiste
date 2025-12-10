/**
 * Payment Succeeded Email Template
 *
 * Sent to buyers when payment is successfully processed.
 */

import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface PaymentSucceededEmailProps {
  eventName: string;
  totalAmount: string;
  currency: string;
  orderUrl: string;
  appBaseUrl?: string;
}

export const PaymentSucceededEmail = ({
  eventName,
  totalAmount,
  currency,
  orderUrl,
  appBaseUrl,
}: PaymentSucceededEmailProps) => (
  <BaseEmail
    title="Pago exitoso"
    preview={`Tu pago de ${totalAmount} ${currency} para ${eventName} fue procesado exitosamente`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      ¡Excelente! Tu pago ha sido procesado exitosamente.
    </Text>

    <Section className="bg-primary/10 p-4 rounded-md mb-6">
      <Text className="text-sm text-foreground m-0 font-semibold mb-1">
        Evento:
      </Text>
      <Text className="text-base text-foreground m-0 mb-3 font-semibold">
        {eventName}
      </Text>
      <Text className="text-sm text-foreground m-0 font-semibold mb-1">
        Monto pagado:
      </Text>
      <Text className="text-2xl font-bold text-primary m-0">
        {totalAmount} {currency}
      </Text>
    </Section>

    <Text className="text-foreground mb-6">
      Tu orden está confirmada y procesándose. Recibirás una notificación cuando
      el vendedor suba los documentos de tus tickets.
    </Text>

    <Section className="text-center mb-6">
      <Button
        href={orderUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Ver orden
      </Button>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Guarda este correo como comprobante de tu compra.
    </Text>
  </BaseEmail>
);

PaymentSucceededEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  totalAmount: '150.00',
  currency: 'EUR',
  orderUrl: 'https://revendiste.com/cuenta/tickets?orderId=123',
} as PaymentSucceededEmailProps;

export default PaymentSucceededEmail;
