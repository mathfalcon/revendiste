/**
 * Email Provider Interface
 *
 * Defines the contract for email notification providers.
 * This allows us to swap email providers (SendGrid, Resend, SMTP, etc.)
 * without changing the notification service code.
 */
export interface IEmailProvider {
  /**
   * Send an email notification
   * @param params - Email parameters
   * @returns Promise that resolves when email is sent
   * @throws Error if email sending fails
   */
  sendEmail(params: {
    to: string;
    subject: string;
    html: string; // HTML string (rendered from React Email templates in transactional package)
    text?: string; // Plain text version
    from?: string;
  }): Promise<void>;
}
