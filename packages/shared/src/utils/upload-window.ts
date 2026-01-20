import type {QrAvailabilityTiming} from '../types';

/**
 * Upload Window Utilities
 *
 * Single source of truth for determining if a ticket can have documents uploaded.
 * Used by both frontend and backend to ensure consistent behavior.
 */

/**
 * Parse QR availability timing string to hours
 *
 * @param qrAvailabilityTiming - String like "12h", "48h", etc.
 * @returns Hours as number, or null if invalid/missing
 */
export function parseQrAvailabilityTiming(
  qrAvailabilityTiming: QrAvailabilityTiming | string | null | undefined,
): number | null {
  if (!qrAvailabilityTiming) {
    return null;
  }

  const parsed = parseInt(qrAvailabilityTiming.replace('h', ''), 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Calculate hours until an event starts
 *
 * @param eventStartDate - The event start date
 * @param now - Current time (defaults to new Date())
 * @returns Hours until the event starts (can be negative if event has started)
 */
export function calculateHoursUntilEvent(
  eventStartDate: Date | string,
  now: Date = new Date(),
): number {
  const startDate =
    typeof eventStartDate === 'string'
      ? new Date(eventStartDate)
      : eventStartDate;
  return (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export type UploadWindowStatus =
  | {canUpload: true}
  | {canUpload: false; reason: 'event_ended'}
  | {canUpload: false; reason: 'too_early'; uploadAvailableAt: Date};

/**
 * Determine if a ticket is within the upload window.
 *
 * Upload is allowed when:
 * 1. Event has NOT ended (eventEndDate > now)
 * 2. AND one of:
 *    - qrAvailabilityTiming is null (no restriction, always available)
 *    - OR current time is within qrAvailabilityTiming hours before event start
 *
 * @param eventStartDate - When the event starts
 * @param eventEndDate - When the event ends
 * @param qrAvailabilityTiming - QR availability window (e.g., "12h", "6h") or null
 * @param now - Current time (defaults to new Date())
 * @returns Upload window status with canUpload boolean and reason if not allowed
 */
export function getUploadWindowStatus(
  eventStartDate: Date | string,
  eventEndDate: Date | string,
  qrAvailabilityTiming: QrAvailabilityTiming | string | null | undefined,
  now: Date = new Date(),
): UploadWindowStatus {
  const endDate =
    typeof eventEndDate === 'string' ? new Date(eventEndDate) : eventEndDate;
  const startDate =
    typeof eventStartDate === 'string'
      ? new Date(eventStartDate)
      : eventStartDate;

  // Can't upload after event has ended
  if (now > endDate) {
    return {
      canUpload: false,
      reason: 'event_ended',
    };
  }

  // If no QR availability timing, upload is always allowed before event ends
  const qrHours = parseQrAvailabilityTiming(qrAvailabilityTiming);
  if (qrHours === null) {
    return {canUpload: true};
  }

  // Calculate when upload becomes available
  const uploadAvailableAt = new Date(startDate);
  uploadAvailableAt.setHours(uploadAvailableAt.getHours() - qrHours);

  // If we're before the upload window, it's too early
  if (now < uploadAvailableAt) {
    return {
      canUpload: false,
      reason: 'too_early',
      uploadAvailableAt,
    };
  }

  return {canUpload: true};
}

/**
 * Simple boolean check if upload is currently allowed.
 * Use getUploadWindowStatus() if you need the reason.
 *
 * @param eventStartDate - When the event starts
 * @param eventEndDate - When the event ends
 * @param qrAvailabilityTiming - QR availability window (e.g., "12h", "6h") or null
 * @param now - Current time (defaults to new Date())
 * @returns true if upload is allowed
 */
export function isWithinUploadWindow(
  eventStartDate: Date | string,
  eventEndDate: Date | string,
  qrAvailabilityTiming: QrAvailabilityTiming | string | null | undefined,
  now: Date = new Date(),
): boolean {
  return getUploadWindowStatus(
    eventStartDate,
    eventEndDate,
    qrAvailabilityTiming,
    now,
  ).canUpload;
}
