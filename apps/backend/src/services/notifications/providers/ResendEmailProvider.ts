import {Resend} from 'resend';
import {logger} from '~/utils';
import type {IEmailProvider} from './IEmailProvider';
import {RESEND_API_KEY, EMAIL_FROM} from '~/config/env';

/**
 * Resend Email Provider
 *
 * Production email provider using Resend API.
 * Provides excellent deliverability and developer experience.
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

  constructor() {
    if (!RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY is required for ResendEmailProvider. Please set it in your environment variables.',
      );
    }

    this.resend = new Resend(RESEND_API_KEY);
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    html?: string;
    react?: React.ReactElement;
    text?: string;
    from?: string;
  }): Promise<void> {
    try {
      const fromEmail = params.from || EMAIL_FROM;

      if (!fromEmail) {
        throw new Error(
          'EMAIL_FROM is required. Please set it in your environment variables or pass it as a parameter.',
        );
      }

      if (!params.html) {
        throw new Error('`html` parameter is required to send an email.');
      }

      const result = await this.resend.emails.send({
        from: `Revendiste <${fromEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (result.error) {
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
    } catch (error) {
      logger.error('Error sending email via Resend', {
        error: error instanceof Error ? error.message : String(error),
        to: params.to,
        subject: params.subject,
      });
      throw error;
    }
  }
}
