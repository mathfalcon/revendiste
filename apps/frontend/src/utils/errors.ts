import {UploadAvailabilityReason} from '~/lib';

/**
 * Get user-friendly message for why upload is not available
 */
export function getUploadUnavailableMessage(
  reason: UploadAvailabilityReason,
  platform: string,
): string {
  switch (reason) {
    case 'event_ended':
      return 'El evento ya finalizó';
    case 'too_early':
      if (platform.toLowerCase() === 'entraste') {
        return 'Los tickets estarán disponibles 12 horas antes del evento';
      }
      return 'Los tickets aún no están disponibles';
    default:
      return 'No se puede subir el documento en este momento';
  }
}
