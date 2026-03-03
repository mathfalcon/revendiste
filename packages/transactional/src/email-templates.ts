/**
 * Email Template Mapping
 *
 * Maps notification types to their corresponding React Email templates.
 */

import {
  DocumentReminderEmail as DocumentReminderEmailComponent,
  type DocumentReminderEmailProps,
} from '../emails/document-reminder-email';
import {
  OrderConfirmedEmail as OrderConfirmedEmailComponent,
  type OrderConfirmedEmailProps,
} from '../emails/order-confirmed-email';
import {
  OrderExpiredEmail as OrderExpiredEmailComponent,
  type OrderExpiredEmailProps,
} from '../emails/order-expired-email';
import {
  OrderInvoiceEmail as OrderInvoiceEmailComponent,
  type OrderInvoiceEmailProps,
} from '../emails/order-invoice-email';
import {
  PaymentFailedEmail as PaymentFailedEmailComponent,
  type PaymentFailedEmailProps,
} from '../emails/payment-failed-email';
import {
  DocumentUploadedEmail as DocumentUploadedEmailComponent,
  type DocumentUploadedEmailProps,
} from '../emails/document-uploaded-email';
import {
  DocumentUploadedBatchEmail as DocumentUploadedBatchEmailComponent,
  type DocumentUploadedBatchEmailProps,
} from '../emails/document-uploaded-batch-email';
import {
  SellerTicketSoldEmail as SellerTicketSoldEmailComponent,
  type SellerTicketSoldEmailProps,
} from '../emails/seller-ticket-sold-email';
import {
  PayoutCompletedEmail as PayoutCompletedEmailComponent,
  type PayoutCompletedEmailProps,
} from '../emails/payout-completed-email';
import {
  PayoutFailedEmail as PayoutFailedEmailComponent,
  type PayoutFailedEmailProps,
} from '../emails/payout-failed-email';
import {
  PayoutCancelledEmail as PayoutCancelledEmailComponent,
  type PayoutCancelledEmailProps,
} from '../emails/payout-cancelled-email';
// Auth email templates
import {
  VerificationCodeEmail as VerificationCodeEmailComponent,
  type VerificationCodeEmailProps,
} from '../emails/verification-code-email';
import {
  ResetPasswordCodeEmail as ResetPasswordCodeEmailComponent,
  type ResetPasswordCodeEmailProps,
} from '../emails/reset-password-code-email';
import {
  InvitationEmail as InvitationEmailComponent,
  type InvitationEmailProps,
} from '../emails/invitation-email';
import {
  PasswordChangedEmail as PasswordChangedEmailComponent,
  type PasswordChangedEmailProps,
} from '../emails/password-changed-email';
import {
  PasswordRemovedEmail as PasswordRemovedEmailComponent,
  type PasswordRemovedEmailProps,
} from '../emails/password-removed-email';
import {
  PrimaryEmailChangedEmail as PrimaryEmailChangedEmailComponent,
  type PrimaryEmailChangedEmailProps,
} from '../emails/primary-email-changed-email';
import {
  NewDeviceSignInEmail as NewDeviceSignInEmailComponent,
  type NewDeviceSignInEmailProps,
} from '../emails/new-device-sign-in-email';
// Identity verification email templates
import {
  IdentityVerificationCompletedEmail as IdentityVerificationCompletedEmailComponent,
  type IdentityVerificationCompletedEmailProps,
} from '../emails/identity-verification-completed-email';
import {
  IdentityVerificationRejectedEmail as IdentityVerificationRejectedEmailComponent,
  type IdentityVerificationRejectedEmailProps,
} from '../emails/identity-verification-rejected-email';
// Missing document refund email templates
import {
  SellerEarningsRetainedEmail as SellerEarningsRetainedEmailComponent,
  type SellerEarningsRetainedEmailProps,
} from '../emails/seller-earnings-retained-email';
import {
  BuyerTicketCancelledEmail as BuyerTicketCancelledEmailComponent,
  type BuyerTicketCancelledEmailProps,
} from '../emails/buyer-ticket-cancelled-email';
import type {
  NotificationType,
  TypedNotificationMetadata,
} from '@revendiste/shared';

export type {NotificationType};

import type {NotificationAction} from '@revendiste/shared';

export interface EmailTemplateProps<
  T extends NotificationType = NotificationType,
