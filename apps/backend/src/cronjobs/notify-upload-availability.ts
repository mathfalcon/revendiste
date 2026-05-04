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
import {
  parseQrAvailabilityTiming,
  resolveDocumentReminderMilestone,
} from '~/utils/document-reminder';
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
 * - Targets listing tickets without a primary document (sold or unsold), same milestone rules.
 * - For events WITHOUT qrAvailabilityTiming: send at any milestone (72h, 48h, 24h, 12h, 6h, 3h, 2h, 1h)
 * - For events WITH qrAvailabilityTiming: only send at milestones within the QR availability window
 */
export async function runNotifyUploadAvailability() {
  const job = 'notify-upload-availability';
  try {
    const startedAt = new Date();
    logger.info(`${job}: job start`, {
      startedAtIso: startedAt.toISOString(),
    });

    // Get tickets at milestone times (repository handles qrAvailability filtering)
    const tickets =
      await listingTicketsRepository.getTicketsEnteringUploadWindow();

    if (tickets.length === 0) {
      logger.info(`${job}: no tickets matched milestone windows (see prior repo logs for DB candidates and per-ticket diagnostics)`);
      return;
    }

    logger.info(`${job}: found tickets past milestone filter`, {
      count: tickets.length,
    });

    // One notification per listing (not per ticket): same seller + listingId → one reminder, ticketCount = tickets missing docs
    const ticketsBySellerAndListing = new Map<
      string,
      {
        sellerUserId: string;
        listingId: string;
        venueCountry: string | null;
        qrAvailabilityTiming: string | null;
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
          qrAvailabilityTiming: ticket.qrAvailabilityTiming ?? null,
          tickets: [],
        });
      }
      ticketsBySellerAndListing.get(key)!.tickets.push({
        ticketId: ticket.ticketId,
        eventName: ticket.eventName || 'el evento',
        eventStartDate: new Date(ticket.eventStartDate!),
      });
    }

    let listingsNotified = 0;
    const now = new Date();

    for (const [, group] of ticketsBySellerAndListing.entries()) {
      const {sellerUserId, listingId, tickets: ticketGroup} = group;
      const firstTicket = ticketGroup[0]!;

      // Calculate hours until event
      const hoursUntilEvent =
        (firstTicket.eventStartDate.getTime() - now.getTime()) /
        (1000 * 60 * 60);

      const qrAvailabilityHours = parseQrAvailabilityTiming(
        group.qrAvailabilityTiming,
      );
      const milestone = resolveDocumentReminderMilestone(
        hoursUntilEvent,
        qrAvailabilityHours,
      );

      if (milestone === null) {
        logger.warn(`${job}: milestone null after repo filter (unexpected)`, {
          sellerUserId,
          listingId,
          hoursUntilEvent:
            Math.round(
              ((firstTicket.eventStartDate.getTime() - now.getTime()) /
                (1000 * 60 * 60)) *
                1000,
            ) / 1000,
          qrAvailabilityHours,
        });
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
        logger.info(`${job}: skipping — document reminder already sent for milestone`, {
          sellerUserId,
          listingId,
          milestone,
        });
        continue;
      }

      // One createNotification per listing (channels send in-process unless helper opts into job deferral)
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

      logger.info(`${job}: document reminder dispatched (per listing)`, {
        sellerUserId,
        listingId,
        milestone,
        ticketsWithoutDocInListing: ticketGroup.length,
      });

      listingsNotified++;
    }

    logger.info(`${job}: job finished`, {
      ticketsScanned: tickets.length,
      distinctListingsProcessed: ticketsBySellerAndListing.size,
      documentRemindersDispatched: listingsNotified,
      durationMs: Date.now() - startedAt.getTime(),
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
