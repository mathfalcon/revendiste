/**
 * Email Template Builder
 *
 * Builds email templates from typed notification metadata.
 * This module handles the mapping from notification types to email templates,
 * keeping the NotificationService clean and scalable.
 */

import {
  type NotificationMetadata,
  type TypedNotificationMetadata,
  NotificationMetadataSchema,
  type NotificationAction,
} from '~/shared';
import {
  getEmailTemplate,
  renderEmail,
  renderEmailToText,
} from '@revendiste/transactional';
import type {NotificationType} from '~/shared';
import {APP_BASE_URL} from '~/config/env';

/**
 * Parse notification metadata using the correct schema based on notification type
 * Returns typed metadata that matches the notification type
 */
export function parseNotificationMetadata<T extends NotificationType>(
  type: T,
  metadata: unknown,
): TypedNotificationMetadata<T> | null {
  if (!metadata) {
    return null;
  }

  try {
    const parsed = NotificationMetadataSchema.parse(metadata);
    // Ensure metadata type matches notification type
    if (parsed.type !== type) {
      throw new Error(
        `Metadata type ${parsed.type} does not match notification type ${type}`,
      );
    }
    return parsed as TypedNotificationMetadata<T>;
  } catch (error) {
    throw new Error(
      `Failed to parse notification metadata: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Build email template from typed notification metadata
 * Returns HTML and plain text ready to send
 */
export async function buildEmailTemplate<T extends NotificationType>(
  type: T,
  metadata: TypedNotificationMetadata<T>,
  actions: NotificationAction[] | null | undefined,
): Promise<{html: string; text: string}> {
  const actionsForTemplate = actions ?? undefined;

  const result = getEmailTemplate({
    notificationType: type,
    actions: actionsForTemplate,
    metadata: metadata,
    appBaseUrl: APP_BASE_URL,
  });

  // renderEmail and renderEmailToText accept ComponentType<any> which includes both
  // function and class components, so we can pass result.Component directly
  const [html, text] = await Promise.all([
    renderEmail(result.Component, result.props),
    renderEmailToText(result.Component, result.props),
  ]);

  return {html, text};
}
