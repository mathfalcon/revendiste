/**
 * Clerk Webhook Service
 *
 * Handles Clerk webhook events and sends authentication-related emails
 * using the notification system infrastructure.
 */

import {getEmailProvider} from '~/services/notifications/providers/EmailProviderFactory';
import {buildEmailTemplate} from '~/services/notifications/email-template-builder';
import {generateNotificationText} from '@revendiste/shared';
import {EMAIL_FROM, APP_BASE_URL} from '~/config/env';
import {logger} from '~/utils';
import type {
  ClerkWebhookRouteBody,
  ClerkEmailSlug,
} from '~/controllers/webhooks/validation';
import type {
  NotificationType,
  TypedNotificationMetadata,
} from '@revendiste/shared';

interface WebhookMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Maps Clerk email slugs to notification types
 */
const CLERK_SLUG_TO_NOTIFICATION_TYPE: Record<
  ClerkEmailSlug,
  NotificationType
> = {
  verification_code: 'auth_verification_code',
  reset_password_code: 'auth_reset_password_code',
  invitation: 'auth_invitation',
  password_changed: 'auth_password_changed',
  password_removed: 'auth_password_removed',
  primary_email_address_changed: 'auth_primary_email_changed',
  new_device_sign_in: 'auth_new_device_sign_in',
};

export class ClerkWebhookService {
  private emailProvider = getEmailProvider();

  async handleWebhook(
    webhookBody: ClerkWebhookRouteBody,
    metadata: WebhookMetadata,
  ): Promise<void> {
    logger.info('Clerk webhook received', {
      eventType: webhookBody.type,
      emailSlug: webhookBody.data.slug,
      instanceId: webhookBody.instance_id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    if (webhookBody.type === 'email.created') {
      await this.handleEmailCreated(webhookBody.data);
    }
  }

  private async handleEmailCreated(
    emailData: ClerkWebhookRouteBody['data'],
  ): Promise<void> {
    const toEmail = emailData.to_email_address;
    if (!toEmail) {
      logger.warn('Email created but no recipient email found', {
        emailId: emailData.id,
      });
      return;
    }

    const slug = emailData.slug as ClerkEmailSlug;
    const notificationType = CLERK_SLUG_TO_NOTIFICATION_TYPE[slug];

    if (!notificationType) {
      logger.debug('Email slug not mapped to notification type', {
        emailId: emailData.id,
        slug,
      });
      return;
    }

    logger.info('Processing Clerk email', {
      emailId: emailData.id,
      slug,
      notificationType,
      toEmail,
    });

    const metadata = this.buildMetadataFromClerkData(
      notificationType,
      emailData,
    ) as TypedNotificationMetadata<typeof notificationType>;

    const {title} = generateNotificationText(notificationType, metadata);

    const {html, text} = await buildEmailTemplate(
      notificationType,
      metadata,
      null,
    );

    await this.emailProvider.sendEmail({
      to: toEmail,
      subject: this.buildEmailSubject(notificationType, metadata, title),
      html,
      text,
      from: EMAIL_FROM,
    });

    logger.info('Clerk auth email sent', {
      emailId: emailData.id,
      notificationType,
      email: toEmail,
    });
  }

  private buildMetadataFromClerkData(
    notificationType: NotificationType,
    emailData: ClerkWebhookRouteBody['data'],
  ): Record<string, unknown> {
    const data = emailData.data;

    switch (notificationType) {
      case 'auth_verification_code':
        return {
          type: 'auth_verification_code' as const,
          otpCode: data.otp_code || '',
          requestedFrom: data.requested_by || data.requested_from,
          requestedAt: data.requested_at,
        };

      case 'auth_reset_password_code':
        return {
          type: 'auth_reset_password_code' as const,
          otpCode: data.otp_code || '',
          requestedFrom: data.requested_by || data.requested_from,
          requestedAt: data.requested_at,
        };

      case 'auth_invitation':
        return {
          type: 'auth_invitation' as const,
          inviterName: data.inviter_name,
          expiresInDays: data.invitation?.expires_in_days || 7,
          actionUrl: data.action_url || APP_BASE_URL,
        };

      case 'auth_password_changed':
        return {
          type: 'auth_password_changed' as const,
          greetingName: data.greeting_name,
          primaryEmailAddress:
            data.primary_email_address || emailData.to_email_address,
        };

      case 'auth_password_removed':
        return {
          type: 'auth_password_removed' as const,
          greetingName: data.greeting_name,
          primaryEmailAddress:
            data.primary_email_address || emailData.to_email_address,
        };

      case 'auth_primary_email_changed':
        return {
          type: 'auth_primary_email_changed' as const,
          newEmailAddress: data.new_email_address || emailData.to_email_address,
        };

      case 'auth_new_device_sign_in':
        return {
          type: 'auth_new_device_sign_in' as const,
          signInMethod: data.sign_in_method,
          deviceType: data.device_type,
          browserName: data.browser_name,
          operatingSystem: data.operating_system,
          location: data.location,
          ipAddress: data.ip_address,
          sessionCreatedAt: data.session_created_at || new Date().toISOString(),
          revokeSessionUrl: data.revoke_session_url,
          supportEmail: data.support_email || 'soporte@revendiste.com',
        };

      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }
  }

  private buildEmailSubject(
    notificationType: NotificationType,
    metadata: Record<string, unknown>,
    defaultTitle: string,
  ): string {
    switch (notificationType) {
      case 'auth_verification_code':
        return `${metadata.otpCode as string} es tu código de verificación - Revendiste`;

      case 'auth_reset_password_code':
        return `${metadata.otpCode as string} es tu código para restablecer la contraseña - Revendiste`;

      case 'auth_invitation':
        return 'Tenés una invitación a Revendiste';

      case 'auth_password_changed':
        return 'Tu contraseña de Revendiste fue cambiada';

      case 'auth_password_removed':
        return 'Se eliminó la contraseña de tu cuenta en Revendiste';

      case 'auth_primary_email_changed':
        return 'Se actualizó el email principal de tu cuenta en Revendiste';

      case 'auth_new_device_sign_in':
        return 'Nuevo inicio de sesión en tu cuenta de Revendiste';

      default:
        return defaultTitle;
    }
  }
}