> {
  notificationType: T;
  actions?: NotificationAction[];
  metadata?: TypedNotificationMetadata<T>;
  appBaseUrl?: string;
}

/**
 * Get the appropriate email template component and props for a notification
 * Returns the component and props ready for rendering
 */
export function getEmailTemplate<T extends NotificationType>(
  props: EmailTemplateProps<T>,
): {
  Component: React.ComponentType<any>;
  props: Record<string, any>;
} {
  const {notificationType, metadata, actions, appBaseUrl} = props;

  const uploadUrl = actions?.find(a => a.type === 'upload_documents')?.url;
  const orderUrl = actions?.find(a => a.type === 'view_order')?.url;
  const retryUrl = actions?.find(a => a.type === 'retry_payment')?.url;
  const payoutUrl = actions?.find(a => a.type === 'view_payout')?.url;

  switch (notificationType) {
    case 'document_reminder': {
      const meta = metadata as TypedNotificationMetadata<'document_reminder'>;
      return {
        Component: DocumentReminderEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          eventStartDate: meta?.eventStartDate || new Date().toISOString(),
          ticketCount: meta?.ticketCount || 1,
          hoursUntilEvent: meta?.hoursUntilEvent || 24,
          uploadUrl:
            uploadUrl ||
            `${appBaseUrl}/cuenta/publicaciones?subirTicket=${meta?.listingId}`,
          appBaseUrl,
        },
      };
    }

    case 'order_confirmed': {
      const meta = metadata as TypedNotificationMetadata<'order_confirmed'>;
      // Find flyer image from event images if available in metadata
      const flyerImageUrl = undefined; // Will be populated from order data if needed
      return {
        Component: OrderConfirmedEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          eventStartDate: meta?.eventStartDate,
          eventEndDate: meta?.eventEndDate,
          venueName: meta?.venueName,
          venueAddress: meta?.venueAddress,
          flyerImageUrl,
          orderId: meta?.orderId || '',
          confirmedAt: undefined, // Will be populated from order data if needed
          totalAmount: meta?.totalAmount || '0.00',
          subtotalAmount: meta?.subtotalAmount || '0.00',
          platformCommission: meta?.platformCommission || '0.00',
          vatOnCommission: meta?.vatOnCommission || '0.00',
          currency: meta?.currency || 'EUR',
          items: meta?.items || [],
          orderUrl:
            orderUrl || `${appBaseUrl}/cuenta/tickets?orderId=${meta?.orderId}`,
          appBaseUrl,
        },
      };
    }

    case 'order_expired': {
      const meta = metadata as TypedNotificationMetadata<'order_expired'>;
      return {
        Component: OrderExpiredEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          appBaseUrl,
        },
      };
    }

    case 'order_invoice': {
      const meta = metadata as TypedNotificationMetadata<'order_invoice'>;
      return {
        Component: OrderInvoiceEmailComponent,
        props: {
          orderId: meta?.orderId || '',
          party: meta?.party || 'buyer',
          eventName: meta?.eventName,
          appBaseUrl,
          currency: meta?.currency,
          subtotalAmount: meta?.subtotalAmount,
          platformCommission: meta?.platformCommission,
          vatOnCommission: meta?.vatOnCommission,
          totalAmount: meta?.totalAmount,
          items: meta?.items,
          sellerSubtotal: meta?.sellerSubtotal,
          sellerCommission: meta?.sellerCommission,
          sellerVat: meta?.sellerVat,
          sellerAmount: meta?.sellerAmount,
        },
      };
    }

    case 'payment_failed': {
      const meta = metadata as TypedNotificationMetadata<'payment_failed'>;
      return {
        Component: PaymentFailedEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          errorMessage: meta?.errorMessage,
          retryUrl: retryUrl || `${appBaseUrl}/checkout/${meta?.orderId}`,
          appBaseUrl,
        },
      };
    }

    case 'ticket_sold_seller': {
      const meta = metadata as TypedNotificationMetadata<'ticket_sold_seller'>;
      return {
        Component: SellerTicketSoldEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          eventStartDate: meta?.eventStartDate || new Date().toISOString(),
          ticketCount: meta?.ticketCount || 1,
          uploadUrl: meta?.shouldPromptUpload
            ? uploadUrl ||
              `${appBaseUrl}/cuenta/publicaciones?subirTicket=${meta?.listingId}`
            : undefined,
          hoursUntilAvailable: undefined,
          appBaseUrl,
        },
      };
    }

    case 'document_uploaded': {
      const meta = metadata as TypedNotificationMetadata<'document_uploaded'>;
      return {
        Component: DocumentUploadedEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          ticketCount: meta?.ticketCount || 1,
          orderUrl:
            orderUrl || `${appBaseUrl}/cuenta/tickets?orderId=${meta?.orderId}`,
          appBaseUrl,
        },
      };
    }

    case 'document_uploaded_batch': {
      const meta =
        metadata as TypedNotificationMetadata<'document_uploaded_batch'>;
      return {
        Component: DocumentUploadedBatchEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          uploadedCount: meta?.uploadedCount || 1,
          tickets: meta?.tickets || [],
          orderUrl:
            orderUrl || `${appBaseUrl}/cuenta/tickets?orderId=${meta?.orderId}`,
          appBaseUrl,
        } as DocumentUploadedBatchEmailProps,
      };
    }

    case 'payout_processing': {
      // Legacy notification type - no longer used, but kept for backward compatibility
      // Map to completed template since processing now goes directly to completed
      const meta = metadata as TypedNotificationMetadata<'payout_processing'>;
      return {
        Component: PayoutCompletedEmailComponent,
        props: {
          payoutId: meta?.payoutId || '',
          amount: meta?.amount || '0.00',
          currency: meta?.currency || 'UYU',
          transactionReference: meta?.transactionReference,
          completedAt: new Date().toISOString(),
          payoutUrl:
            payoutUrl ||
            `${appBaseUrl}/cuenta/retiro?payoutId=${meta?.payoutId}`,
          appBaseUrl,
        },
      };
    }

    case 'payout_completed': {
      const meta = metadata as TypedNotificationMetadata<'payout_completed'>;
      return {
        Component: PayoutCompletedEmailComponent,
        props: {
          payoutId: meta?.payoutId || '',
          amount: meta?.amount || '0.00',
          currency: meta?.currency || 'UYU',
          transactionReference: meta?.transactionReference,
          completedAt: meta?.completedAt || new Date().toISOString(),
          payoutUrl:
            payoutUrl ||
            `${appBaseUrl}/cuenta/retiro?payoutId=${meta?.payoutId}`,
          appBaseUrl,
        },
      };
    }

    case 'payout_failed': {
      const meta = metadata as TypedNotificationMetadata<'payout_failed'>;
      return {
        Component: PayoutFailedEmailComponent,
        props: {
          payoutId: meta?.payoutId || '',
          amount: meta?.amount || '0.00',
          currency: meta?.currency || 'UYU',
          failureReason: meta?.failureReason || 'Error desconocido',
          payoutUrl:
            payoutUrl ||
            `${appBaseUrl}/cuenta/retiro?payoutId=${meta?.payoutId}`,
          appBaseUrl,
        },
      };
    }

    case 'payout_cancelled': {
      const meta = metadata as TypedNotificationMetadata<'payout_cancelled'>;
      return {
        Component: PayoutCancelledEmailComponent,
        props: {
          payoutId: meta?.payoutId || '',
          amount: meta?.amount || '0.00',
          currency: meta?.currency || 'UYU',
          cancellationReason:
            meta?.cancellationReason || 'Cancelación sin motivo especificado',
          payoutUrl:
            payoutUrl ||
            `${appBaseUrl}/cuenta/retiro?payoutId=${meta?.payoutId}`,
          appBaseUrl,
        },
      };
    }

    // Auth notification types
    case 'auth_verification_code': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_verification_code'>;
      return {
        Component: VerificationCodeEmailComponent,
        props: {
          otpCode: meta?.otpCode || '',
          requestedFrom: meta?.requestedFrom,
          requestedAt: meta?.requestedAt,
          appBaseUrl,
        } as VerificationCodeEmailProps,
      };
    }

    case 'auth_reset_password_code': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_reset_password_code'>;
      return {
        Component: ResetPasswordCodeEmailComponent,
        props: {
          otpCode: meta?.otpCode || '',
          requestedFrom: meta?.requestedFrom,
          requestedAt: meta?.requestedAt,
          appBaseUrl,
        } as ResetPasswordCodeEmailProps,
      };
    }

    case 'auth_invitation': {
      const meta = metadata as TypedNotificationMetadata<'auth_invitation'>;
      return {
        Component: InvitationEmailComponent,
        props: {
          inviterName: meta?.inviterName,
          expiresInDays: meta?.expiresInDays || 7,
          actionUrl: meta?.actionUrl || appBaseUrl || '',
          appBaseUrl,
        } as InvitationEmailProps,
      };
    }

    case 'auth_password_changed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_password_changed'>;
      return {
        Component: PasswordChangedEmailComponent,
        props: {
          greetingName: meta?.greetingName,
          primaryEmailAddress: meta?.primaryEmailAddress || '',
          appBaseUrl,
        } as PasswordChangedEmailProps,
      };
    }

    case 'auth_password_removed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_password_removed'>;
      return {
        Component: PasswordRemovedEmailComponent,
        props: {
          greetingName: meta?.greetingName,
          primaryEmailAddress: meta?.primaryEmailAddress || '',
          appBaseUrl,
        } as PasswordRemovedEmailProps,
      };
    }

    case 'auth_primary_email_changed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_primary_email_changed'>;
      return {
        Component: PrimaryEmailChangedEmailComponent,
        props: {
          newEmailAddress: meta?.newEmailAddress || '',
          appBaseUrl,
        } as PrimaryEmailChangedEmailProps,
      };
    }

    case 'auth_new_device_sign_in': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_new_device_sign_in'>;
      return {
        Component: NewDeviceSignInEmailComponent,
        props: {
          signInMethod: meta?.signInMethod,
          deviceType: meta?.deviceType,
          browserName: meta?.browserName,
          operatingSystem: meta?.operatingSystem,
          location: meta?.location,
          ipAddress: meta?.ipAddress,
          sessionCreatedAt: meta?.sessionCreatedAt || new Date().toISOString(),
          revokeSessionUrl: meta?.revokeSessionUrl,
          supportEmail: meta?.supportEmail || 'ayuda@revendiste.com',
          appBaseUrl,
        } as NewDeviceSignInEmailProps,
      };
    }

    // Identity verification notification types
    case 'identity_verification_completed': {
      return {
        Component: IdentityVerificationCompletedEmailComponent,
        props: {
          appBaseUrl,
        } as IdentityVerificationCompletedEmailProps,
      };
    }

    case 'identity_verification_rejected': {
      const meta =
        metadata as TypedNotificationMetadata<'identity_verification_rejected'>;
      const verifyUrl = actions?.find(a => a.type === 'start_verification')?.url;
      return {
        Component: IdentityVerificationRejectedEmailComponent,
        props: {
          rejectionReason:
            meta?.rejectionReason || 'Motivo no especificado',
          canRetry: meta?.canRetry ?? true,
          retryUrl: verifyUrl || `${appBaseUrl}/cuenta/verificar`,
          appBaseUrl,
        } as IdentityVerificationRejectedEmailProps,
      };
    }

    // In-app only notification types (no email template needed)
    case 'identity_verification_failed':
    case 'identity_verification_manual_review':
      throw new Error(
        `Notification type ${notificationType} is in_app only and does not have an email template`,
      );

    // Missing document refund notification types
    case 'seller_earnings_retained': {
      const meta =
        metadata as TypedNotificationMetadata<'seller_earnings_retained'>;
      return {
        Component: SellerEarningsRetainedEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          ticketCount: meta?.ticketCount || 1,
          reason: meta?.reason || 'other',
          totalAmount: meta?.totalAmount,
          currency: meta?.currency,
          appBaseUrl,
        } as SellerEarningsRetainedEmailProps,
      };
    }

    case 'buyer_ticket_cancelled': {
      const meta =
        metadata as TypedNotificationMetadata<'buyer_ticket_cancelled'>;
      return {
        Component: BuyerTicketCancelledEmailComponent,
        props: {
          eventName: meta?.eventName || 'el evento',
          ticketCount: meta?.ticketCount || 1,
          reason: meta?.reason || 'other',
          orderId: '', // Not stored in metadata, but not critical for email
          orderUrl: orderUrl || `${appBaseUrl}/cuenta/tickets`,
          appBaseUrl,
        } as BuyerTicketCancelledEmailProps,
      };
    }

    default:
      throw new Error(`Unknown notification type: ${notificationType}`);
  }
}
