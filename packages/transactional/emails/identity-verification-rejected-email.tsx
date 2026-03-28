/**
 * Identity Verification Rejected Email Template
 *
 * Sent to users when their identity verification is rejected by an admin.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface IdentityVerificationRejectedEmailProps {
  rejectionReason: string;
  canRetry: boolean;
  retryUrl?: string;
  appBaseUrl?: string;
}

export const IdentityVerificationRejectedEmail = ({
  rejectionReason,
  canRetry,
  retryUrl,
  appBaseUrl,
}: IdentityVerificationRejectedEmailProps) => (
  <BaseEmail
    title="Verificación rechazada"
    preview="Tu verificación de identidad no fue aprobada"
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Tu verificación de identidad no fue aprobada.
    </Text>

    {/* Rejection Reason */}
    <Section className="bg-destructive/10 border border-destructive/20 p-4 rounded-md mb-4">
      <Text className="text-base font-semibold text-foreground m-0 mb-2">
        Motivo del rechazo:
      </Text>
      <Text className="text-sm text-muted-foreground m-0">
        {rejectionReason}
      </Text>
    </Section>

    {canRetry ? (
      <>
        <Text className="text-foreground mb-4">
          No te preocupes, podés intentar verificar tu identidad nuevamente.
          Asegurate de que:
        </Text>

        <Section className="bg-muted/30 p-4 rounded-md mb-4">
          <Text className="text-sm text-muted-foreground m-0 mb-2">
            • El documento sea legible y esté en buen estado
          </Text>
          <Text className="text-sm text-muted-foreground m-0 mb-2">
            • La foto incluya todo el documento sin cortes
          </Text>
          <Text className="text-sm text-muted-foreground m-0 mb-2">
            • Estés en un lugar bien iluminado para la verificación facial
          </Text>
          <Text className="text-sm text-muted-foreground m-0">
            • Tu cara sea claramente visible sin obstáculos
          </Text>
        </Section>

        {/* CTA Button */}
        <Section className="text-center mb-6">
          <Button
            href={
              retryUrl ||
              `${appBaseUrl || 'https://revendiste.com'}/cuenta/verificar`
            }
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
          >
            Reintentar verificación
          </Button>
        </Section>
      </>
    ) : (
      <Text className="text-foreground mb-4">
        Si creés que esto es un error o tenés preguntas sobre el proceso de
        verificación, por favor contactanos.
      </Text>
    )}

    <Text className="text-sm text-muted-foreground mb-0">
      Si tenés alguna duda, podés contactarnos a ayuda@revendiste.com.
    </Text>
  </BaseEmail>
);

IdentityVerificationRejectedEmail.PreviewProps = {
  rejectionReason: 'El documento no es legible o está dañado',
  canRetry: true,
  retryUrl: 'https://revendiste.com/cuenta/verificar',
} as IdentityVerificationRejectedEmailProps;

export default IdentityVerificationRejectedEmail;
