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
import {redactKnownSecrets, wideEvent, withDuration} from '~/utils/logFields';
import {CLERK_AUTH_NOTIFICATION_TITLES} from '~/constants/error-messages';
import type {
  ImpersonationLogsRepository,
  UsersRepository,
} from '~/repositories';
import type {
  ClerkWebhookRouteBody,
  ClerkEmailSlug,
} from '~/controllers/webhooks/validation';
import type {
  NotificationType,
  TypedNotificationMetadata,
} from '@revendiste/shared';

/** How recently an impersonation log must exist to suppress the new-device email.
 * Clerk actor tokens have a max session of 30min; we use a slightly larger
 * window to be safe (the email arrives shortly after sign-in). */
const IMPERSONATION_LOOKBACK_MINUTES = 30;

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

  constructor(
    private usersRepository?: UsersRepository,
    private impersonationLogsRepository?: ImpersonationLogsRepository,
  ) {}

  async handleWebhook(
    webhookBody: ClerkWebhookRouteBody,
    metadata: WebhookMetadata,
  ): Promise<void> {
    const start = Date.now();
    try {
      if (webhookBody.type !== 'email.created') {
        logger.info(
          'webhooks.clerk.processed',
          wideEvent('webhooks.clerk.processed', {
            eventType: webhookBody.type,
            skippedReason: 'event_type_not_handled',
            ...withDuration(start),
            outcome: 'skipped',
          }),
        );
        return;
      }

      const clerkEmailOutcome = await this.handleEmailCreated(webhookBody.data);
      const outcome: 'success' | 'skipped' =
        clerkEmailOutcome === 'sent' ? 'success' : 'skipped';

      logger.info(
        'webhooks.clerk.processed',
        wideEvent('webhooks.clerk.processed', {
          eventType: webhookBody.type,
          emailSlug: webhookBody.data.slug,
          emailId: webhookBody.data.id,
          clerkEmailOutcome,
          ipAddress: metadata.ipAddress,
          ...withDuration(start),
          outcome,
        }),
      );
    } catch (error: unknown) {
      logger.error(
        'webhooks.clerk.processed',
        wideEvent('webhooks.clerk.processed', {
          eventType: webhookBody.type,
          emailSlug: webhookBody.data.slug,
          error: redactKnownSecrets(
            error instanceof Error
              ? {message: error.message, stack: error.stack}
              : {message: String(error)},
          ),
          ...withDuration(start),
          outcome: 'failure',
        }),
      );
    }
  }

  private async handleEmailCreated(
    emailData: ClerkWebhookRouteBody['data'],
  ): Promise<
    | 'sent'
    | 'skipped_no_recipient'
    | 'skipped_unmapped_slug'
    | 'skipped_impersonation'
  > {
    const toEmail = emailData.to_email_address;
    if (!toEmail) {
      logger.warn('Email created but no recipient email found', {
        emailId: emailData.id,
      });
      return 'skipped_no_recipient';
    }

    const slug = emailData.slug as ClerkEmailSlug;
    const notificationType = CLERK_SLUG_TO_NOTIFICATION_TYPE[slug];

    if (!notificationType) {
      logger.debug('Email slug not mapped to notification type', {
        emailId: emailData.id,
        slug,
      });
      return 'skipped_unmapped_slug';
    }

    // Suppress the "new device sign in" email when an admin just started
    // impersonating this user — Clerk's actor-token sign-in fires this email
    // for a session the user didn't actually create.
    if (notificationType === 'auth_new_device_sign_in') {
      const isImpersonation = await this.isRecentImpersonation(toEmail);
      if (isImpersonation) {
        logger.info(
          'webhooks.clerk.processed',
          wideEvent('webhooks.clerk.processed', {
            eventType: 'email.created',
            emailId: emailData.id,
            emailSlug: slug,
            skippedReason: 'impersonation_active',
            outcome: 'skipped',
          }),
        );
        return 'skipped_impersonation';
      }
    }

    logger.debug('Processing Clerk email', {
      emailId: emailData.id,
      slug,
      notificationType,
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

    return 'sent';
  }

  /**
   * Returns true if there's a recent impersonation log entry for the user
   * whose email matches `toEmail`. Used to suppress the new-device-sign-in
   * email when an admin starts an impersonation session.
   *
   * Falls back to `false` if the repositories aren't injected (kept optional
   * to avoid breaking older instantiation sites).
   */
  private async isRecentImpersonation(toEmail: string): Promise<boolean> {
    if (!this.usersRepository || !this.impersonationLogsRepository) {
      return false;
    }
    try {
      const user = await this.usersRepository.findByEmail(toEmail);
      if (!user) return false;
      return await this.impersonationLogsRepository.hasRecentByTargetUserId(
        user.id,
        IMPERSONATION_LOOKBACK_MINUTES,
      );
    } catch (error) {
      logger.warn('Failed to check recent impersonation', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
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
          supportEmail: data.support_email || 'ayuda@revendiste.com',
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
        return `${
          metadata.otpCode as string
        } es tu código de verificación - Revendiste`;

      case 'auth_reset_password_code':
        return `${
          metadata.otpCode as string
        } es tu código para restablecer la contraseña - Revendiste`;

      case 'auth_invitation':
        return CLERK_AUTH_NOTIFICATION_TITLES.INVITATION;

      case 'auth_password_changed':
        return CLERK_AUTH_NOTIFICATION_TITLES.PASSWORD_CHANGED;

      case 'auth_password_removed':
        return CLERK_AUTH_NOTIFICATION_TITLES.PASSWORD_REMOVED;

      case 'auth_primary_email_changed':
        return CLERK_AUTH_NOTIFICATION_TITLES.PRIMARY_EMAIL_CHANGED;

      case 'auth_new_device_sign_in':
        return CLERK_AUTH_NOTIFICATION_TITLES.NEW_DEVICE_SIGN_IN;

      default:
        return defaultTitle;
    }
  }
}
