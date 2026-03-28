/**
 * Ticket Report Created Email Template
 *
 * Sent to users when their ticket report case is created.
 * For auto-cases (ticket_not_received), uses an empathetic tone that reassures
 * the buyer their money is coming back.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface TicketReportCreatedEmailProps {
  caseTypeLabel: string;
  reportUrl: string;
  appBaseUrl?: string;
  isAutoCase?: boolean;
  eventName?: string;
}

export const TicketReportCreatedEmail = ({
  caseTypeLabel,
  reportUrl,
  appBaseUrl,
  isAutoCase,
  eventName,
}: TicketReportCreatedEmailProps) => {
  if (isAutoCase) {
    const eventLabel = eventName ? ` para ${eventName}` : '';
    return (
      <BaseEmail
        title="Tu vendedor no subió las entradas — tu dinero está asegurado"
        preview={`El vendedor no cargó las entradas${eventLabel}. Ya abrimos un caso y tu reembolso está en proceso.`}
        appBaseUrl={appBaseUrl}
      >
        <Text className="text-foreground mb-4">
          Lamentamos lo ocurrido. El vendedor no cargó las entradas
          {eventName ? (
            <>
              {' '}para <strong>{eventName}</strong>
            </>
          ) : ''}{' '}
          a tiempo.
        </Text>

        <Text className="text-foreground mb-6">
          <strong>Tu dinero está asegurado y el reembolso ya está en proceso.</strong>{' '}
          Nuestro equipo de soporte ya abrió un caso para vos y va a gestionar la devolución lo antes posible.
        </Text>

        <Section className="bg-muted p-4 rounded-md mb-6">
          <Text className="text-sm text-foreground m-0 mb-2">
            <strong>¿Qué pasa ahora?</strong>
          </Text>
          <Text className="text-sm text-muted-foreground m-0 mb-1">
            - Ya retuvimos el pago al vendedor.
          </Text>
          <Text className="text-sm text-muted-foreground m-0 mb-1">
            - Nuestro equipo está procesando el reembolso.
          </Text>
          <Text className="text-sm text-muted-foreground m-0 mb-1">
            - Te avisamos cuando el reembolso se confirme.
          </Text>
          <Text className="text-sm text-muted-foreground m-0">
            - Podés seguir el estado de tu caso en cualquier momento.
          </Text>
        </Section>

        <Section className="text-center mb-6">
          <Button
            href={reportUrl}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
          >
            Ver estado de mi caso
          </Button>
        </Section>

        <Text className="text-sm text-muted-foreground mb-0">
          Si tenés alguna duda, podés contactarnos a ayuda@revendiste.com.
        </Text>
      </BaseEmail>
    );
  }

  return (
    <BaseEmail
      title="Tu caso fue recibido"
      preview={`Tu reporte de tipo "${caseTypeLabel}" fue recibido`}
      appBaseUrl={appBaseUrl}
    >
      <Text className="text-foreground mb-4">
        Recibimos tu reporte de tipo <strong>{caseTypeLabel}</strong>. Nuestro
        equipo de soporte lo va a revisar y te vamos a avisar sobre el progreso.
      </Text>

      <Section className="bg-muted p-4 rounded-md mb-6">
        <Text className="text-sm text-foreground m-0 mb-2">
          <strong>¿Qué sigue?</strong>
        </Text>
        <Text className="text-sm text-muted-foreground m-0 mb-1">
          - Nuestro equipo va a revisar tu caso lo antes posible.
        </Text>
        <Text className="text-sm text-muted-foreground m-0 mb-1">
          - Te avisamos cuando haya novedades.
        </Text>
        <Text className="text-sm text-muted-foreground m-0">
          - Podés agregar comentarios o adjuntos desde tu reporte.
        </Text>
      </Section>

      <Section className="text-center mb-6">
        <Button
          href={reportUrl}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
        >
          Ver mi caso
        </Button>
      </Section>

      <Text className="text-sm text-muted-foreground mb-0">
        Si tenés alguna duda, podés contactarnos a ayuda@revendiste.com.
      </Text>
    </BaseEmail>
  );
};

TicketReportCreatedEmail.PreviewProps = {
  caseTypeLabel: 'No recibí mis entradas',
  reportUrl: 'https://revendiste.com/cuenta/reportes/123',
  isAutoCase: true,
  eventName: 'Lollapalooza 2025',
} as TicketReportCreatedEmailProps;

export default TicketReportCreatedEmail;
