import {Request, Response, NextFunction} from 'express';
import {CLERK_WEBHOOK_SECRET} from '~/config/env';
import {Webhook, WebhookRequiredHeaders} from 'svix';
import {WEBHOOK_ERROR_MESSAGES} from '~/constants/error-messages';
import {logger} from '~/utils';

export const validateClerkWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  try {
    wh.verify(JSON.stringify(req.body), req.headers as unknown as WebhookRequiredHeaders);
  } catch {
    logger.warn('Clerk webhook signature verification failed');
    res.status(400).json({error: WEBHOOK_ERROR_MESSAGES.VERIFICATION_FAILED});
    return;
  }

  next();
};
