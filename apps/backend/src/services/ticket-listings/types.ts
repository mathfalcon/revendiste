export type UploadAvailabilityReason = 'event_ended' | 'too_early' | 'unknown';

/**
 * Upload availability result with optional timing information
 */
export interface UploadAvailability {
  canUpload: boolean;
  reason?: UploadAvailabilityReason;
  /** When upload will become available (only set if reason is 'too_early') */
  uploadAvailableAt?: Date;
}
