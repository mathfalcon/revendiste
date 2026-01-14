/**
 * Identity Verification Completed Email Template
 *
 * Sent to users when their identity verification is completed (auto or admin approved).
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface IdentityVerificationCompletedEmailProps {
  appBaseUrl?: string;
}

export const IdentityVerificationCompletedEmail = ({
  appBaseUrl,
}: IdentityVerificationCompletedEmailProps) => (
  <BaseEmail
    title="¡Ya podés publicar tus entradas!"
    preview="Tu verificación de identidad se completó - empezá a vender"
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      ¡Felicitaciones! Tu verificación de identidad se completó exitosamente.
    </Text>

    <Text className="text-foreground mb-4">
      Ahora podés publicar tus entradas para vender en Revendiste. Miles de
      compradores están buscando entradas como las tuyas.
    </Text>

    {/* CTA Button */}
    <Section className="text-center mb-6">
      <Button
        href={`${appBaseUrl || 'https://revendiste.com'}/publicar`}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Publicar entradas
      </Button>
    </Section>

    {/* Benefits Section */}
    <Section className="bg-muted/30 p-4 rounded-md mb-4">
      <Text className="text-lg font-semibold text-foreground m-0 mb-3">
        ¿Qué podés hacer ahora?
      </Text>
      <Text className="text-sm text-muted-foreground m-0 mb-2">
        ✓ Publicar entradas para eventos
      </Text>
      <Text className="text-sm text-muted-foreground m-0 mb-2">
        ✓ Recibir pagos de forma segura
      </Text>
      <Text className="text-sm text-muted-foreground m-0">
        ✓ Gestionar tus ventas desde tu cuenta
      </Text>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Si tenés alguna duda, podés contactarnos a ayuda@revendiste.com.
    </Text>
  </BaseEmail>
);

IdentityVerificationCompletedEmail.PreviewProps =
  {} as IdentityVerificationCompletedEmailProps;

export default IdentityVerificationCompletedEmail;
