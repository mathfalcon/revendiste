/**
 * Order Confirmed Email Template
 *
 * Sent to buyers when their order is confirmed.
 */

import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface OrderConfirmedEmailProps {
  eventName: string;
  totalAmount: string;
  currency: string;
  orderUrl: string;
  appBaseUrl?: string;
}

export const OrderConfirmedEmail = ({
  eventName,
  totalAmount,
  currency,
  orderUrl,
  appBaseUrl,
}: OrderConfirmedEmailProps) => (
  <BaseEmail
    title="Orden confirmada"
    preview={`Tu orden para ${eventName} ha sido confirmada`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Tu orden para <strong>{eventName}</strong> ha sido confirmada
      exitosamente.
    </Text>

    <Section className="bg-muted p-4 rounded-md mb-6">
      <Text className="text-sm text-foreground m-0 font-semibold mb-1">
        Total pagado:
      </Text>
      <Text className="text-2xl font-bold text-primary m-0">
        {totalAmount} {currency}
      </Text>
    </Section>

    <Text className="text-foreground mb-6">
      Puedes ver los detalles de tu orden y el estado de tus tickets en tu
      cuenta.
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
      Recibirás una notificación cuando el vendedor suba los documentos de tus
      tickets.
    </Text>
  </BaseEmail>
);

OrderConfirmedEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
  totalAmount: '150.00',
  currency: 'EUR',
  orderUrl: 'https://revendiste.com/cuenta/tickets?orderId=123',
} as OrderConfirmedEmailProps;

export default OrderConfirmedEmail;
