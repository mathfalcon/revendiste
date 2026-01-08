import {Request, Response, NextFunction} from 'express';
import {CLERK_WEBHOOK_SECRET} from '~/config/env';
import {Webhook, WebhookRequiredHeaders} from 'svix';

export const validateClerkWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  try {
    wh.verify(JSON.stringify(req.body), req.headers as unknown as WebhookRequiredHeaders);
  } catch (err) {
    res.status(400).json({});
    return;
  }

  next();
};
