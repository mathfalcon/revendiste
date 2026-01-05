/**
 * Primary Email Changed Email Template
 *
 * Sent when a user changes their primary email address.
 */

import React from 'react';
import {Link, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface PrimaryEmailChangedEmailProps {
  newEmailAddress: string;
  appBaseUrl?: string;
}

export const PrimaryEmailChangedEmail = ({
  newEmailAddress,
  appBaseUrl,
}: PrimaryEmailChangedEmailProps) => (
  <BaseEmail
    title="Email actualizado"
    preview="Se actualizó el email principal de tu cuenta en Revendiste"
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      El email principal de tu cuenta fue actualizado a{' '}
      <strong>{newEmailAddress}</strong>.
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

    <Text className="text-xs text-muted-foreground mt-6 mb-0">
      Este mensaje fue generado automáticamente. No respondas este mail.
    </Text>
  </BaseEmail>
);

PrimaryEmailChangedEmail.PreviewProps = {
  newEmailAddress: 'nuevo@example.com',
} as PrimaryEmailChangedEmailProps;

export default PrimaryEmailChangedEmail;
