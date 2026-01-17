import cron from 'node-cron';
import {db} from '~/db';
import {NotificationService} from '~/services/notifications';
import {
  ListingTicketsRepository,
  NotificationsRepository,
  UsersRepository,
} from '~/repositories';
import {notifyDocumentReminder} from '~/services/notifications/helpers';
import {logger} from '~/utils';

/**
 * Fixed milestone thresholds (in hours before event)
 * These are sent after the initial QR availability notification
 */
const MILESTONE_THRESHOLDS = [24, 12, 6, 3, 2, 1];

/**
 * Check if we're at the QR availability time (first notification)
 * Returns true if current time is within ±30 minutes of when QR becomes available
 */
function isAtQrAvailabilityTime(
  hoursUntilEvent: number,
  qrAvailabilityHours: number,
): boolean {
  const windowStart = qrAvailabilityHours - 0.5;
  const windowEnd = qrAvailabilityHours + 0.5;
  return hoursUntilEvent >= windowStart && hoursUntilEvent <= windowEnd;
}

/**
 * Calculate which milestone we're at based on hours until event
 * Returns the milestone hour threshold (24, 12, 6, 3, 2, or 1) or null if not at a milestone
 *
 * Milestones: 24h, 12h, 6h, 3h, 2h, 1h before event
 * Uses ±30 minute window to catch milestones when cron runs hourly
 */
function getNotificationMilestone(hoursUntilEvent: number): number | null {
  for (const milestone of MILESTONE_THRESHOLDS) {
    // Check if we're within ±30 minutes of the milestone
    const windowStart = milestone - 0.5;
    const windowEnd = milestone + 0.5;

    if (hoursUntilEvent >= windowStart && hoursUntilEvent <= windowEnd) {
      return milestone;
    }
  }

  return null;
}

/**
 * Check if a milestone should be sent (it's after QR availability time)
 */
function shouldSendMilestone(
  milestone: number,
  qrAvailabilityHours: number,
): boolean {
  return milestone <= qrAvailabilityHours;
}

/**
 * Runs the notify upload availability job logic once
 * Used by production EventBridge + ECS RunTask
 */
