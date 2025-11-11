import {Request, Response, NextFunction} from 'express';
import crypto from 'crypto';
import {DLOCAL_API_KEY, DLOCAL_SECRET_KEY} from '~/config/env';
import {logger} from '~/utils';
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
      logger.warn('dLocal webhook received without Authorization header');
      throw new UnauthorizedError('Missing Authorization header');
    }

    // Extract signature from header
    // Format: "V2-HMAC-SHA256, Signature: <signature>"
    const signatureMatch = authHeader.match(/Signature:\s*([a-f0-9]+)/i);

    if (!signatureMatch || !signatureMatch[1]) {
      logger.warn('dLocal webhook has invalid Authorization header format', {
        authHeader,
      });
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
      logger.warn('dLocal webhook signature validation failed', {
        receivedSignature,
        expectedSignature,
        payload,
      });
      throw new UnauthorizedError('Invalid webhook signature');
    }

    logger.info('dLocal webhook signature validated successfully', {
      paymentId: req.body.payment_id,
    });

    return next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: error.message,
      });
      return;
    }

    logger.error('Error validating dLocal webhook', {error});
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate webhook',
    });
  }
};
