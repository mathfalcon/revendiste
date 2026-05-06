/**
 * Document Reminder Utilities
 *
 * Functions for calculating notification milestones and determining
 * when document upload reminders should be sent.
 *
 * Note: For upload window logic, use @revendiste/shared utilities:
 * - parseQrAvailabilityTiming
 * - calculateHoursUntilEvent
 * - getUploadWindowStatus
 * - isWithinUploadWindow
 */

// Re-export shared utilities for convenience
export {
  parseQrAvailabilityTiming,
  calculateHoursUntilEvent,
  getUploadWindowStatus,
  isWithinUploadWindow,
} from '@revendiste/shared';

/**
 * Fixed milestone thresholds (in hours before event)
 * Notifications are sent at these times if the seller hasn't uploaded documents yet
 */
export const MILESTONE_THRESHOLDS = [72, 48, 24, 12, 6, 3, 2, 1] as const;

export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number];

/**
 * ±30min band around each milestone (cron runs hourly).
 */
function resolveNarrowDocumentReminderMilestone(
  hoursUntilEvent: number,
  qrAvailabilityHours: number | null,
): MilestoneThreshold | null {
  for (const milestone of MILESTONE_THRESHOLDS) {
    if (qrAvailabilityHours !== null && milestone > qrAvailabilityHours) {
      continue;
    }
    const windowStart = milestone - 0.5;
    const windowEnd = milestone + 0.5;
    if (hoursUntilEvent >= windowStart && hoursUntilEvent <= windowEnd) {
      return milestone;
    }
  }
  return null;
}

/**
 * Milestone used for dedupe + notification metadata: narrow band hit, or QR-window catch-up.
 *
 * **Catch-up (only when `qrAvailabilityHours` is set):** if upload is already allowed
 * (`hoursUntilEvent <= qrAvailabilityHours`) but the job never ran inside the ±30min band
 * for the next applicable milestone (e.g. hourly cron missed 6h), we still return that
 * milestone so the seller gets one reminder and `hasDocumentReminderForListing` stays consistent.
 */
export function resolveDocumentReminderMilestone(
  hoursUntilEvent: number,
  qrAvailabilityHours: number | null,
): MilestoneThreshold | null {
  const narrow = resolveNarrowDocumentReminderMilestone(
    hoursUntilEvent,
    qrAvailabilityHours,
  );
  if (narrow !== null) {
    return narrow;
  }

  if (
    qrAvailabilityHours === null ||
    hoursUntilEvent <= 0 ||
    hoursUntilEvent > qrAvailabilityHours
  ) {
    return null;
  }

  const applicable = getApplicableMilestones(qrAvailabilityHours);
  for (const m of [...applicable].sort((a, b) => b - a)) {
    if (hoursUntilEvent < m - 0.5) {
      return m;
    }
  }

  return null;
}

/**
 * Calculate which milestone we're at based on hours until event
 * Returns the milestone hour threshold or null if not at a milestone
 *
 * Milestones: 72h, 48h, 24h, 12h, 6h, 3h, 2h, 1h before event
 * Uses ±30 minute window to catch milestones when cron runs hourly
 *
 * @param hoursUntilEvent - Hours until the event starts
 * @returns The milestone threshold (72, 48, 24, 12, 6, 3, 2, 1) or null
 */
export function getNotificationMilestone(
  hoursUntilEvent: number,
): MilestoneThreshold | null {
  return resolveNarrowDocumentReminderMilestone(hoursUntilEvent, null);
}

/**
 * Determines if a ticket should receive a reminder notification based on:
 * - How many hours until the event
 * - Whether the event has a QR availability timing restriction
 *
 * For events WITHOUT qrAvailabilityTiming:
 *   - Send at any milestone time (±30min bands)
 *
 * For events WITH qrAvailabilityTiming:
 *   - Same bands, but only milestones <= QR window
 *   - Plus catch-up inside the upload window when bands were missed (see `resolveDocumentReminderMilestone`)
 *
 * @param hoursUntilEvent - Hours until the event starts
 * @param qrAvailabilityHours - QR availability window in hours, or null if no restriction
 * @returns true if a notification should be sent
 */
export function shouldSendDocumentReminder(
  hoursUntilEvent: number,
  qrAvailabilityHours: number | null,
): boolean {
  return (
    resolveDocumentReminderMilestone(hoursUntilEvent, qrAvailabilityHours) !==
    null
  );
}

/**
 * Get all milestones that apply for a given QR availability window
 *
 * @param qrAvailabilityHours - QR availability window in hours, or null for all milestones
 * @returns Array of applicable milestones
 */
export function getApplicableMilestones(
  qrAvailabilityHours: number | null,
): MilestoneThreshold[] {
  if (qrAvailabilityHours === null) {
    return [...MILESTONE_THRESHOLDS];
  }

  return MILESTONE_THRESHOLDS.filter(
    milestone => milestone <= qrAvailabilityHours,
  );
}

/** Structured breakdown for logs / support (notify-upload-availability cron). */
export function getDocumentReminderMilestoneDiagnostics(
  hoursUntilEvent: number,
  qrAvailabilityHours: number | null,
) {
  const applicableMilestones = getApplicableMilestones(qrAvailabilityHours);
  const narrowMilestone = resolveNarrowDocumentReminderMilestone(
    hoursUntilEvent,
    qrAvailabilityHours,
  );
  const resolvedMilestone = resolveDocumentReminderMilestone(
    hoursUntilEvent,
    qrAvailabilityHours,
  );
  const shouldSend = resolvedMilestone !== null;

  const windows = applicableMilestones.map(milestoneHours => ({
    milestoneHours,
    windowStartHoursBeforeEvent: milestoneHours - 0.5,
    windowEndHoursBeforeEvent: milestoneHours + 0.5,
    inWindow:
      hoursUntilEvent >= milestoneHours - 0.5 &&
      hoursUntilEvent <= milestoneHours + 0.5,
  }));

  return {
    hoursUntilEvent,
    hoursUntilEventRounded: Math.round(hoursUntilEvent * 1000) / 1000,
    qrAvailabilityHours,
    applicableMilestones: [...applicableMilestones],
    narrowMilestone,
    resolvedMilestone,
    usedCatchUp:
      narrowMilestone === null &&
      resolvedMilestone !== null,
    shouldSend,
    windows,
  };
}
