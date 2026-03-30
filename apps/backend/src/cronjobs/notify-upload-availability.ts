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
import {getNotificationMilestone} from '~/utils/document-reminder';
import {getTimezoneForCountry} from '@revendiste/shared';

// Create shared repositories and services
const listingTicketsRepository = new ListingTicketsRepository(db);
const notificationsRepository = new NotificationsRepository(db);
const usersRepository = new UsersRepository(db);
const notificationService = new NotificationService(
  notificationsRepository,
  usersRepository,
);

/**
 * Runs the notify upload availability job logic once
 * Used by production EventBridge + ECS RunTask
 *
 * Logic:
 * - For events WITHOUT qrAvailabilityTiming: send at any milestone (72h, 48h, 24h, 12h, 6h, 3h, 2h, 1h)
 * - For events WITH qrAvailabilityTiming: only send at milestones within the QR availability window
 */
export async function runNotifyUploadAvailability() {
  try {
    logger.info('Starting scheduled notification of upload availability...');

    // Get tickets at milestone times (repository handles qrAvailability filtering)
    const tickets =
      await listingTicketsRepository.getTicketsEnteringUploadWindow();

    if (tickets.length === 0) {
      logger.debug('No tickets at milestone times needing notifications');
      return;
    }

    logger.info('Found tickets needing upload reminders', {
      count: tickets.length,
    });

    // Group tickets by seller and listing to send one notification per seller per listing
    const ticketsBySellerAndListing = new Map<
      string,
      {
        sellerUserId: string;
        listingId: string;
        venueCountry: string | null;
        tickets: Array<{
          ticketId: string;
          eventName: string;
          eventStartDate: Date;
        }>;
      }
    >();

    for (const ticket of tickets) {
      const key = `${ticket.sellerUserId}::${ticket.listingId}`;
      if (!ticketsBySellerAndListing.has(key)) {
        ticketsBySellerAndListing.set(key, {
          sellerUserId: ticket.sellerUserId,
          listingId: ticket.listingId,
          venueCountry: ticket.venueCountry,
          tickets: [],
        });
      }
      ticketsBySellerAndListing.get(key)!.tickets.push({
        ticketId: ticket.ticketId,
        eventName: ticket.eventName || 'el evento',
        eventStartDate: new Date(ticket.eventStartDate!),
      });
    }

    // Send notifications for each seller/listing group
    let notificationCount = 0;
    const now = new Date();

    for (const [, group] of ticketsBySellerAndListing.entries()) {
      const {sellerUserId, listingId, tickets: ticketGroup} = group;
      const firstTicket = ticketGroup[0]!;

      // Calculate hours until event
      const hoursUntilEvent =
        (firstTicket.eventStartDate.getTime() - now.getTime()) /
        (1000 * 60 * 60);

      // Get the current milestone we're at
      const milestone = getNotificationMilestone(hoursUntilEvent);

      if (milestone === null) {
        // Not at a milestone (shouldn't happen since repository already filtered)
        continue;
      }

      // Check if notification was already sent for this milestone
      const alreadySent =
        await notificationsRepository.hasDocumentReminderForListing(
          sellerUserId,
          listingId,
          milestone,
        );

      if (alreadySent) {
        logger.debug('Notification already sent for this milestone', {
          sellerUserId,
          listingId,
          milestone,
        });
        continue;
      }

      // Send notification (fire-and-forget)
      notifyDocumentReminder(notificationService, {
        sellerUserId,
        listingId,
        eventName: firstTicket.eventName,
        eventStartDate: firstTicket.eventStartDate,
        eventTimezone: getTimezoneForCountry(group.venueCountry),
        ticketCount: ticketGroup.length,
        hoursUntilEvent: milestone,
      }).catch(error => {
        logger.error('Failed to send document reminder notification', {
          sellerUserId,
          listingId,
          milestone,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      notificationCount++;
    }

    logger.info('Upload availability notifications sent', {
      ticketsFound: tickets.length,
      groupsProcessed: ticketsBySellerAndListing.size,
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
