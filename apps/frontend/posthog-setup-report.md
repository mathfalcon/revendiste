# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Revendiste frontend. The integration covers the full buyer and seller lifecycle: from browsing events to completed purchases, seller onboarding, ticket document uploads, payouts, and support case creation.

**Changes made:**

- **`src/routes/__root.tsx`** — Added `PostHogProvider` wrapping the app with the project token and ingest host. Added a `PostHogIdentify` component that calls `posthog.identify()` on sign-in (with `email`, `first_name`, `last_name`) and `posthog.reset()` on sign-out, keeping person profiles linked to Clerk user identities.
- **`src/utils/posthog-server.ts`** _(new file)_ — Server-side PostHog client singleton (`posthog-node`) for SSR event capture.
- **`vite.config.ts`** — Added `/ingest` proxy route to `https://us.i.posthog.com` so events bypass ad blockers.
- **8 event capture calls** added across 8 files (see table below).
- **`package.json`** — Added `posthog-js` and `posthog-node` dependencies.

> **Note:** Run `pnpm install` from the monorepo root to install the PostHog packages before building or running the app.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `checkout_completed` | User successfully completed a ticket purchase and lands on the checkout success page | `src/features/checkout/CheckoutSuccess.tsx` |
| `ticket_listing_created` | Seller successfully created a new ticket listing | `src/features/ticket-listing/TicketListingFormRight.tsx` |
| `order_started` | User initiated a ticket purchase by submitting the ticket selection form | `src/features/event/tickets/useTicketSelection.ts` |
| `payout_requested` | Seller requested a payout of their available balance | `src/features/user-account/payouts/RequestPayoutForm.tsx` |
| `identity_verification_started` | User initiated the identity verification process | `src/features/identity-verification/VerificationPage.tsx` |
| `support_case_created` | User submitted a support case/dispute | `src/components/CreateCaseDialog.tsx` |
| `ticket_document_uploaded` | Seller uploaded a ticket document (QR code or PDF) for a sold ticket | `src/components/TicketUploadModal/index.tsx` |
| `payout_method_added` | Seller added or updated their payout method | `src/features/user-account/payouts/PayoutMethodForm.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/361733/dashboard/1410836
  - **Embudo de compra** (Purchase conversion funnel — `order_started` → `checkout_completed`): https://us.posthog.com/project/361733/insights/DoXzvdiM
  - **Embudo de activación de vendedores** (Seller onboarding funnel — verification → payout method → first listing): https://us.posthog.com/project/361733/insights/4g5xXpg5
  - **Volumen de transacciones** (Daily transaction volume — orders started vs completed): https://us.posthog.com/project/361733/insights/HIxIutDH
  - **Actividad de vendedores** (Seller activity — listings created and documents uploaded per day): https://us.posthog.com/project/361733/insights/sX5wBjmJ
  - **Tasa de disputas** (Dispute rate — support cases vs completed purchases): https://us.posthog.com/project/361733/insights/pLsTBFkJ

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-tanstack-start/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
