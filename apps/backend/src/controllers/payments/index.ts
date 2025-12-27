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
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {PaymentsService} from '~/services/payments';
import {db} from '~/db';

interface CreatePaymentLinkResponse {
  redirectUrl: string;
  paymentId: string;
}

@Route('payments')
@Middlewares(requireAuthMiddleware)
@Tags('Payments')
export class PaymentsController {
  private paymentsService = new PaymentsService(db);

  @Post('/create-link/{orderId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Order not found')
  @Response<ValidationError>(
    422,
    'Order has expired or payment already processed',
  )
  public async createPaymentLink(
    @Path() orderId: string,
    @Request() request: express.Request,
  ): Promise<CreatePaymentLinkResponse> {
    const user = request.user;

    return this.paymentsService.createPaymentLink({
      orderId,
      userId: user.id,
      userEmail: user.email,
      userFirstName: user.firstName,
      userLastName: user.lastName,
    });
  }
}