export async function runNotifyUploadAvailability() {
  const listingTicketsRepository = new ListingTicketsRepository(db);
  const notificationsRepository = new NotificationsRepository(db);
  const notificationService = new NotificationService(
    db,
    new UsersRepository(db),
  );

  try {
    logger.info('Starting scheduled notification of upload availability...');

    // Get tickets entering upload window or at milestone times
    const tickets =
      await listingTicketsRepository.getTicketsEnteringUploadWindow();

    if (tickets.length === 0) {
      logger.debug('No tickets entering upload window or at milestones');
      return;
    }

    // Group tickets by seller and listing to send one notification per seller per listing
    // Use a composite key with a delimiter that won't appear in UUIDs or user IDs
    const ticketsBySellerAndListing = new Map<
      string,
      {
        sellerUserId: string;
        listingId: string;
        tickets: Array<{
          ticketId: string;
          eventName: string;
          eventStartDate: Date;
          qrAvailabilityTiming: string | null;
        }>;
      }
    >();

    for (const ticket of tickets) {
      const key = `${ticket.sellerUserId}::${ticket.listingId}`;
      if (!ticketsBySellerAndListing.has(key)) {
        ticketsBySellerAndListing.set(key, {
          sellerUserId: ticket.sellerUserId,
          listingId: ticket.listingId,
          tickets: [],
        });
      }
      ticketsBySellerAndListing.get(key)!.tickets.push({
        ticketId: ticket.ticketId,
        eventName: ticket.eventName || 'el evento',
        eventStartDate: new Date(ticket.eventStartDate!),
        qrAvailabilityTiming: ticket.qrAvailabilityTiming,
      });
    }

    // Send notifications for each seller/listing group
    let notificationCount = 0;
    const now = new Date();

    for (const [, group] of ticketsBySellerAndListing.entries()) {
      const {sellerUserId, listingId, tickets: ticketGroup} = group;
      const firstTicket = ticketGroup[0]!;

      // Parse QR availability timing (e.g., "48h" -> 48)
      if (!firstTicket.qrAvailabilityTiming) {
        continue;
      }

      const qrAvailabilityHours = parseInt(
        firstTicket.qrAvailabilityTiming.replace('h', ''),
        10,
      );

      if (isNaN(qrAvailabilityHours)) {
        logger.warn('Invalid QR availability timing', {
          listingId,
          qrAvailabilityTiming: firstTicket.qrAvailabilityTiming,
        });
        continue;
      }

      // Calculate hours until event
      const hoursUntilEvent = Math.ceil(
        (firstTicket.eventStartDate.getTime() - now.getTime()) /
          (1000 * 60 * 60),
      );

      // Check if we're at QR availability time (first notification)
      const atQrAvailability = isAtQrAvailabilityTime(
        hoursUntilEvent,
        qrAvailabilityHours,
      );

      // Determine which notification to send:
      // - If at QR availability time: send initial notification (priority)
      // - If at a milestone (and NOT at QR availability time): send milestone notification
      // This prevents duplicate notifications when QR availability coincides with a milestone

      if (atQrAvailability) {
        // Check if initial notification was already sent
        const alreadySent =
          await notificationsRepository.hasDocumentReminderForListing(
            sellerUserId,
            listingId,
            qrAvailabilityHours, // Use the QR availability hours for consistency
          );

        if (!alreadySent) {
          // Fire-and-forget notification (don't await to avoid blocking)
          notifyDocumentReminder(notificationService, {
            sellerUserId,
            listingId,
            eventName: firstTicket.eventName,
            eventStartDate: firstTicket.eventStartDate,
            ticketCount: ticketGroup.length,
            hoursUntilEvent: qrAvailabilityHours,
          }).catch(error => {
            logger.error(
              'Failed to send initial upload availability notification',
              {
                sellerUserId,
                listingId,
                error: error instanceof Error ? error.message : String(error),
              },
            );
          });

          notificationCount++;
        }
      } else {
        // Only check milestones if we're NOT at QR availability time
        const milestone = getNotificationMilestone(hoursUntilEvent);

        if (
          milestone !== null &&
          shouldSendMilestone(milestone, qrAvailabilityHours)
        ) {
          // Check if milestone notification was already sent
          const alreadySent =
            await notificationsRepository.hasDocumentReminderForListing(
              sellerUserId,
              listingId,
              milestone,
            );

          if (!alreadySent) {
            // Fire-and-forget notification (don't await to avoid blocking)
            notifyDocumentReminder(notificationService, {
              sellerUserId,
              listingId,
              eventName: firstTicket.eventName,
              eventStartDate: firstTicket.eventStartDate,
              ticketCount: ticketGroup.length,
              hoursUntilEvent: milestone,
            }).catch(error => {
              logger.error('Failed to send milestone notification', {
                sellerUserId,
                listingId,
                milestone,
                error: error instanceof Error ? error.message : String(error),
              });
            });

            notificationCount++;
          }
        }
      }
    }

    logger.info('Upload availability notifications sent', {
      ticketsFound: tickets.length,
      notificationsSent: notificationCount,
    });
  } catch (error) {
    logger.error('Error in scheduled upload availability notification:', error);
    throw error;
  }
}

/**
 * Starts the cron scheduler for notify upload availability job
 * Only used in development/local environments
 * In production, use runNotifyUploadAvailability() via EventBridge
 */
export function startNotifyUploadAvailabilityJob() {
  const job = cron.schedule('0 * * * *', async () => {
    try {
      await runNotifyUploadAvailability();
    } catch (error) {
      logger.error(
        'Error in scheduled upload availability notification:',
        error,
      );
    }
  });

  logger.info(
    'Scheduled job: notify-upload-availability started (runs every hour)',
  );

  return job;
}
