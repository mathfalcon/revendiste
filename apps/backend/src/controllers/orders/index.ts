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
} from '@tsoa/runtime';
import {OrdersService} from '~/services/orders';
import {requireAuthMiddleware} from '~/middleware';
import {
  OrdersRepository,
  OrderItemsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  ListingTicketsRepository,
  OrderTicketReservationsRepository,
} from '~/repositories';
import {db} from '~/db';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  BadRequestError,
} from '~/errors';
import {CreateOrderRouteBody, CreateOrderRouteSchema} from './validation';
import {ValidateBody, Body} from '~/decorators';

type CreateOrderResponse = ReturnType<OrdersService['createOrder']>;
type GetOrderByIdResponse = ReturnType<OrdersService['getOrderById']>;
type GetUserOrdersResponse = ReturnType<OrdersService['getUserOrders']>;
type GetOrderTicketsResponse = ReturnType<OrdersService['getOrderTickets']>;

@Route('orders')
@Middlewares(requireAuthMiddleware)
@Tags('Orders')
export class OrdersController {
  private service = new OrdersService(
    new OrdersRepository(db),
    new OrderItemsRepository(db),
    new EventsRepository(db),
    new EventTicketWavesRepository(db),
    new ListingTicketsRepository(db),
    new OrderTicketReservationsRepository(db),
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
    return this.service.createOrder(
      {
        ...body,
      },
      request.user.id,
    );
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
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getMyOrders(
    @Request() request: express.Request,
  ): Promise<GetUserOrdersResponse> {
    return this.service.getUserOrders(request.user.id);
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
}
