import type { InvoiceService } from '~/services/invoices';
import type { PostSendActionRunners } from './send-notification';

/**
 * Builds the default post-send action runners (e.g. mark invoice email sent).
 * Used by the send-notification job after the email is successfully sent.
 */
export function createPostSendActionRunners(options: {
  invoiceService?: InvoiceService;
}): PostSendActionRunners {
  const { invoiceService } = options;
  const runners: PostSendActionRunners = {};

  if (invoiceService) {
    runners.markInvoiceEmailSent = async (action) => {
      await invoiceService.markEmailSent(action.invoiceId);
    };
  }

  return runners;
}
