import express from 'express';
import {Route, Post, Tags, Request, Middlewares} from '@tsoa/runtime';
import {validateDLocalWebhook} from '~/middleware/validateDLocalWebhook';
import {WebhooksService} from '~/services/webhooks';
import {db} from '~/db';
import {ValidateBody, Body} from '~/decorators';
import {
  DLocalWebhookrRouteBody,
  DLocalWebhookValidationSchema,
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
    await this.webhooksService.handleDLocalPaymentWebhook(body.payment_id, {
      ipAddress,
      userAgent,
    });

    // Return immediately to acknowledge receipt
    return {received: true};
  }
}
