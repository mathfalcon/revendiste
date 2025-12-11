/**
 * Backend-specific notification types and utilities
 *
 * This file contains types and helper functions specific to the backend,
 * such as database parsing and validation utilities.
 * All schemas are imported from the shared package.
 */

import type {NotificationType} from '~/shared';
import {
  NotificationMetadataSchema,
  NotificationSchema,
  NotificationActionsSchema,
  type NotificationMetadata,
  type TypedNotificationMetadata,
  type Notification as NotificationSchemaType,
  type NotificationAction,
  generateNotificationText,
} from '~/shared';
import type {Notification} from '~/types/models';

/**
 * Typed notification response with parsed metadata and actions
 * This ensures type safety when reading notifications from the database
 * Title and description are generated from type + metadata, not stored in DB
 * For backwards compatibility, uses the generic type
 */
export type TypedNotification<
  T extends Notification['type'] = Notification['type'],
> = Omit<Notification, 'metadata' | 'actions' | 'type' | 'title' | 'description'> & {
  type: T;
  title: string; // Generated from type + metadata
  description: string; // Generated from type + metadata
  metadata: TypedNotificationMetadata<T> | null;
  actions: NotificationAction[] | null;
};

/**
 * Validate metadata against the discriminated union schema
 * Metadata should already include the 'type' field
 */
export function validateNotificationMetadata(
  metadata: unknown,
): NotificationMetadata {
  return NotificationMetadataSchema.parse(metadata);
}

/**
 * Validate actions array (generic, for backwards compatibility)
 */
export function validateNotificationActions(
  actions: unknown,
): NotificationAction[] | null {
  if (!actions) {
    return null;
  }
  return NotificationActionsSchema.parse(actions);
}

/**
 * Validate a full notification against its type-specific schema
 */
export function validateNotification(
  notification: unknown,
): NotificationSchemaType {
  return NotificationSchema.parse(notification);
}

/**
 * Helper function to parse and type a notification from the database
 * Accepts the actual return type from Kysely (with Date objects, not ColumnType)
 * Uses the discriminated union to validate and type the notification
 */
export function parseNotification(
  notification: Notification,
): TypedNotification {
  // Parse metadata and actions
  let parsedMetadata: NotificationMetadata | null = null;
  if (notification.metadata) {
    try {
      const metadataObj =
        typeof notification.metadata === 'string'
          ? JSON.parse(notification.metadata)
          : notification.metadata;
      parsedMetadata = NotificationMetadataSchema.parse(metadataObj);
    } catch (error) {
      console.error('Failed to parse notification metadata', error);
    }
  }

  let parsedActions: NotificationAction[] | null = null;
  if (notification.actions) {
    try {
      const actionsObj =
        typeof notification.actions === 'string'
          ? JSON.parse(notification.actions)
          : notification.actions;
      parsedActions = validateNotificationActions(actionsObj);
    } catch (error) {
      console.error('Failed to parse notification actions', error);
    }
  }

  // Generate title and description from metadata
  let title = '';
  let description = '';
  if (parsedMetadata) {
    try {
      const text = generateNotificationText(
        notification.type,
        parsedMetadata as TypedNotificationMetadata<NotificationType>,
      );
      title = text.title;
      description = text.description;
    } catch (error) {
      console.error('Failed to generate notification text', error);
    }
  }

  // Try to validate the full notification against its type-specific schema
  try {
    const fullNotification = {
      ...notification,
      title,
      description,
      metadata: parsedMetadata,
      actions: parsedActions,
    };
    // Validate against the discriminated union
    const validated = NotificationSchema.parse(fullNotification);
    return validated as TypedNotification;
  } catch (error) {
    // If validation fails, return with parsed metadata/actions but without full validation
    console.error('Failed to validate full notification', error);
    return {
      ...notification,
      title,
      description,
      metadata: parsedMetadata,
      actions: parsedActions,
    } as TypedNotification;
  }
}
