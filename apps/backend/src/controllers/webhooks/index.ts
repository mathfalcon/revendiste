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
import {ValidateBody, Body} from '~/decorators';
import {logger} from '~/utils';
import {
  DLocalWebhookrRouteBody,
  DLocalWebhookValidationSchema,
  ClerkWebhookRouteBody,
  ClerkWebhookValidationSchema,
} from './validation';

// Create shared repositories
const ordersRepository = new OrdersRepository(db);
const orderTicketReservationsRepository = new OrderTicketReservationsRepository(
  db,
);
const paymentsRepository = new PaymentsRepository(db);
const paymentEventsRepository = new PaymentEventsRepository(db);
const listingTicketsRepository = new ListingTicketsRepository(db);
const ticketListingsRepository = new TicketListingsRepository(db);
const eventsRepository = new EventsRepository(db);
const eventTicketWavesRepository = new EventTicketWavesRepository(db);
const usersRepository = new UsersRepository(db);
const notificationsRepository = new NotificationsRepository(db);
const sellerEarningsRepository = new SellerEarningsRepository(db);

// Create shared services
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
  listingTicketsRepository,
);

// Create dLocal adapter with all dependencies
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
);

@Route('webhooks')
@Tags('Webhooks')
export class WebhooksController {
  private webhooksService = new WebhooksService(
    dlocalAdapter,
    new ClerkWebhookService(),
  );

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
