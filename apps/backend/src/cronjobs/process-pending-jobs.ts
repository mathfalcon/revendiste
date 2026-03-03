import cron from 'node-cron';
import { db } from '~/db';
import {
  JobsRepository,
  InvoicesRepository,
  OrderTicketReservationsRepository,
  OrdersRepository,
  UsersRepository,
  NotificationsRepository,
  NotificationBatchesRepository,
} from '~/repositories';
import {
  JobQueueService,
  getJobQueueService,
  setJobQueueInstance,
} from '~/services/job-queue';
import { getFeuAuthService, FeuClient } from '~/services/feu';
import { InvoiceService } from '~/services/invoices';
import { NotificationService } from '~/services/notifications';
import {
  createNotifyOrderConfirmedHandler,
  createNotifySellerTicketSoldHandler,
  createSendNotificationHandler,
} from '~/services/job-handlers';
import { createPostSendActionRunners } from '~/services/job-handlers/post-send-action-runners';
import { getStorageProvider } from '~/services/storage';
import { logger } from '~/utils';
import { FEU_AUTH_URL, FEU_API_BASE_URL } from '~/config/env';

let jobQueueService: JobQueueService | null = null;

/**
 * Initialize job queue with all handlers.
 * Called once at server startup.
 */
export function initializeJobQueue(): JobQueueService {
  if (jobQueueService) return jobQueueService;

  const jobsRepository = new JobsRepository(db);
  jobQueueService = new JobQueueService(jobsRepository);
  setJobQueueInstance(jobQueueService);

  const usersRepository = new UsersRepository(db);
  const notificationsRepository = new NotificationsRepository(db);
  const notificationBatchesRepository = new NotificationBatchesRepository(db);
  const notificationService = new NotificationService(
    notificationsRepository,
    usersRepository,
    notificationBatchesRepository,
  );
  const invoicesRepository = new InvoicesRepository(db);
  const orderTicketReservationsRepository =
    new OrderTicketReservationsRepository(db);
  const storageProvider = getStorageProvider();

  let invoiceService: InvoiceService | undefined;
  if (FEU_AUTH_URL && FEU_API_BASE_URL) {
    const feuAuth = getFeuAuthService();
    const feuClient = new FeuClient(feuAuth);
    const ordersRepository = new OrdersRepository(db);
    invoiceService = new InvoiceService({
      invoicesRepository,
      ordersRepository,
      orderTicketReservationsRepository,
      feuClient,
      storageProvider,
    });
  }

  const postSendActionRunners = createPostSendActionRunners({
    invoiceService,
  });

  jobQueueService.registerHandler(
    'send-notification',
    createSendNotificationHandler(
      notificationService,
      notificationsRepository,
      storageProvider,
      postSendActionRunners,
    ),
  );

  if (FEU_AUTH_URL && FEU_API_BASE_URL && invoiceService) {
    jobQueueService.registerHandler(
      'notify-order-confirmed',
      createNotifyOrderConfirmedHandler(invoiceService, notificationService),
    );
    jobQueueService.registerHandler(
      'notify-seller-ticket-sold',
      createNotifySellerTicketSoldHandler(invoiceService, notificationService),
    );
  } else {
    logger.warn(
      'FEU env not configured; notify-order-confirmed and notify-seller-ticket-sold handlers not registered',
    );
  }

  return jobQueueService;
}

/** Re-export so callers can use one place; instance is set in initializeJobQueue() */
export { getJobQueueService } from '~/services/job-queue';

/**
 * Process all pending jobs.
 * Called by cronjob or production run-job script.
 */
export async function runProcessPendingJobs(options?: {
  maxJobsPerRun?: number;
}): Promise<number> {
  initializeJobQueue();
  const service = getJobQueueService();
  const processedCount = await service.processJobs({
    maxJobsPerRun: options?.maxJobsPerRun ?? 50,
  });

  if (processedCount > 0) {
    logger.info('Processed pending jobs', { count: processedCount });
  }

  return processedCount;
}

/**
 * Starts the cron scheduler for process pending jobs.
 * Only used in development/local environments.
 * Runs every 2 minutes so post-payment confirmation emails reach the buyer quickly (production uses same schedule via EventBridge).
 */
export function startProcessPendingJobsJob() {
  const job = cron.schedule('*/2 * * * *', async () => {
    try {
      await runProcessPendingJobs();
    } catch (error) {
      logger.error('Error in process-pending-jobs:', error);
    }
  });

  logger.info(
    'Scheduled job: process-pending-jobs started (runs every 2 minutes)',
  );

  return job;
}
