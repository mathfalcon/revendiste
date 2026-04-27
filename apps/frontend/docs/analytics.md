# Analytics: PostHog, Google Tag Manager & Meta Pixel

## How it works

1. **App code** calls `trackEvent()` / `trackPageView()` / `setAnalyticsUser()` from [`src/lib/analytics/track.ts`](../src/lib/analytics/track.ts).
2. Each call:
   - Pushes a structured object to `window.dataLayer` (for **Google Tag Manager**).
   - Sends the same logical event to **PostHog** via `posthog.capture` (with `$insert_id` for deduplication).
3. **GTM** loads a single `gtm.js` snippet (injected in [`src/utils/root-head.ts`](../src/utils/root-head.ts) + noscript in [`src/routes/__root.tsx`](../src/routes/__root.tsx)). Tags inside GTM (Meta Pixel template, GA4, etc.) react to `dataLayer` pushes.
4. **Meta Pixel** is **not** embedded in application code. It is added as a tag inside the GTM container. The app only pushes events; GTM maps them to Meta standard events (e.g. `Purchase`, `ViewContent`).

```text
UI → trackEvent / trackPageView / setAnalyticsUser
         ├→ dataLayer → GTM → Meta Pixel (and other tags)
         └→ PostHog (posthog-js)
```

### SPA page views

TanStack Router fires `router.subscribe('onResolved', …)` in [`src/router.tsx`](../src/router.tsx). Each navigation pushes `{ event: 'page_view', page_path, page_title, … }` to the dataLayer. PostHog pageviews are handled separately by PostHog’s built-in capture (`defaults: '2026-01-30'` in `PostHogProvider`).

### Identity

[`PostHogIdentify`](../src/routes/__root.tsx) calls `posthog.identify` / `reset` and `setAnalyticsUser(userId)` so GTM can use `user_id` on subsequent dataLayer events.

### DataLayer schema

See `DataLayerEvent` in [`src/lib/analytics/types.ts`](../src/lib/analytics/types.ts).

- **`event`**: Event name (`page_view`, `set_user`, or a value from `ANALYTICS_EVENTS`).
- **`event_id`**: Random UUID per push — use for **Meta deduplication** and future **CAPI** (`$insert_id` is the PostHog equivalent).
- **`content_event_id`**: When the app sends a domain `event_id` (e.g. concert id), it is renamed for the dataLayer so `event_id` stays the dedupe UUID.
- **`user_id`**: Clerk user id when signed in (from `setAnalyticsUser`).
- **`value` / `currency`**: Set on purchase/checkout flows where relevant for ads.
- **`timestamp`**: ISO string.

---

## Environment variables

