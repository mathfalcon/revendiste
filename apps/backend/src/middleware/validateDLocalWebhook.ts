import {Request, Response, NextFunction} from 'express';
import crypto from 'crypto';
import {DLOCAL_API_KEY, DLOCAL_SECRET_KEY} from '~/config/env';
import {logger} from '~/utils';
import {wideEvent} from '~/utils/logFields';
import {UnauthorizedError} from '~/errors';

/**
 * Validates dLocal webhook signatures using HMAC-SHA256
 *
 * dLocal signs notifications with: HMAC('sha256', ApiKey + Payload, SecretKey)
 * The signature is sent in the Authorization header:
 * "Authorization": "V2-HMAC-SHA256, Signature: <signature>"
 */
export const validateDLocalWebhook = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn(
        'webhooks.payment.signature',
        wideEvent('webhooks.payment.signature', {
          hasAuthHeader: false,
          headerLooksValid: false,
          paymentId: req.body?.payment_id,
          outcome: 'failure',
        }),
      );
      throw new UnauthorizedError('Missing Authorization header');
    }

    // Extract signature from header
    // Format: "V2-HMAC-SHA256, Signature: <signature>"
    const signatureMatch = authHeader.match(/Signature:\s*([a-f0-9]+)/i);

    if (!signatureMatch || !signatureMatch[1]) {
      logger.warn(
        'webhooks.payment.signature',
        wideEvent('webhooks.payment.signature', {
          hasAuthHeader: true,
          headerLooksValid: false,
          paymentId: req.body?.payment_id,
          outcome: 'failure',
        }),
      );
      throw new UnauthorizedError('Invalid Authorization header format');
    }

    const receivedSignature = signatureMatch[1];

    // Get raw body as string (must be exactly as received)
    const payload = JSON.stringify(req.body);

    // Calculate expected signature
    // Message = ApiKey + Payload
    const message = DLOCAL_API_KEY + payload;

    const expectedSignature = crypto
      .createHmac('sha256', DLOCAL_SECRET_KEY)
      .update(message, 'utf8')
      .digest('hex');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );

    if (!isValid) {
      logger.warn(
        'webhooks.payment.signature',
        wideEvent('webhooks.payment.signature', {
          hasAuthHeader: true,
          headerLooksValid: true,
          paymentId: req.body?.payment_id,
          outcome: 'failure',
        }),
      );
      throw new UnauthorizedError('Invalid webhook signature');
    }

    logger.info(
      'webhooks.payment.signature',
      wideEvent('webhooks.payment.signature', {
        hasAuthHeader: true,
        headerLooksValid: true,
        paymentId: req.body.payment_id,
        outcome: 'success',
      }),
    );

    return next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: error.message,
      });
      return;
    }

    logger.error(
      'webhooks.payment.signature',
      wideEvent('webhooks.payment.signature', {
        paymentId: req.body?.payment_id,
        errorMessage: error instanceof Error ? error.message : String(error),
        outcome: 'failure',
      }),
    );
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate webhook',
    });
  }
};
