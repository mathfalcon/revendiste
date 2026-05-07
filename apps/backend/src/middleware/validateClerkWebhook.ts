import {Request, Response, NextFunction} from 'express';
import {CLERK_WEBHOOK_SECRET} from '~/config/env';
import {Webhook, WebhookRequiredHeaders} from 'svix';
import {WEBHOOK_ERROR_MESSAGES} from '~/constants/error-messages';
import {logger} from '~/utils';
import {wideEvent} from '~/utils/logFields';

export const validateClerkWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  const svixId = req.headers['svix-id'];
  const eventType =
    typeof req.body === 'object' && req.body && 'type' in req.body
      ? String((req.body as {type?: string}).type)
      : undefined;

  try {
    wh.verify(
      JSON.stringify(req.body),
      req.headers as unknown as WebhookRequiredHeaders,
    );
  } catch {
    logger.warn(
      'webhooks.clerk.signature',
      wideEvent('webhooks.clerk.signature', {
        svixId: typeof svixId === 'string' ? svixId : undefined,
        eventType,
        reason: 'verification_failed',
        outcome: 'failure',
      }),
    );
    res.status(400).json({error: WEBHOOK_ERROR_MESSAGES.VERIFICATION_FAILED});
    return;
  }

  next();
};
