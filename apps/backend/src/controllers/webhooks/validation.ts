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
  email_address_id: z.string().nullable(),
  from_email_name: z.string(),
  reply_to_email_name: z.string().nullable().optional(),
  user_id: z.string().nullable(),
  data: z.object({
    otp_code: z.string().optional(),
    requested_at: z.string().optional(),
    requested_from: z.string().optional(),
    requested_by: z.string().optional(),
    inviter_name: z.string().optional(),
    action_url: z.string().optional(),
    invitation: z
      .object({
        expires_in_days: z.number().optional(),
        public_metadata: z.record(z.string(), z.unknown()).optional(),
        public_metadata_fallback: z.string().optional(),
      })
      .optional(),
    greeting_name: z.string().optional(),
    primary_email_address: z.string().optional(),
    new_email_address: z.string().optional(),
    sign_in_method: z.string().optional(),
    device_type: z.string().optional(),
    browser_name: z.string().optional(),
    operating_system: z.string().optional(),
    location: z.string().optional(),
    ip_address: z.string().optional(),
    session_created_at: z.string().optional(),
    revoke_session_url: z.string().optional(),
    support_email: z.string().optional(),
    app: z
      .object({
        name: z.string().optional(),
        domain_name: z.string().optional(),
        logo_image_url: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    theme: z
      .object({
        primary_color: z.string().optional(),
        button_text_color: z.string().optional(),
        show_clerk_branding: z.boolean().optional(),
      })
      .optional(),
    user: z
      .object({
        public_metadata: z.record(z.string(), z.unknown()).optional(),
        public_metadata_fallback: z.string().optional(),
      })
      .optional(),
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
            client_ip: z.string().optional(),
            user_agent: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

export type ClerkWebhookRouteBody = z.infer<
  typeof ClerkWebhookValidationSchema
>['body'];

// Re-export dLocal schema for backward compatibility
export const DLocalWebhookValidationSchema = z.object({
  body: z.object({
    payment_id: z.string(),
  }),
});

export type DLocalWebhookrRouteBody = z.infer<
  typeof DLocalWebhookValidationSchema
>['body'];
