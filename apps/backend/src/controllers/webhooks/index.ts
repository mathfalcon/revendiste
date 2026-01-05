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
import {db} from '~/db';
import {ValidateBody, Body} from '~/decorators';
import {logger} from '~/utils';
import {
  DLocalWebhookrRouteBody,
  DLocalWebhookValidationSchema,
  ClerkWebhookRouteBody,
  ClerkWebhookValidationSchema,
} from './validation';

@Route('webhooks')
@Tags('Webhooks')
export class WebhooksController {
  private webhooksService = new WebhooksService(db);

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
