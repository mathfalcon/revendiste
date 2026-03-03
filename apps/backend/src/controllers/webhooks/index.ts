import express from 'express';
import {
  Route,
  Post,
  Tags,
  Request,
  Middlewares,
} from '@mathfalcon/tsoa-runtime';
import {validateDLocalWebhook} from '~/middleware/validateDLocalWebhook';
import {validateClerkWebhook} from '~/middleware/validateClerkWebhook';
import {WebhooksService} from '~/services/webhooks';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {DLocalService} from '~/services/dlocal';
import {ClerkWebhookService} from '~/services/clerk-webhook';
import {TicketListingsService} from '~/services/ticket-listings';
import {SellerEarningsService} from '~/services/seller-earnings';
import {NotificationService} from '~/services/notifications';
import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
  ListingTicketsRepository,
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  SellerEarningsRepository,
  UsersRepository,
  NotificationsRepository,
} from '~/repositories';
import {db} from '~/db';
import {getJobQueueService} from '~/services/job-queue';
import {ValidateBody, Body} from '~/decorators';
import {logger} from '~/utils';
import {
  DLocalWebhookrRouteBody,
  DLocalWebhookValidationSchema,
  ClerkWebhookRouteBody,
  ClerkWebhookValidationSchema,
} from './validation';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';

/**
 * Factory for webhook dependencies. Used by WebhooksController; in tests
 * you can call this with a test db or mock the returned adapter.
 */
export function createWebhookDependencies(database: Kysely<DB> = db) {
  const ordersRepository = new OrdersRepository(database);
  const orderTicketReservationsRepository =
    new OrderTicketReservationsRepository(database);
  const paymentsRepository = new PaymentsRepository(database);
  const paymentEventsRepository = new PaymentEventsRepository(database);
  const listingTicketsRepository = new ListingTicketsRepository(database);
  const ticketListingsRepository = new TicketListingsRepository(database);
  const eventsRepository = new EventsRepository(database);
  const eventTicketWavesRepository = new EventTicketWavesRepository(database);
  const usersRepository = new UsersRepository(database);
  const notificationsRepository = new NotificationsRepository(database);
  const sellerEarningsRepository = new SellerEarningsRepository(database);

  const notificationService = new NotificationService(
    notificationsRepository,
    usersRepository,
  );

  const ticketListingsService = new TicketListingsService(
    ticketListingsRepository,
    eventsRepository,
    eventTicketWavesRepository,
    listingTicketsRepository,
    ordersRepository,
    usersRepository,
    notificationService,
  );

  const sellerEarningsService = new SellerEarningsService(
    sellerEarningsRepository,
    orderTicketReservationsRepository,
  );

  const dlocalAdapter = new PaymentWebhookAdapter(
    new DLocalService(),
    ordersRepository,
    orderTicketReservationsRepository,
    paymentsRepository,
    paymentEventsRepository,
    listingTicketsRepository,
    ticketListingsRepository,
    ticketListingsService,
    sellerEarningsService,
    notificationService,
    () => getJobQueueService(),
  );

  const webhooksService = new WebhooksService(
    dlocalAdapter,
    new ClerkWebhookService(),
  );

  return {webhooksService, dlocalAdapter};
}

const webhookDeps = createWebhookDependencies();

/**
 * Webhook endpoints for dLocal and Clerk.
 * Providers expect 200 within a short time or they treat the request as timed out and may retry.
 * We return 200 immediately and process the payload asynchronously (fire-and-forget).
 */
@Route('webhooks')
@Tags('Webhooks')
export class WebhooksController {
  private webhooksService = webhookDeps.webhooksService;

  /**
   * Receives payment status notifications from dLocal
   * @summary dLocal payment webhook
   */
  @Post('/dlocal')
  @Middlewares(validateDLocalWebhook)
  @ValidateBody(DLocalWebhookValidationSchema)
  public async handleDLocalWebhook(
    @Body() body: DLocalWebhookrRouteBody,
    @Request() request: express.Request,
  ): Promise<{received: boolean}> {
    // Extract metadata from request
    const ipAddress =
      (request.headers['x-forwarded-for'] as string) || request.ip;
    const userAgent = request.headers['user-agent'];

    // Delegate to service
    this.webhooksService.handleDLocalPaymentWebhook(body.payment_id, {
      ipAddress,
      userAgent,
    });

    // Return immediately to acknowledge receipt
    return {received: true};
  }

  /**
   * Receives authentication events from Clerk
   * @summary Clerk authentication webhook
   */
  @Post('/clerk')
  @Middlewares(validateClerkWebhook)
  @ValidateBody(ClerkWebhookValidationSchema)
  public async handleClerkWebhook(
    @Body() body: ClerkWebhookRouteBody,
    @Request() request: express.Request,
  ): Promise<{received: boolean}> {
    // Extract metadata from request
    const ipAddress =
      (request.headers['x-forwarded-for'] as string) || request.ip;
    const userAgent = request.headers['user-agent'];

    // Process webhook asynchronously (fire-and-forget pattern)
    this.webhooksService
      .handleClerkWebhook(body, {
        ipAddress,
        userAgent,
      })
      .then(() => logger.info('Clerk webhook processed', {type: body.type}))
      .catch(error =>
        logger.error('Error processing Clerk webhook', {
          type: body.type,
          error: error.message,
        }),
      );

    // Return immediately to acknowledge receipt
    return {received: true};
  }
}