| Variable                            | Purpose                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `VITE_GTM_ID`                       | GTM web container ID (e.g. `GTM-XXXXXX`). Injected in `<head>` and noscript iframe.                                       |
| `VITE_META_PIXEL_ID`                | Pixel ID for **reference** and parity per environment. The live Pixel is still configured inside GTM (constant variable). |
| `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog project key.                                                                                                      |
| `VITE_PUBLIC_POSTHOG_HOST`          | PostHog API host (e.g. reverse proxy).                                                                                    |

### Where to get `VITE_GTM_ID`

1. Open [Google Tag Manager](https://tagmanager.google.com/).
2. Select the container for the site.
3. The container ID appears in the top bar (format **`GTM-XXXXXX`**).

Official help: [Install Google Tag Manager](https://support.google.com/tagmanager/answer/6103696).

### Where to get `VITE_META_PIXEL_ID`

1. Open [Meta Events Manager](https://business.facebook.com/events_manager2).
2. **Data sources** → choose your Pixel (or create one).
3. The **Pixel ID** is the numeric id shown for that data source (often 15–16 digits).

Configure the same value in GTM as a **Constant** (or similar) variable used by the Meta Pixel tag.

---

## Event catalog

All names are defined in [`src/lib/analytics/events.ts`](../src/lib/analytics/events.ts) as `ANALYTICS_EVENTS`. Optional Meta mapping is documented in `META_EVENT_MAP` (triggers must still be created in GTM).

| PostHog / `dataLayer.event`     | Typical trigger location    | Meta mapping (GTM)   | Notes                                   |
| ------------------------------- | --------------------------- | -------------------- | --------------------------------------- |
| `page_view`                     | Router `onResolved`         | PageView             | dataLayer only                          |
| `set_user`                      | Clerk identify / sign-out   | (optional)           | `user_id` sync                          |
| `event_page_viewed`             | Event detail page           | ViewContent          | Includes `content_event_id`, name, slug |
| `search_performed`              | Event search modal          | Search               | `query`                                 |
| `search_result_clicked`         | Search result click         | —                    |                                         |
| `order_started`                 | Ticket selection submit     | AddToCart            | `value` = subtotal                      |
| `checkout_payment_initiated`    | Pay button                  | InitiateCheckout     | `value`, `currency`                     |
| `checkout_country_selected`     | Country picker              | —                    |                                         |
| `checkout_completed`            | Success page                | Purchase             | `value`, `currency`                     |
| `checkout_abandoned`            | Cancel order                | —                    |                                         |
| `payment_link_error`            | Payment link mutation error | —                    |                                         |
| `listing_form_started`          | Publish listing form mount  | Lead                 |                                         |
| `ticket_listing_created`        | Listing created             | CompleteRegistration | `value` = price                         |
| `ticket_document_uploaded`      | Seller upload               | —                    |                                         |
| `ticket_document_downloaded`    | Buyer download              | —                    |                                         |
| `payout_requested`              | Withdrawal submit           | —                    | `value`, `currency`                     |
| `payout_method_added`           | Add/update payout method    | —                    |                                         |
| `payout_method_deleted`         | Delete payout method        | —                    |                                         |
| `identity_verification_started` | Verification page           | —                    |                                         |
| `support_case_created`          | Support case submit         | —                    |                                         |
| `filter_applied`                | Home filters                | —                    |                                         |
| `contact_*_clicked`             | Contact page links          | —                    |                                         |

---

## Where to view metrics

| Tool        | URL / path                                                                              |
| ----------- | --------------------------------------------------------------------------------------- |
| **PostHog** | Project dashboard, Live events (see also `posthog-setup-report.md` in app root).        |
| **GTM**     | [Tag Assistant / Preview](https://tagassistant.google.com) connected to your workspace. |
| **Meta**    | Events Manager → **Test events** for real-time Pixel hits.                              |

---

## GTM checklist (ops)

1. Create **Constant** variable: Meta Pixel ID (= `VITE_META_PIXEL_ID` / production id).
2. Add **Meta Pixel** tag (official/community template) → trigger **All Pages** (initialization).
3. For each mapped event, add a **Custom Event** trigger on `event` equals `event_page_viewed`, `search_performed`, etc.
4. Map **Meta** tag parameters: `event_id` from dataLayer, `value` / `currency` where applicable, `content_ids` from `content_event_id` if needed.
5. For SPA **PageView** in Meta, duplicate or use a tag on `event` equals `page_view` reading `page_path` / `page_title`.
6. Optional: **Conversions API** later — server receives `event_id` to dedupe with browser (`TODO(capi)` in `track.ts`).

---

## Adding a new event

1. Add a key to `ANALYTICS_EVENTS` in [`events.ts`](../src/lib/analytics/events.ts).
2. Call `trackEvent(ANALYTICS_EVENTS.YOUR_KEY, { …props })` from the UI (handlers preferred over `useEffect` for user actions).
3. If ads need it, add to `META_EVENT_MAP` and create matching GTM trigger + Meta tag.
4. Update this document’s table.

---

## Uruguay & consent

Uruguay does not require the same cookie-banner regime as the EU for this product’s current scope. Consent mode can still be added later in GTM if you expand to stricter jurisdictions.
