/**
 * Order Expired Email Template
 *
 * Sent to buyers when their order expires.
 */

import React from 'react';
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
    title="Tu orden expiró"
    preview={`Tu orden para ${eventName} expiró`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Tu orden para <strong>{eventName}</strong> expiró.
    </Text>

    <Text className="text-foreground mb-4">
      Las entradas fueron liberadas y ya están disponibles de nuevo para otros
      compradores.
    </Text>

    <Section className="bg-muted p-4 rounded-md mb-6">
      <Text className="text-sm text-foreground m-0">
        Si todavía estás interesado en comprar tickets para este evento, podés
        buscar nuevas ofertas disponibles.
      </Text>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Si hiciste un pago, el reembolso se va a procesar automáticamente según
      nuestras políticas.
    </Text>
  </BaseEmail>
);

OrderExpiredEmail.PreviewProps = {
  eventName: 'Key Presenta Mau P & More',
} as OrderExpiredEmailProps;

export default OrderExpiredEmail;
