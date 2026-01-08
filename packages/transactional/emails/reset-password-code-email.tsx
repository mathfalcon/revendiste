/**
 * Reset Password Code Email Template
 *
 * Sent when a user requests a password reset code (OTP).
 */

import React from 'react';
import {Section, Text} from '@react-email/components';
import {BaseEmail} from './base-template';

export interface ResetPasswordCodeEmailProps {
  otpCode: string;
  requestedFrom?: string;
  requestedAt?: string;
  appBaseUrl?: string;
}

export const ResetPasswordCodeEmail = ({
  otpCode,
  requestedFrom,
  requestedAt,
  appBaseUrl,
}: ResetPasswordCodeEmailProps) => (
  <BaseEmail
    title="Código para restablecer la contraseña"
    preview={`${otpCode} es tu código para restablecer la contraseña de Revendiste`}
    appBaseUrl={appBaseUrl}
  >
    <Text className="text-foreground mb-4">
      Ingresá el siguiente código cuando te lo pidamos:
    </Text>

    {/* OTP Code Display */}
    <Section className="text-center mb-6">
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          border: '2px solid #6366f1',
          borderRadius: '8px',
          padding: '20px',
          display: 'inline-block',
        }}
      >
        <Text
          className="text-4xl font-bold m-0"
          style={{color: '#6366f1', letterSpacing: '4px'}}
        >
          {otpCode}
        </Text>
      </div>
    </Section>

    <Text className="text-foreground mb-4 font-semibold" style={{color: '#dc2626'}}>
      ⚠️ Para proteger tu cuenta, no compartas este código con nadie.
    </Text>

    <Section className="bg-muted p-4 rounded-md mb-4">
      <Text className="text-sm font-semibold text-foreground m-0 mb-2">
        ¿No fuiste vos?
      </Text>
      <Text className="text-sm text-muted-foreground m-0">
        {requestedFrom && requestedAt ? (
          <>
            Este código fue solicitado desde <strong>{requestedFrom}</strong> el{' '}
            <strong>{requestedAt}</strong>.
          </>
        ) : (
          'Si no hiciste esta solicitud, podés ignorar este mail con tranquilidad.'
        )}
      </Text>
      {requestedFrom && requestedAt && (
        <Text className="text-sm text-muted-foreground m-0 mt-2">
          Si no hiciste esta solicitud, podés ignorar este mail con tranquilidad.
        </Text>
      )}
    </Section>
  </BaseEmail>
);

ResetPasswordCodeEmail.PreviewProps = {
  otpCode: '123456',
  requestedFrom: 'Chrome, Windows',
  requestedAt: '3 de enero de 2026, 14:30',
} as ResetPasswordCodeEmailProps;

export default ResetPasswordCodeEmail;

