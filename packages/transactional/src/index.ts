/**
 * Transactional Email Package
 *
 * This package exports React Email templates that can be rendered to HTML
 * for use in the backend email service.
 *
 * Usage in backend:
 * ```typescript
 * import { renderEmail, getEmailTemplate } from '@revendiste/transactional';
 *
 * const { Component, templateProps } = getEmailTemplate({
 *   notificationType: 'ticket_sold',
 *   title: 'Ticket Sold',
 *   description: 'Your ticket was sold',
 *   metadata: { eventName: 'Event', ticketCount: 1 },
 * });
 * const html = await renderEmail(Component, templateProps);
 * await emailProvider.sendEmail({ to, subject, html });
 * ```
 */

// Base template
export * from '../emails/base-template';

// Notification email templates
export * from '../emails/document-reminder-email';
export * from '../emails/order-confirmed-email';
export * from '../emails/order-expired-email';
export * from '../emails/payment-failed-email';
export * from '../emails/seller-ticket-sold-email';
export * from '../emails/payout-completed-email';
export * from '../emails/payout-failed-email';
export * from '../emails/payout-cancelled-email';

// Auth email templates (Clerk webhooks)
export * from '../emails/verification-code-email';
export * from '../emails/reset-password-code-email';
export * from '../emails/invitation-email';
export * from '../emails/password-changed-email';
export * from '../emails/password-removed-email';
export * from '../emails/primary-email-changed-email';
export * from '../emails/new-device-sign-in-email';

export {render, pretty, toPlainText} from '@react-email/render';

// Email template mapping utilities
export {getEmailTemplate} from './email-templates';
export type {NotificationType, EmailTemplateProps} from './email-templates';

// Export prop types for type safety (so backend knows what props each template needs)
export type {DocumentReminderEmailProps} from '../emails/document-reminder-email';
export type {OrderConfirmedEmailProps} from '../emails/order-confirmed-email';
export type {OrderExpiredEmailProps} from '../emails/order-expired-email';
export type {PaymentFailedEmailProps} from '../emails/payment-failed-email';
export type {SellerTicketSoldEmailProps} from '../emails/seller-ticket-sold-email';
export type {PayoutCompletedEmailProps} from '../emails/payout-completed-email';
export type {PayoutFailedEmailProps} from '../emails/payout-failed-email';
export type {PayoutCancelledEmailProps} from '../emails/payout-cancelled-email';

// Auth email prop types (Clerk webhooks)
export type {VerificationCodeEmailProps} from '../emails/verification-code-email';
export type {ResetPasswordCodeEmailProps} from '../emails/reset-password-code-email';
export type {InvitationEmailProps} from '../emails/invitation-email';
export type {PasswordChangedEmailProps} from '../emails/password-changed-email';
export type {PasswordRemovedEmailProps} from '../emails/password-removed-email';
export type {PrimaryEmailChangedEmailProps} from '../emails/primary-email-changed-email';
export type {NewDeviceSignInEmailProps} from '../emails/new-device-sign-in-email';

/**
 * Render a React Email component to HTML string
 *
 * @param Component - The React Email component
 * @param props - Props to pass to the component
 * @param options - Render options (pretty, etc.)
 * @returns HTML string ready to send via email
 */
export async function renderEmail<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  props: P,
  options?: {pretty?: boolean},
): Promise<string> {
  const React = await import('react');
  const {render, pretty: prettyRender} = await import('@react-email/render');

  const element = React.createElement(Component, props);
  const html = await render(element);

  return options?.pretty ? await prettyRender(html) : html;
}

/**
 * Render a React Email component to plain text
 *
 * @param Component - The React Email component
 * @param props - Props to pass to the component
 * @returns Plain text string
 */
export async function renderEmailToText<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  props: P,
): Promise<string> {
  const React = await import('react');
  const {render, toPlainText} = await import('@react-email/render');

  const element = React.createElement(Component, props);
  const html = await render(element);

  return toPlainText(html);
}
