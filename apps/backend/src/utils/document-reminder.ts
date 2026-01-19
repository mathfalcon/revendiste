/**
 * Document Reminder Utilities
 *
 * Pure functions for calculating notification milestones and determining
 * when document upload reminders should be sent.
 *
 * These functions are extracted for testability and reusability.
 */

/**
 * Fixed milestone thresholds (in hours before event)
 * Notifications are sent at these times if the seller hasn't uploaded documents yet
 */
export const MILESTONE_THRESHOLDS = [72, 48, 24, 12, 6, 3, 2, 1] as const;

export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number];

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
  for (const milestone of MILESTONE_THRESHOLDS) {
    // Check if we're within ±30 minutes (0.5 hours) of the milestone
    const windowStart = milestone - 0.5;
    const windowEnd = milestone + 0.5;

    if (hoursUntilEvent >= windowStart && hoursUntilEvent <= windowEnd) {
      return milestone;
    }
  }

  return null;
}

/**
 * Determines if a ticket should receive a reminder notification based on:
 * - How many hours until the event
 * - Whether the event has a QR availability timing restriction
 *
 * For events WITHOUT qrAvailabilityTiming:
 *   - Send at any milestone time
 *
 * For events WITH qrAvailabilityTiming:
 *   - Only send at milestones within the QR availability window
 *   - e.g., if qrAvailabilityTiming is "12h", only send at 12h, 6h, 3h, 2h, 1h milestones
 *
 * @param hoursUntilEvent - Hours until the event starts
 * @param qrAvailabilityHours - QR availability window in hours, or null if no restriction
 * @returns true if a notification should be sent
 */
export function shouldSendDocumentReminder(
  hoursUntilEvent: number,
  qrAvailabilityHours: number | null,
): boolean {
  for (const milestone of MILESTONE_THRESHOLDS) {
    // If event has QR availability timing, only send at milestones within the window
    if (qrAvailabilityHours !== null && milestone > qrAvailabilityHours) {
      continue; // Skip milestones before QR availability window
    }

    const milestoneWindowStart = milestone - 0.5;
    const milestoneWindowEnd = milestone + 0.5;

    if (
      hoursUntilEvent >= milestoneWindowStart &&
      hoursUntilEvent <= milestoneWindowEnd
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Parse QR availability timing string to hours
 *
 * @param qrAvailabilityTiming - String like "12h", "48h", etc.
 * @returns Hours as number, or null if invalid/missing
 */
export function parseQrAvailabilityTiming(
  qrAvailabilityTiming: string | null | undefined,
): number | null {
  if (!qrAvailabilityTiming) {
    return null;
  }

  const parsed = parseInt(qrAvailabilityTiming.replace('h', ''), 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Calculate hours until an event
 *
 * @param eventStartDate - The event start date
 * @param now - Current time (defaults to new Date())
 * @returns Hours until the event (can be negative if event has passed)
 */
export function calculateHoursUntilEvent(
  eventStartDate: Date,
  now: Date = new Date(),
): number {
  return (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);
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
