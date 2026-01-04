/**
 * Invitation Email Template
 *
 * Sent when a user is invited to join the platform.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface InvitationEmailProps {
  inviterName?: string;
  expiresInDays: number;
  actionUrl: string;
  appBaseUrl?: string;
}

export const InvitationEmail = ({
  inviterName,
  expiresInDays,
  actionUrl,
  appBaseUrl,
}: InvitationEmailProps) => (
  <BaseEmail
    title="Tenés una invitación"
    preview="Te invitaron a sumarte a Revendiste"
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      {inviterName ? (
        <>
          <strong>{inviterName}</strong> te invitó a sumarte a Revendiste.
        </>
      ) : (
        'Te invitaron a unirte a Revendiste.'
      )}
    </Text>

    <Text className="text-foreground mb-4">
      Esta invitación vence en <strong>{expiresInDays} días</strong>.
    </Text>

    <Section className="text-center mb-6">
      <Button
        href={actionUrl}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
      >
        Aceptar invitación
      </Button>
    </Section>

    <Text className="text-sm text-muted-foreground mb-0">
      Si tenés problemas con el botón,{' '}
      <a href={actionUrl} style={{color: '#6366f1', textDecoration: 'none'}}>
        hacé clic acá
      </a>
      .
    </Text>
  </BaseEmail>
);

InvitationEmail.PreviewProps = {
  inviterName: 'Juan Pérez',
  expiresInDays: 7,
  actionUrl: 'https://revendiste.com/invitacion/abc123',
} as InvitationEmailProps;

export default InvitationEmail;
