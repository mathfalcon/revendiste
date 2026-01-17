import z from 'zod';

// Clerk webhook event types we care about for sending emails
const ClerkWebhookEventTypeSchema = z.enum(['email.created']);

// Clerk email slug types we handle
export const ClerkEmailSlugSchema = z.enum([
  'verification_code',
  'invitation',
  'password_changed',
  'password_removed',
  'primary_email_address_changed',
  'reset_password_code',
  'new_device_sign_in',
]);

export type ClerkEmailSlug = z.infer<typeof ClerkEmailSlugSchema>;

// Clerk Email object schema (for email.created events)
// NOTE: Using .nullish() for all optional fields because external APIs (Clerk)
// may send null, undefined, or omit fields entirely. This prevents validation
// errors when the API behavior changes.
const ClerkEmailSchema = z.object({
  id: z.string(),
  object: z.literal('email'),
  to_email_address: z.string(),
  subject: z.string(),
  body: z.string(),
  body_plain: z.string(),
  slug: z.string(),
  status: z.string(),
  delivered_by_clerk: z.boolean(),
  email_address_id: z.string().nullish(),
  from_email_name: z.string(),
  reply_to_email_name: z.string().nullish(),
  user_id: z.string().nullish(),
  data: z.object({
    otp_code: z.string().nullish(),
    requested_at: z.string().nullish(),
    requested_from: z.string().nullish(),
    requested_by: z.string().nullish(),
    inviter_name: z.string().nullish(),
    action_url: z.string().nullish(),
    invitation: z
      .object({
        expires_in_days: z.number().nullish(),
        public_metadata: z.record(z.string(), z.unknown()).nullish(),
        public_metadata_fallback: z.string().nullish(),
      })
      .nullish(),
    greeting_name: z.string().nullish(),
    primary_email_address: z.string().nullish(),
    new_email_address: z.string().nullish(),
    sign_in_method: z.string().nullish(),
    device_type: z.string().nullish(),
    browser_name: z.string().nullish(),
    operating_system: z.string().nullish(),
    location: z.string().nullish(),
    ip_address: z.string().nullish(),
    session_created_at: z.string().nullish(),
    revoke_session_url: z.string().nullish(),
    support_email: z.string().nullish(),
    app: z
      .object({
        name: z.string().nullish(),
        domain_name: z.string().nullish(),
        logo_image_url: z.string().nullish(),
        logo_url: z.string().nullish(),
        url: z.string().nullish(),
      })
      .nullish(),
    theme: z
      .object({
        primary_color: z.string().nullish(),
        button_text_color: z.string().nullish(),
        show_clerk_branding: z.boolean().nullish(),
      })
      .nullish(),
    user: z
      .object({
        email_address: z.string().nullish(),
        public_metadata: z.record(z.string(), z.unknown()).nullish(),
        public_metadata_fallback: z.string().nullish(),
      })
      .nullish(),
  }),
});

// Clerk webhook payload schema
export const ClerkWebhookValidationSchema = z.object({
  body: z.object({
    object: z.literal('event'),
    type: ClerkWebhookEventTypeSchema,
    data: ClerkEmailSchema, // For email.created events
    instance_id: z.string(),
    timestamp: z.number(),
    event_attributes: z
      .object({
        http_request: z
          .object({
            client_ip: z.string().nullish(),
            user_agent: z.string().nullish(),
          })
          .nullish(),
      })
      .nullish(),
  }),
});

export type ClerkWebhookRouteBody = z.infer<
  typeof ClerkWebhookValidationSchema
>['body'];

// Re-export dLocal schema for backward compatibility
// NOTE: dLocal webhook payloads are minimal, but using nullish for safety
export const DLocalWebhookValidationSchema = z.object({
  body: z.object({
    payment_id: z.string(),
  }),
});

export type DLocalWebhookrRouteBody = z.infer<
  typeof DLocalWebhookValidationSchema
>['body'];
