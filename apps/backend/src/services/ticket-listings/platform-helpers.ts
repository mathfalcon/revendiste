import type {QrAvailabilityTiming} from '@revendiste/shared';
import {UploadAvailability} from './types';

/**
 * Parse QR availability timing string to hours
 * e.g., '12h' -> 12, '24h' -> 24
 */
function parseQrAvailabilityTimingToHours(
  timing: QrAvailabilityTiming,
): number {
  return parseInt(timing.replace('h', ''), 10);
}

/**
 * Determine if a document can be uploaded for a ticket based on QR availability timing.
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
  const now = new Date();

  // Can't upload after event has ended
  if (now > eventEndDate) {
    return {
      canUpload: false,
      reason: 'event_ended',
    };
  }

  // If no QR availability timing is set, allow upload anytime before event ends
  if (!qrAvailabilityTiming) {
    return {
      canUpload: true,
    };
  }

  // Calculate the upload window based on qrAvailabilityTiming
  const hoursBeforeEvent = parseQrAvailabilityTimingToHours(qrAvailabilityTiming);
  const uploadAvailableAt = new Date(eventStartDate);
  uploadAvailableAt.setHours(uploadAvailableAt.getHours() - hoursBeforeEvent);

  // If we're before the upload window, it's too early
  if (now < uploadAvailableAt) {
    return {
      canUpload: false,
      reason: 'too_early',
      uploadAvailableAt,
    };
  }

  return {
    canUpload: true,
  };
}
