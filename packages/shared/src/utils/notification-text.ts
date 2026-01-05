/**
 * Notification Text Generator
 *
 * Generates title and description for in-app notifications from type + metadata.
 * This centralizes notification text logic and eliminates the need to store
 * title/description in the database.
 */

import {TypedNotificationMetadata} from '~/schemas';
import type {NotificationType} from '../types';

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
        description = `¡Tus ${meta.ticketCount} ${
          meta.ticketCount === 1
            ? 'entrada ha sido vendida'
            : 'entradas han sido vendidas'
        } para ${
          meta.eventName
        }! Por favor, sube los documentos de tus tickets.`;
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

        description = `¡Tus ${meta.ticketCount} ${
          meta.ticketCount === 1
            ? 'entrada ha sido vendida'
            : 'entradas han sido vendidas'
        } para ${
          meta.eventName
        }! Los documentos estarán disponibles en aproximadamente ${hoursUntilAvailable} ${
          hoursUntilAvailable === 1 ? 'hora' : 'horas'
        }.`;
      } else {
        description = `¡Tus ${meta.ticketCount} ${
          meta.ticketCount === 1
            ? 'entrada ha sido vendida'
            : 'entradas han sido vendidas'
        } para ${meta.eventName}!`;
      }

      return {
        title: '¡Tus entradas han sido vendidas!',
        description,
      };
    }

    case 'document_reminder': {
      const meta = metadata as TypedNotificationMetadata<'document_reminder'>;
      const hoursText =
        meta.hoursUntilEvent === 1 ? '1 hora' : `${meta.hoursUntilEvent} horas`;

      return {
        title: 'Recordatorio: Sube los documentos de tus tickets',
        description: `El evento "${
          meta.eventName
        }" comienza en ${hoursText}. Aún tienes ${meta.ticketCount} ${
          meta.ticketCount === 1
            ? 'ticket sin documentar'
            : 'tickets sin documentar'
        }. Por favor, sube los documentos lo antes posible.`,
      };
    }

    case 'order_confirmed': {
      const meta = metadata as TypedNotificationMetadata<'order_confirmed'>;
      return {
        title: 'Orden confirmada',
        description: `Tu orden para ${meta.eventName} ha sido confirmada. Total pagado: ${meta.totalAmount} ${meta.currency}.`,
      };
    }

    case 'order_expired': {
      const meta = metadata as TypedNotificationMetadata<'order_expired'>;
      return {
        title: 'Orden expirada',
        description: `Tu orden para ${meta.eventName} ha expirado. Las entradas han sido liberadas.`,
      };
    }

    case 'payment_failed': {
      const meta = metadata as TypedNotificationMetadata<'payment_failed'>;
      return {
        title: 'Pago fallido',
        description: `El pago para tu orden de ${meta.eventName} ha fallado. ${
          meta.errorMessage
            ? `Error: ${meta.errorMessage}`
            : 'Por favor, intenta nuevamente.'
        }`,
      };
    }

    case 'payment_succeeded': {
      const meta = metadata as TypedNotificationMetadata<'payment_succeeded'>;
      return {
        title: 'Pago exitoso',
        description: `Tu pago de ${meta.totalAmount} ${meta.currency} para ${meta.eventName} fue procesado exitosamente.`,
      };
    }

    case 'document_uploaded': {
      const meta = metadata as TypedNotificationMetadata<'document_uploaded'>;
      return {
        title: '¡Tus entradas están listas!',
        description: `El vendedor subió los documentos de tus ${
          meta.ticketCount === 1 ? 'entrada' : 'entradas'
        } para ${meta.eventName}. Ya puedes acceder a ellas.`,
      };
    }

    case 'payout_processing': {
      // Legacy notification type - no longer used, but kept for backward compatibility
      // Map to completed text since processing now goes directly to completed
      const meta = metadata as TypedNotificationMetadata<'payout_processing'>;
      const refText = meta.transactionReference
        ? ` Referencia: ${meta.transactionReference}.`
        : '';
      return {
        title: 'Retiro completado',
        description: `Tu retiro de ${meta.amount} ${meta.currency} ha sido completado exitosamente.${refText}`,
      };
    }

    case 'payout_completed': {
      const meta = metadata as TypedNotificationMetadata<'payout_completed'>;
      const refText = meta.transactionReference
        ? ` Referencia: ${meta.transactionReference}.`
        : '';
      return {
        title: 'Retiro completado',
        description: `Tu retiro de ${meta.amount} ${meta.currency} ha sido completado exitosamente.${refText}`,
      };
    }

    case 'payout_failed': {
      const meta = metadata as TypedNotificationMetadata<'payout_failed'>;
      return {
        title: 'Retiro fallido',
        description: `Tu retiro de ${meta.amount} ${meta.currency} ha fallado: ${meta.failureReason}`,
      };
    }

    case 'payout_cancelled': {
      const meta = metadata as TypedNotificationMetadata<'payout_cancelled'>;
      return {
        title: 'Retiro cancelado',
        description: `Tu retiro de ${meta.amount} ${meta.currency} ha sido cancelado: ${meta.cancellationReason}`,
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
        description: `${inviterText} unirte a Revendiste. La invitación expira en ${meta.expiresInDays} días.`,
      };
    }

    case 'auth_password_changed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_password_changed'>;
      return {
        title: 'Contraseña cambiada',
        description: `La contraseña asociada a ${meta.primaryEmailAddress} fue cambiada correctamente.`,
      };
    }

    case 'auth_password_removed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_password_removed'>;
      return {
        title: 'Contraseña eliminada',
        description: `La contraseña asociada a ${meta.primaryEmailAddress} fue eliminada.`,
      };
    }

    case 'auth_primary_email_changed': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_primary_email_changed'>;
      return {
        title: 'Email actualizado',
        description: `Tu email principal fue actualizado a ${meta.newEmailAddress}.`,
      };
    }

    case 'auth_new_device_sign_in': {
      const meta =
        metadata as TypedNotificationMetadata<'auth_new_device_sign_in'>;
      const deviceInfo = [meta.deviceType, meta.browserName, meta.operatingSystem]
        .filter(Boolean)
        .join(' ');
      return {
        title: 'Nuevo inicio de sesión',
        description: `Se detectó un nuevo inicio de sesión${deviceInfo ? ` desde ${deviceInfo}` : ''}${meta.location ? ` en ${meta.location}` : ''}.`,
      };
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = type;
      throw new Error(`Unknown notification type: ${_exhaustive}`);
    }
  }
}
