/**
 * Password Changed Email Template
 *
 * Sent when a user changes their password.
 */

import React from 'react';
import {Link, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface PasswordChangedEmailProps {
  greetingName?: string;
  primaryEmailAddress: string;
  appBaseUrl?: string;
}

export const PasswordChangedEmail = ({
  greetingName,
  primaryEmailAddress,
  appBaseUrl,
}: PasswordChangedEmailProps) => (
  <BaseEmail
    title="Cambio de contraseña"
    preview="Tu contraseña de Revendiste fue cambiada"
    appBaseUrl={appBaseUrl}
  >
    {greetingName && (
      <Text className="text-foreground mb-4">Hola {greetingName},</Text>
    )}

    <Text className="text-foreground mb-4">
      Te avisamos que la contraseña asociada a{' '}
      <strong>{primaryEmailAddress}</strong> fue cambiada correctamente.
    </Text>

    <Section className="bg-muted p-4 rounded-md mb-4">
      <Text className="text-sm font-semibold text-foreground m-0 mb-2">
        ¿No fuiste vos?
      </Text>
      <Text className="text-sm text-muted-foreground m-0">
        Si no hiciste este cambio, escribinos a{' '}
        <Link
          href="mailto:ayuda@revendiste.com"
          className="text-primary no-underline hover:underline"
        >
          ayuda@revendiste.com
        </Link>
        .
      </Text>
    </Section>
  </BaseEmail>
);

PasswordChangedEmail.PreviewProps = {
  greetingName: 'Juan',
  primaryEmailAddress: 'juan@example.com',
} as PasswordChangedEmailProps;

export default PasswordChangedEmail;
