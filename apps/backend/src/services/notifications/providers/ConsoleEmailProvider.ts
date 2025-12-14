import {logger} from '~/utils';
import type {IEmailProvider} from './IEmailProvider';

/**
 * Console Email Provider
 *
 * Development/testing provider that logs emails to console instead of sending them.
 * Useful for local development and testing.
 */
export class ConsoleEmailProvider implements IEmailProvider {
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
  }): Promise<void> {
    logger.info('📧 Email would be sent:', {
      to: params.to,
      subject: params.subject,
      from: params.from || 'noreply@revendiste.com',
      text: params.text || 'HTML only',
    });

    // In development, we can log the HTML for debugging
    if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development') {
      logger.debug('Email HTML content:', params.html);
    }
  }
}

