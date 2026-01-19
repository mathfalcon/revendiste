import {UploadAvailabilityReason} from '~/lib';

/**
 * Get user-friendly message for why upload is not available
 */
export function getUploadUnavailableMessage(
  reason: UploadAvailabilityReason,
  _platform: string, // Kept for backwards compatibility
  uploadAvailableAt?: string,
): string {
  switch (reason) {
    case 'event_ended':
      return 'El evento ya finalizó';
    case 'too_early':
      if (uploadAvailableAt) {
        const date = new Date(uploadAvailableAt);
        return `Podrás subir el ticket a partir del ${date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      }
      return 'Los tickets aún no están disponibles';
    default:
      return 'No se puede subir el documento en este momento';
  }
}
