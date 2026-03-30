import express from 'express';
import {
  Route,
  Post,
  Get,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
} from '@mathfalcon/tsoa-runtime';
import {OrdersService} from '~/services/orders';
import {
  requireAuthMiddleware,
  paginationMiddleware,
  ensurePagination,
} from '~/middleware';
import {
  OrdersRepository,
  OrderItemsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  ListingTicketsRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
  TicketListingsRepository,
  SellerEarningsRepository,
  UsersRepository,
  NotificationsRepository,
} from '~/repositories';
import {db} from '~/db';
import {PaymentSyncService} from '~/services/payments/sync';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {getPaymentProvider} from '~/services/payments/providers/PaymentProviderFactory';
import {TicketListingsService} from '~/services/ticket-listings';
import {SellerEarningsService} from '~/services/seller-earnings';
import {NotificationService} from '~/services/notifications';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  BadRequestError,
} from '~/errors';
import {CreateOrderRouteBody, CreateOrderRouteSchema} from './validation';
import {ValidateBody, Body} from '~/decorators';
import {getJobQueueService} from '~/services/job-queue';
import {getPostHog} from '~/lib/posthog';

type CreateOrderResponse = ReturnType<OrdersService['createOrder']>;
type GetOrderByIdResponse = ReturnType<OrdersService['getOrderById']>;
type GetUserOrdersResponse = ReturnType<OrdersService['getUserOrders']>;
type GetOrderTicketsResponse = ReturnType<OrdersService['getOrderTickets']>;
type CancelOrderResponse = ReturnType<OrdersService['cancelOrder']>;

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
);

// Create adapter factory function for payment sync
// This creates an adapter with all dependencies for the given provider
const createPaymentWebhookAdapter = (
  provider: Parameters<typeof getPaymentProvider>[0],
) => {
  const paymentProvider = getPaymentProvider(provider);
  return new PaymentWebhookAdapter(
    paymentProvider,
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
};

// Sync function that creates the adapter and calls the provider
const syncWithProvider = async (
  providerPaymentId: string,
  provider: Parameters<typeof getPaymentProvider>[0],
) => {
  const adapter = createPaymentWebhookAdapter(provider);
  await adapter.syncPaymentStatus(providerPaymentId);
};

@Route('orders')
@Middlewares(requireAuthMiddleware)
@Tags('Orders')
export class OrdersController {
  private service = new OrdersService(
    ordersRepository,
    new OrderItemsRepository(db),
    eventsRepository,
    eventTicketWavesRepository,
    listingTicketsRepository,
    orderTicketReservationsRepository,
    new PaymentSyncService(paymentsRepository, syncWithProvider),
  );

  @Post('/')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<BadRequestError>(
    400,
    'Invalid request body, missing required fields, or invalid data types',
  )
  @Response<NotFoundError>(404, 'Event not found or ticket wave not found')
  @Response<ValidationError>(
    422,
    'Validation failed: Not enough tickets available, event has ended, or invalid ticket selection',
  )
  @ValidateBody(CreateOrderRouteSchema)
  public async create(
    @Body() body: CreateOrderRouteBody,
    @Request() request: express.Request,
  ): Promise<CreateOrderResponse> {
    const result = await this.service.createOrder(
      {
        ...body,
      },
      request.user.id,
    );
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'order_created',
      properties: {
        order_id: result.id,
        event_id: body.eventId,
        total_amount: result.totalAmount,
        currency: result.currency,
      },
    });
    return result;
  }

  @Get('/{orderId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Order not found')
  public async getById(
    @Path() orderId: string,
    @Request() request: express.Request,
  ): Promise<GetOrderByIdResponse> {
    return this.service.getOrderById(orderId, request.user.id);
  }

  @Get('/')
  @Middlewares(
    paginationMiddleware(10, 100),
    ensurePagination,
  )
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getMyOrders(
    @Request() request: express.Request,
  ): Promise<GetUserOrdersResponse> {
    return this.service.getUserOrders(
      request.user.id,
      request.pagination!,
    );
  }

  @Get('/{orderId}/tickets')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Order not found')
  @Response<UnauthorizedError>(
    403,
    'Not authorized to view tickets for this order',
  )
  public async getOrderTickets(
    @Path() orderId: string,
    @Request() request: express.Request,
  ): Promise<GetOrderTicketsResponse> {
    return this.service.getOrderTickets(orderId, request.user.id);
  }

  @Post('/{orderId}/cancel')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Order not found')
  @Response<ValidationError>(422, 'Order cannot be cancelled (not pending)')
  public async cancelOrder(
    @Path() orderId: string,
    @Request() request: express.Request,
  ): Promise<CancelOrderResponse> {
    const result = await this.service.cancelOrder(orderId, request.user.id);
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'order_cancelled',
      properties: {
        order_id: orderId,
      },
    });
    return result;
  }
}
