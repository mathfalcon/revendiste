/**
 * Notification Text Generator
 *
 * Generates title and description for in-app notifications from type + metadata.
 * This centralizes notification text logic and eliminates the need to store
 * title/description in the database.
 */

import {TypedNotificationMetadata} from '~/schemas';
import type {NotificationType} from '../types';
import {CASE_STATUS_LABELS, CASE_TYPE_LABELS} from '../schemas/ticket-reports';

export interface NotificationText {
  title: string;
  description: string;
}

/**
 * Generate notification title and description from type and metadata
 */
export function generateNotificationText<T extends NotificationType>(
  type: T,
  metadata: TypedNotificationMetadata<T>,
): NotificationText {
  switch (type) {
    case 'ticket_sold_seller': {
      const meta = metadata as TypedNotificationMetadata<'ticket_sold_seller'>;
      let description: string;

      if (meta.shouldPromptUpload) {
        description = `Se ${
          meta.ticketCount === 1 ? 'vendió tu entrada' : `vendieron tus ${meta.ticketCount} entradas`
        } para ${meta.eventName}. Subí los documentos para completar la venta.`;
      } else if (meta.qrAvailabilityTiming) {
        const hoursBeforeEvent = parseInt(
          meta.qrAvailabilityTiming.replace('h', ''),
          10,
        );
        const uploadAvailableAt = new Date(meta.eventStartDate);
        uploadAvailableAt.setHours(
          uploadAvailableAt.getHours() - hoursBeforeEvent,
        );
        const hoursUntilAvailable = Math.ceil(
          (uploadAvailableAt.getTime() - new Date().getTime()) /
            (1000 * 60 * 60),
        );

        description = `Se ${
          meta.ticketCount === 1 ? 'vendió tu entrada' : `vendieron tus ${meta.ticketCount} entradas`
        } para ${meta.eventName}. Vas a poder subir los documentos en ${hoursUntilAvailable} ${
          hoursUntilAvailable === 1 ? 'hora' : 'horas'
        }.`;
      } else {
        description = `Se ${
          meta.ticketCount === 1 ? 'vendió tu entrada' : `vendieron tus ${meta.ticketCount} entradas`
        } para ${meta.eventName}.`;
      }

      return {
        title:
          meta.ticketCount === 1 ? 'Entrada vendida' : 'Entradas vendidas',
        description,
      };
    }

    case 'document_reminder': {
      const meta = metadata as TypedNotificationMetadata<'document_reminder'>;

      // Handle event already started (hoursUntilEvent = 0) vs upcoming event
      const eventStatusText =
        meta.hoursUntilEvent === 0
          ? `${meta.eventName} ya arrancó`
          : `${meta.eventName} arranca en ${
              meta.hoursUntilEvent === 1
                ? '1 hora'
                : `${meta.hoursUntilEvent} horas`
            }`;

      return {
        title: 'Subí los documentos de tus entradas',
        description: `${eventStatusText} y tenés ${meta.ticketCount} ${
          meta.ticketCount === 1
            ? 'entrada sin documentar'
            : 'entradas sin documentar'
        }. Subí los documentos cuanto antes.`,
      };
    }

    case 'order_confirmed': {
      const meta = metadata as TypedNotificationMetadata<'order_confirmed'>;
      return {
        title: 'Pago confirmado',
        description: `Listo, tu compra para ${meta.eventName} está confirmada. Total: ${meta.totalAmount} ${meta.currency}.`,
      };
    }

    case 'order_expired': {
      const meta = metadata as TypedNotificationMetadata<'order_expired'>;
      return {
        title: 'Orden expirada',
        description: `Tu orden para ${meta.eventName} expiró. Las entradas quedaron disponibles para otros compradores.`,
      };
    }

    case 'order_invoice': {
      const meta = metadata as TypedNotificationMetadata<'order_invoice'>;
      const isBuyer = meta.party === 'buyer';
      const compraVenta = isBuyer ? 'compra' : 'venta';
      return {
        title: isBuyer ? 'Factura de compra' : 'Factura de venta',
        description: meta.eventName
          ? `Te enviamos la factura de tu ${compraVenta} de ${meta.eventName} por email.`
          : `Te enviamos la factura de tu ${compraVenta} por email.`,
      };
    }

    case 'payment_failed': {
      const meta = metadata as TypedNotificationMetadata<'payment_failed'>;
      return {
        title: 'No se pudo procesar el pago',
        description: `El pago para ${meta.eventName} falló. ${
          meta.errorMessage
            ? `Motivo: ${meta.errorMessage}`
            : 'Revisá los datos e intentá de nuevo.'
        }`,
      };
    }

    case 'payment_succeeded': {
      const meta = metadata as TypedNotificationMetadata<'payment_succeeded'>;
      return {
        title: 'Pago confirmado',
        description: `Tu pago de ${meta.totalAmount} ${meta.currency} para ${meta.eventName} se procesó correctamente.`,
      };
    }

    case 'document_uploaded': {
      const meta = metadata as TypedNotificationMetadata<'document_uploaded'>;
      return {
        title: 'Tus entradas están listas',
        description: `El vendedor subió ${
          meta.ticketCount === 1 ? 'tu entrada' : `tus ${meta.ticketCount} entradas`
        } para ${meta.eventName}. Ya podés acceder a ellas.`,
      };
    }

    case 'document_uploaded_batch': {
      const meta =
        metadata as TypedNotificationMetadata<'document_uploaded_batch'>;
      const countText =
        meta.uploadedCount === 1
          ? '1 entrada lista'
          : `${meta.uploadedCount} entradas listas`;
      return {
        title: 'Tus entradas están listas',
        description: `Tenés ${countText} para ${meta.eventName}. Ya podés acceder a ellas.`,
      };
    }

    case 'payout_processing': {
      // Legacy notification type - no longer used, but kept for backward compatibility
      const meta = metadata as TypedNotificationMetadata<'payout_processing'>;
      const refText = meta.transactionReference
        ? ` Referencia: ${meta.transactionReference}.`
        : '';
      return {
        title: 'Retiro completado',
        description: `Tu retiro de ${meta.amount} ${meta.currency} se completó.${refText}`,
      };
    }

    case 'payout_completed': {
      const meta = metadata as TypedNotificationMetadata<'payout_completed'>;
      const refText = meta.transactionReference
        ? ` Referencia: ${meta.transactionReference}.`
        : '';
      return {
        title: 'Retiro completado',
        description: `Tu retiro de ${meta.amount} ${meta.currency} se completó.${refText}`,
      };
    }

    case 'payout_failed': {
      const meta = metadata as TypedNotificationMetadata<'payout_failed'>;
      return {
        title: 'Retiro fallido',
        description: `No se pudo procesar tu retiro de ${meta.amount} ${meta.currency}: ${meta.failureReason}`,
      };
    }

    case 'payout_cancelled': {
      const meta = metadata as TypedNotificationMetadata<'payout_cancelled'>;
      return {
        title: 'Retiro cancelado',
        description: `Tu retiro de ${meta.amount} ${meta.currency} fue cancelado: ${meta.cancellationReason}`,
      };
    }

    // Auth notification types
    case 'auth_verification_code': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_verification_code'>;
      return {
        title: 'Código de verificación',
        description: `Tu código de verificación es: ${meta.otpCode}`,
      };
    }

    case 'auth_reset_password_code': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_reset_password_code'>;
      return {
        title: 'Código para restablecer contraseña',
        description: `Tu código para restablecer la contraseña es: ${meta.otpCode}`,
      };
    }

    case 'auth_invitation': {
      const meta = metadata as TypedNotificationMetadata<'auth_invitation'>;
      const inviterText = meta.inviterName
        ? `${meta.inviterName} te invitó a`
        : 'Te invitaron a';
      return {
        title: 'Invitación a Revendiste',
        description: `${inviterText} sumarte a Revendiste. La invitación vence en ${meta.expiresInDays} días.`,
      };
    }

    case 'auth_password_changed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_password_changed'>;
      return {
        title: 'Contraseña cambiada',
        description: `La contraseña de ${meta.primaryEmailAddress} fue cambiada.`,
      };
    }

    case 'auth_password_removed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_password_removed'>;
      return {
        title: 'Contraseña eliminada',
        description: `Se eliminó la contraseña de ${meta.primaryEmailAddress}.`,
      };
    }

    case 'auth_primary_email_changed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_primary_email_changed'>;
      return {
        title: 'Email actualizado',
        description: `Tu email principal ahora es ${meta.newEmailAddress}.`,
      };
    }

    case 'auth_new_device_sign_in': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_new_device_sign_in'>;
      const deviceInfo = [
        meta.deviceType,
        meta.browserName,
        meta.operatingSystem,
      ]
        .filter(Boolean)
        .join(' ');
      return {
        title: 'Nuevo inicio de sesión',
        description: `Alguien inició sesión en tu cuenta${
          deviceInfo ? ` desde ${deviceInfo}` : ''
        }${meta.location ? ` en ${meta.location}` : ''}. Si no fuiste vos, revisá tu cuenta.`,
      };
    }

    // Identity verification notification types
    case 'identity_verification_completed': {
      return {
        title: 'Ya podés vender entradas',
        description:
          'Tu verificación de identidad se completó. Empezá a publicar tus entradas en Revendiste.',
      };
    }

    case 'identity_verification_rejected': {
      const meta =
        metadata as TypedNotificationMetadata<'identity_verification_rejected'>;
      const retryText = meta.canRetry
        ? ' Podés intentarlo de nuevo.'
        : ' Contactá a soporte si tenés dudas.';
      return {
        title: 'Verificación rechazada',
        description: `Tu verificación fue rechazada: ${meta.rejectionReason}.${retryText}`,
      };
    }

    case 'identity_verification_failed': {
      const meta =
        metadata as TypedNotificationMetadata<'identity_verification_failed'>;
      const attemptsText =
        meta.attemptsRemaining > 0
          ? ` Te quedan ${meta.attemptsRemaining} ${
              meta.attemptsRemaining === 1 ? 'intento' : 'intentos'
            }.`
          : '';
      return {
        title: 'Verificación fallida',
        description: `No pudimos verificar tu identidad: ${meta.failureReason}.${attemptsText}`,
      };
    }

    case 'identity_verification_manual_review': {
      return {
        title: 'Verificación en revisión',
        description:
          'Tu verificación está siendo revisada por nuestro equipo. Te avisamos cuando esté lista.',
      };
    }

    // Missing document refund notification types
    case 'seller_earnings_retained': {
      const meta =
        metadata as TypedNotificationMetadata<'seller_earnings_retained'>;
      const ticketText =
        meta.ticketCount === 1 ? '1 entrada' : `${meta.ticketCount} entradas`;
      const reasonText =
        meta.reason === 'missing_document'
          ? 'no subiste los documentos a tiempo'
          : 'incumplimiento de las políticas';
      return {
        title: 'Ganancias retenidas',
        description: `Tus ganancias por ${ticketText} de ${meta.eventName} fueron retenidas porque ${reasonText}. Soporte va a revisar tu caso.`,
      };
    }

    case 'buyer_ticket_cancelled': {
      const meta =
        metadata as TypedNotificationMetadata<'buyer_ticket_cancelled'>;
      const ticketText =
        meta.ticketCount === 1
          ? 'Tu entrada fue cancelada'
          : `Tus ${meta.ticketCount} entradas fueron canceladas`;
      const reasonText =
        meta.reason === 'seller_failed_to_upload'
          ? 'El vendedor no subió los documentos a tiempo'
          : 'Hubo un problema con el vendedor';
      return {
        title: 'Entrada cancelada',
        description: `${ticketText} para ${meta.eventName}. ${reasonText}. Ya estamos procesando tu reembolso.`,
      };
    }

    // Ticket report / case system notification types
    case 'ticket_report_created': {
      const meta =
        metadata as TypedNotificationMetadata<'ticket_report_created'>;
      return {
        title: 'Caso abierto',
        description: `Recibimos tu caso de tipo "${CASE_TYPE_LABELS[meta.caseType]}". Te vamos a avisar sobre el progreso.`,
      };
    }

    case 'ticket_report_status_changed': {
      const meta =
        metadata as TypedNotificationMetadata<'ticket_report_status_changed'>;
      return {
        title: 'Tu caso se actualizó',
        description: `Tu caso pasó a "${CASE_STATUS_LABELS[meta.newStatus]}".`,
      };
    }

    case 'ticket_report_action_added': {
      const meta =
        metadata as TypedNotificationMetadata<'ticket_report_action_added'>;
      return {
        title: 'Novedad en tu caso',
        description: `${meta.performedByRole === 'admin' ? 'Soporte' : 'El usuario'} agregó una actualización a tu caso.`,
      };
    }

    case 'ticket_report_closed': {
      const meta =
        metadata as TypedNotificationMetadata<'ticket_report_closed'>;
      const refundText = meta.refundIssued
        ? ' Se procesó un reembolso.'
        : '';
      return {
        title: 'Caso cerrado',
        description: `Tu caso fue cerrado.${refundText}`,
      };
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = type;
      throw new Error(`Unknown notification type: ${_exhaustive}`);
    }
  }
}
