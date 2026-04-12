import express from 'express';
import {
  Route,
  Post,
  Tags,
  Middlewares,
  Request,
  Path,
  Response,
} from '@mathfalcon/tsoa-runtime';
import {requireAuthMiddleware} from '~/middleware';
import {Body, ValidateBody} from '~/decorators';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {PaymentsService} from '~/services/payments';
import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
} from '~/repositories';
import {db} from '~/db';
import {
  CreatePaymentLinkRouteBody,
  CreatePaymentLinkRouteSchema,
} from './validation';
import {getPostHog} from '~/lib/posthog';

type CreatePaymentLinkResponse = Awaited<
  ReturnType<PaymentsService['createPaymentLink']>
>;

@Route('payments')
@Middlewares(requireAuthMiddleware)
@Tags('Payments')
export class PaymentsController {
  private paymentsService = new PaymentsService(
    new OrdersRepository(db),
    new OrderTicketReservationsRepository(db),
    new PaymentsRepository(db),
    new PaymentEventsRepository(db),
  );

  @Post('/create-link/{orderId}')
  @ValidateBody(CreatePaymentLinkRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Order not found')
  @Response<ValidationError>(
    422,
    'Order has expired or payment already processed',
  )
  public async createPaymentLink(
    @Path() orderId: string,
    @Body() body: CreatePaymentLinkRouteBody,
    @Request() request: express.Request,
  ): Promise<CreatePaymentLinkResponse> {
    const user = request.user;

    const result = await this.paymentsService.createPaymentLink({
      orderId,
      userId: user.id,
      userEmail: user.email,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      country: body?.country,
    });
    getPostHog()?.capture({
      distinctId: user.id,
      event: 'payment_link_created',
      properties: {
        order_id: orderId,
        country: body?.country,
      },
    });
    return result;
  }
}
