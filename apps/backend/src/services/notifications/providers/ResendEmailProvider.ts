import {Resend} from 'resend';
import {logger} from '~/utils';
import type {IEmailProvider} from './IEmailProvider';
import {RESEND_API_KEY, EMAIL_FROM} from '~/config/env';

/** Resend default: 2 requests per second per team. */
const RESEND_RATE_LIMIT_PER_SECOND = 2;
const WINDOW_MS = 1000;
/** Max retries on 429 rate_limit_exceeded (total attempts = MAX_RETRIES + 1). */
const MAX_RETRIES_ON_RATE_LIMIT = 3;
/** Default wait (seconds) when retry-after header is missing. */
const DEFAULT_RETRY_AFTER_SECONDS = 1;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse retry-after from Resend response headers (seconds until limit reset).
 * Header value is in seconds per IETF draft. Clamp to a sensible range.
 */
function getRetryAfterSeconds(headers: Record<string, string> | null): number {
  if (!headers) return DEFAULT_RETRY_AFTER_SECONDS;
  const raw =
    headers['retry-after'] ?? headers['ratelimit-reset'] ?? '';
  const sec = parseInt(raw, 10);
  if (!Number.isFinite(sec) || sec < 0) return DEFAULT_RETRY_AFTER_SECONDS;
  return Math.min(sec, 60);
}

/**
 * Resend Email Provider
 *
 * Production email provider using Resend API.
 * - Throttles sends to stay under Resend's limit (2 requests/second).
 * - On 429 rate_limit_exceeded, retries after the delay from the response
 *   header `retry-after` (or `ratelimit-reset`), per Resend docs.
 *
 * Uses React Email components directly via Resend's `react` prop,
 * which provides better type safety and eliminates the need to render to HTML.
 *
 * Setup:
 * 1. Create account at https://resend.com
 * 2. Get API key from dashboard
 * 3. Set RESEND_API_KEY environment variable
 * 4. Verify your domain (or use Resend's test domain for development)
 * 5. Set EMAIL_FROM to your verified domain email
 */
export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;
  /** Timestamps of recent sends (within last second) for rate limiting. */
  private recentSendTimes: number[] = [];

  constructor() {
    if (!RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY is required for ResendEmailProvider. Please set it in your environment variables.',
      );
    }

    this.resend = new Resend(RESEND_API_KEY);
  }

  /**
   * Wait until we are under the rate limit, then record this send.
   */
  private async throttle(): Promise<void> {
    const now = Date.now();
    this.recentSendTimes = this.recentSendTimes.filter(
      t => now - t < WINDOW_MS,
    );
    if (this.recentSendTimes.length >= RESEND_RATE_LIMIT_PER_SECOND) {
      const oldest = this.recentSendTimes[0]!;
      const waitMs = oldest + WINDOW_MS - now;
      if (waitMs > 0) {
        logger.debug('Resend rate limit: waiting before send', {
          waitMs,
          recentSends: this.recentSendTimes.length,
        });
        await sleep(waitMs);
        return this.throttle();
      }
    }
    this.recentSendTimes.push(Date.now());
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    html?: string;
    react?: React.ReactElement;
    text?: string;
    from?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }): Promise<void> {
    const fromEmail = params.from || EMAIL_FROM;

    if (!fromEmail) {
      throw new Error(
        'EMAIL_FROM is required. Please set it in your environment variables or pass it as a parameter.',
      );
    }

    if (!params.html) {
      throw new Error('`html` parameter is required to send an email.');
    }

    const sendPayload = {
      from: `Revendiste <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: 'ayuda@revendiste.com' as const,
      attachments: params.attachments?.map(a => ({
        filename: a.filename,
        content:
          Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
      })),
    };

    const maxAttempts = MAX_RETRIES_ON_RATE_LIMIT + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.throttle();

        const result = await this.resend.emails.send(sendPayload);

        if (result.error) {
          const isRateLimit =
            result.error.statusCode === 429 ||
            result.error.name === 'rate_limit_exceeded';

          if (isRateLimit && attempt < maxAttempts - 1) {
            const waitSec = getRetryAfterSeconds(result.headers);
            logger.warn('Resend rate limit (429), retrying after header delay', {
              retryAfterSeconds: waitSec,
              attempt: attempt + 1,
              maxAttempts,
              to: params.to,
              subject: params.subject,
            });
            await sleep(waitSec * 1000);
            continue;
          }

          logger.error('Resend email send failed', {
            error: result.error,
            to: params.to,
            subject: params.subject,
          });
          throw new Error(
            `Resend email send failed: ${JSON.stringify(result.error)}`,
          );
        }

        logger.info('Email sent via Resend', {
          emailId: result.data?.id,
          to: params.to,
          subject: params.subject,
        });
        return;
      } catch (error) {
        logger.error('Error sending email via Resend', {
          error: error instanceof Error ? error.message : String(error),
          to: params.to,
          subject: params.subject,
        });
        throw error;
      }
    }

    throw new Error(
      'Resend email send failed: max retries exceeded (unexpected)',
    );
  }
}
