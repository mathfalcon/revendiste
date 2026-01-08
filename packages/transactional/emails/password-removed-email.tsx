/**
 * Password Removed Email Template
 *
 * Sent when a user removes their password (e.g., switching to passwordless auth).
 */

import React from 'react';
import {Link, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface PasswordRemovedEmailProps {
  greetingName?: string;
  primaryEmailAddress: string;
  appBaseUrl?: string;
}

export const PasswordRemovedEmail = ({
  greetingName,
  primaryEmailAddress,
  appBaseUrl,
}: PasswordRemovedEmailProps) => (
  <BaseEmail
    title="Contraseña eliminada"
    preview="Se eliminó la contraseña de tu cuenta en Revendiste"
    appBaseUrl={appBaseUrl}
  >
    {greetingName && (
      <Text className="text-foreground mb-4">Hola {greetingName},</Text>
    )}

    <Text className="text-foreground mb-4">
      Te avisamos que la contraseña asociada a{' '}
      <strong>{primaryEmailAddress}</strong> fue eliminada.
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

PasswordRemovedEmail.PreviewProps = {
  greetingName: 'Juan',
  primaryEmailAddress: 'juan@example.com',
} as PasswordRemovedEmailProps;

export default PasswordRemovedEmail;
