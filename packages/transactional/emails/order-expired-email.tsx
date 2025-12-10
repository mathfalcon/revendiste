/**
 * Order Expired Email Template
 *
 * Sent to buyers when their order expires.
 */

import {Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface OrderExpiredEmailProps {
  eventName: string;
  appBaseUrl?: string;
}

export const OrderExpiredEmail = ({
  eventName,
  appBaseUrl,
}: OrderExpiredEmailProps) => (
  <BaseEmail
    title="Orden expirada"
    preview={`Tu orden para ${eventName} ha expirado`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Tu orden para <strong>{eventName}</strong> ha expirado.
    </Text>

    <Text className="text-foreground mb-4">
      Las entradas han sido liberadas y están disponibles nuevamente para otros
      compradores.
    </Text>

    <Section className="bg-muted p-4 rounded-md mb-6">
      <Text className="text-sm text-foreground m-0">
        Si aún estás interesado en comprar tickets para este evento, puedes
        buscar nuevas ofertas disponibles.
      </Text>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Si realizaste un pago, el reembolso se procesará automáticamente según
      nuestras políticas.
    </Text>
  </BaseEmail>
);

OrderExpiredEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
} as OrderExpiredEmailProps;

export default OrderExpiredEmail;
