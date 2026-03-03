/**
 * Job payload schemas and discriminated union for type-safe job validation.
 * Used by the backend job queue to validate job_type + payload before processing.
 */

import { z } from 'zod';

const OrderConfirmedItemSchema = z.object({
  id: z.string().uuid(),
  ticketWaveName: z.string(),
  quantity: z.number().int().positive(),
  pricePerTicket: z.string(),
  subtotal: z.string(),
  currency: z.string().optional(),
});

/** Payload for notify-order-confirmed job (buyer email + invoice) */
export const NotifyOrderConfirmedPayloadSchema = z.object({
  orderId: z.string().uuid(),
  buyerUserId: z.string().uuid(),
  eventName: z.string(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  totalAmount: z.string(),
  subtotalAmount: z.string(),
  platformCommission: z.string(),
  vatOnCommission: z.string(),
  currency: z.string(),
  items: z.array(OrderConfirmedItemSchema),
});

/** Payload for notify-seller-ticket-sold job (seller email + invoice) */
export const NotifySellerTicketSoldPayloadSchema = z.object({
  orderId: z.string().uuid(),
  sellerUserId: z.string().uuid(),
  listingId: z.string().uuid(),
  eventName: z.string(),
  eventStartDate: z.string(),
  eventEndDate: z.string(),
  platform: z.string(),
  qrAvailabilityTiming: z
    .enum(['12h', '24h', '3h', '48h', '6h', '72h'])
    .nullable(),
  ticketCount: z.number().int().positive(),
});

/**
 * Attachment refs stored in notification metadata.
 * Generic: send-notification only "loads from storage and attaches". It does not know about invoices or other sources.
 * Callers (e.g. notify-order-confirmed) upload the file to storage and pass the path. New ref types (e.g. url) can be added later.
 */
const AttachmentRefStorageSchema = z.object({
  type: z.literal('storage'),
  storagePath: z.string(),
  filename: z.string().optional(),
});

export const SendNotificationAttachmentRefSchema = z.discriminatedUnion(
  'type',
  [AttachmentRefStorageSchema],
);

/**
 * Actions to run after the notification email is successfully sent (e.g. mark invoice email sent).
 * Stored in notification metadata; run by send-notification via a generic runner registry.
 */
export const PostSendActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('markInvoiceEmailSent'),
    invoiceId: z.string().uuid(),
  }),
]);

/** Payload for send-notification job: only notification id; attachmentRefs are read from notification.metadata */
export const SendNotificationPayloadSchema = z.object({
  notificationId: z.string().uuid(),
});

/** Single job shape: job_type discriminator + payload */
const NotifyOrderConfirmedJobSchema = z.object({
  job_type: z.literal('notify-order-confirmed'),
  payload: NotifyOrderConfirmedPayloadSchema,
});

const NotifySellerTicketSoldJobSchema = z.object({
  job_type: z.literal('notify-seller-ticket-sold'),
  payload: NotifySellerTicketSoldPayloadSchema,
});

const SendNotificationJobSchema = z.object({
  job_type: z.literal('send-notification'),
  payload: SendNotificationPayloadSchema,
});

/**
 * Discriminated union of all job types.
 * Use this to parse/validate { job_type, payload } before processing.
 * Reference: https://zod.dev/api?id=discriminated-unions
 */
export const JobPayloadSchema = z.discriminatedUnion('job_type', [
  NotifyOrderConfirmedJobSchema,
  NotifySellerTicketSoldJobSchema,
  SendNotificationJobSchema,
]);

export type JobPayload = z.infer<typeof JobPayloadSchema>;

export type NotifyOrderConfirmedPayload = z.infer<
  typeof NotifyOrderConfirmedPayloadSchema
>;
export type NotifySellerTicketSoldPayload = z.infer<
  typeof NotifySellerTicketSoldPayloadSchema
>;

export type SendNotificationPayload = z.infer<
  typeof SendNotificationPayloadSchema
>;
export type SendNotificationAttachmentRef = z.infer<
  typeof SendNotificationAttachmentRefSchema
>;
export type PostSendAction = z.infer<typeof PostSendActionSchema>;
