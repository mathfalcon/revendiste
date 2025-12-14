import {EMAIL_PROVIDER, RESEND_API_KEY} from '~/config/env';
import {ConsoleEmailProvider} from './ConsoleEmailProvider';
import {ResendEmailProvider} from './ResendEmailProvider';
import type {IEmailProvider} from './IEmailProvider';

/**
 * Email Provider Factory
 *
 * Creates and returns the appropriate email provider based on configuration.
 * This allows us to easily switch between email providers (console, Resend, SMTP, etc.)
 * without changing the application code.
 */
class EmailProviderFactory {
  private static instance: IEmailProvider | null = null;

  /**
   * Get the email provider instance (singleton)
   */
  static getProvider(): IEmailProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /**
   * Create a new email provider based on configuration
   */
  private static createProvider(): IEmailProvider {
    switch (EMAIL_PROVIDER) {
      case 'console':
        return new ConsoleEmailProvider();

      case 'resend':
        if (!RESEND_API_KEY) {
          throw new Error(
            'RESEND_API_KEY is required when EMAIL_PROVIDER is set to "resend". Please set it in your environment variables.',
          );
        }
        return new ResendEmailProvider();
      default:
        throw new Error(`Unsupported email provider: ${EMAIL_PROVIDER}`);
    }
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}

// Export a convenient function to get the email provider
export const getEmailProvider = (): IEmailProvider => {
  return EmailProviderFactory.getProvider();
};
