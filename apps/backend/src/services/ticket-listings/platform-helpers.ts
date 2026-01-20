import type {QrAvailabilityTiming} from '@revendiste/shared';
import {getUploadWindowStatus} from '@revendiste/shared';
import {UploadAvailability} from './types';

/**
 * Determine if a document can be uploaded for a ticket based on QR availability timing.
 *
 * This is a thin wrapper around the shared getUploadWindowStatus() utility,
 * kept for backwards compatibility with existing code.
 *
 * Rules:
 * - If qrAvailabilityTiming is null, upload is allowed anytime before event ends
 * - If qrAvailabilityTiming is set (e.g., '6h'), upload is only allowed within that window before event start
 * - Upload is never allowed after event has ended
 */
export function canUploadDocumentForPlatform(
  _platform: string, // Kept for backwards compatibility, no longer used
  eventStartDate: Date,
  eventEndDate: Date,
  _hasDocument: boolean, // Kept for backwards compatibility, no longer used
  qrAvailabilityTiming: QrAvailabilityTiming | null = null,
): UploadAvailability {
  const status = getUploadWindowStatus(
    eventStartDate,
    eventEndDate,
    qrAvailabilityTiming,
  );

  if (status.canUpload) {
    return {canUpload: true};
  }

  if (status.reason === 'event_ended') {
    return {
      canUpload: false,
      reason: 'event_ended',
    };
  }

  // reason === 'too_early'
  return {
    canUpload: false,
    reason: 'too_early',
    uploadAvailableAt: status.uploadAvailableAt,
  };
}
