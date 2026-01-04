/**
 * New Device Sign In Email Template
 *
 * Sent when a user signs in from a new device.
 */

import React from 'react';
import {Button, Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface NewDeviceSignInEmailProps {
  signInMethod?: string;
  deviceType?: string;
  browserName?: string;
  operatingSystem?: string;
  location?: string;
  ipAddress?: string;
  sessionCreatedAt: string;
  revokeSessionUrl?: string;
  supportEmail?: string;
  appBaseUrl?: string;
}

export const NewDeviceSignInEmail = ({
  signInMethod,
  deviceType,
  browserName,
  operatingSystem,
  location,
  ipAddress,
  sessionCreatedAt,
  revokeSessionUrl,
  supportEmail,
  appBaseUrl,
}: NewDeviceSignInEmailProps) => (
  <BaseEmail
    title="Nuevo inicio de sesión en tu cuenta"
    preview="Un nuevo dispositivo acaba de iniciar sesión en tu cuenta de Revendiste"
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Un nuevo dispositivo acaba de iniciar sesión en tu cuenta de Revendiste.
    </Text>

    <Text className="text-foreground mb-4">
      Si no reconocés este acceso, revisá tu cuenta por actividad no autorizada y
      asegurate de que el método de inicio de sesión sea seguro.
    </Text>

    {/* Device Details */}
    <Section className="bg-muted p-4 rounded-md mb-4">
      {signInMethod && (
        <Text className="text-sm text-foreground m-0 mb-2">
          <strong>Método de inicio de sesión:</strong> {signInMethod}
        </Text>
      )}
      {(deviceType || browserName || operatingSystem) && (
        <Text className="text-sm text-foreground m-0 mb-2">
          <strong>Dispositivo:</strong>{' '}
          {[deviceType, browserName, operatingSystem].filter(Boolean).join(' ')}
        </Text>
      )}
      {(location || ipAddress) && (
        <Text className="text-sm text-foreground m-0 mb-2">
          <strong>Ubicación:</strong>{' '}
          {location}
          {ipAddress && ` (${ipAddress})`}
        </Text>
      )}
      <Text className="text-sm text-foreground m-0">
        <strong>Hora:</strong> {sessionCreatedAt}
      </Text>
    </Section>

    {revokeSessionUrl && (
      <>
        <Text className="text-foreground mb-4">
          Para cerrar sesión en este dispositivo de inmediato, hacé clic en el
          botón de abajo.
        </Text>

        <Section className="text-center mb-6">
          <Button
            href={revokeSessionUrl}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold text-base no-underline inline-block"
          >
            Cerrar sesión en este dispositivo
          </Button>
        </Section>

        <Text className="text-sm text-muted-foreground mb-4">
          Si tenés problemas con el botón,{' '}
          <a
            href={revokeSessionUrl}
            style={{color: '#6366f1', textDecoration: 'none'}}
          >
            hacé clic acá
          </a>
          .
        </Text>
      </>
    )}

    {supportEmail && (
      <Text className="text-sm text-muted-foreground mb-0">
        Si tenés dudas o necesitás ayuda, escribinos a{' '}
        <span style={{color: '#6366f1'}}>{supportEmail}</span>.
      </Text>
    )}
  </BaseEmail>
);

NewDeviceSignInEmail.PreviewProps = {
  signInMethod: 'Email',
  deviceType: 'Desktop',
  browserName: 'Chrome',
  operatingSystem: 'Windows 11',
  location: 'Montevideo, Uruguay',
  ipAddress: '190.64.xxx.xxx',
  sessionCreatedAt: '3 de enero de 2026, 14:30',
  revokeSessionUrl: 'https://revendiste.com/revoke-session/abc123',
  supportEmail: 'soporte@revendiste.com',
} as NewDeviceSignInEmailProps;

export default NewDeviceSignInEmail;

