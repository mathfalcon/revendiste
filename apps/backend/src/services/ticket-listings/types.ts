export type UploadAvailabilityReason = 'event_ended' | 'too_early' | 'unknown';

/**
 * Platform-specific helpers for ticket document upload logic
 */
export interface UploadAvailability {
  canUpload: boolean;
  reason?: UploadAvailabilityReason;
}
