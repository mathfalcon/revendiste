/**
 * Buyer notifications tied to an event should not be sent after the event ends.
 */
export function shouldSkipBuyerNotificationForPastEvent(skipIfEventPast?: {
  eventEndDate: Date | string | null;
}): boolean {
  if (skipIfEventPast?.eventEndDate == null) {
    return false;
  }
  const end = new Date(skipIfEventPast.eventEndDate);
  if (Number.isNaN(end.getTime())) {
    return false;
  }
  return end < new Date();
}
