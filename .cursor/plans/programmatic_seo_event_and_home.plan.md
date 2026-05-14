---
name: Programmatic SEO — event + home
overview: Intent-first event titles/meta, richer structured data (FAQ subset, honest offers, no fake performer), SERP hygiene (images), optional UX links; home JSON-LD verified; LLM headliner out of scope. Fix SearchAction/breadcrumb hub if /eventos is not a real route.
todos:
  - id: event-title-meta
    content: 'Event $slug head(): title `Entradas para ${event.name} | Revendiste`; keep/refine marketing description (voseo, date, venue)'
    status: completed
  - id: event-schema
    content: 'JSON-LD: AggregateOffer low/high when OutOfStock (face value); remove or omit performer until real data; keep startDate ISO'
    status: completed
  - id: event-faq-ld
    content: Extract FAQ items from preguntas-frecuentes to shared module; add getEventPageFaqItems + second FAQPage JSON-LD in $slug head()
    status: completed
  - id: event-images-serp
    content: Ensure event hero/og URLs absolute + 200 for bots; align schema image with og:image when poster exists; monitor events missing images
    status: completed
  - id: home-searchaction
    content: Verify/fix index.tsx WebSite SearchAction urlTemplate + breadcrumb Eventos URL — align with real listing/search URL (likely `/` not `/eventos?search=`)
    status: completed
  - id: optional-ui-hydration
    content: Optional FAQ link on event page; triage React hydration + SVG height on event path if still noisy in Rich Results/crawl
    status: completed
isProject: false
---

# Programmatic SEO — event pages + home (`/programmatic-seo`)

Aligns with [.agents/skills/programmatic-seo/SKILL.md](.agents/skills/programmatic-seo/SKILL.md): **unique value per page** (event-specific data), **genuine intent match**, **clean technical SEO** (titles, descriptions, schema, internal signals), **no thin doorway pages**.

## Out of scope (explicit)

- **LLM / scraped headliner** — deferred; not required for a sound first phase.
- Mass-generating new URL patterns beyond improving existing event and hub pages.

---

## 1. Event detail — [`apps/frontend/src/routes/eventos/$slug.tsx`](apps/frontend/src/routes/eventos/$slug.tsx)

### Title (intent-first template)

- **Target:** `Entradas para ${event.name} | Revendiste` (replace current `` `${event.name} | Revendiste` ``).
- **Rationale:** Front-loads Spanish transactional intent (“entradas para …”) while keeping **one strong variable** (`event.name`) so each URL stays distinct (not keyword-stuffed).
- **Length:** Accept truncation on very long names; optional later rule to shorten (not required for v1).

### Meta description

- Keep the **curated template** (avoids ALL CAPS / broken organizer copy in the blue link). Minor polish only if needed: consistent **voseo** (“Comprá y vendé” vs mixed “Compra y venta” — pick one style for brand consistency).

### Structured data (`Event`)

| Item                        | Action                                                                                                                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `offers` / `AggregateOffer` | When **OutOfStock**, still supply **`lowPrice` / `highPrice`** from **face value** of waves (or documented fallback) so Rich Results warnings match Google guidance.                                                                                              |
| `performer`                 | **Remove** or **omit** until you have a trustworthy field (do not mirror `event.name` as `PerformingGroup` — misleading for music SEO).                                                                                                                           |
| `startDate` / `endDate`     | Keep valid **ISO 8601** strings (timezone-aware if data supports it).                                                                                                                                                                                             |
| Second script               | **FAQPage** JSON-LD: small **event-relevant subset** of FAQs from a **shared module** extracted from [`apps/frontend/src/routes/preguntas-frecuentes.tsx`](apps/frontend/src/routes/preguntas-frecuentes.tsx) (single source of truth; route imports the module). |

### Open Graph / Twitter

- Already wired via [`apps/frontend/src/utils/seo.ts`](apps/frontend/src/utils/seo.ts) (`og:image`, `twitter:card: summary_large_image`, default CDN fallback).
- **SERP thumbnail:** Google may skip generic default images for specific queries. Prefer **event poster** in both **`og:image`** and **`schema.org/image`** when available; ensure URLs are **absolute**, **crawlable** (no auth), stable HTTP 200.

### “Dentro de X días” in SERPs

- **Not** a meta tag you add; Google may show it when it trusts the page as an **upcoming event**. Stronger, warning-free **Event** markup + real dates helps; **not guaranteed** and **not rank-position dependent**.

### Optional UX

- Compact link or accordion to [`/preguntas-frecuentes`](apps/frontend/src/routes/preguntas-frecuentes.tsx) for humans (JSON-LD alone is enough for bots).

---

## 2. Home — [`apps/frontend/src/routes/index.tsx`](apps/frontend/src/routes/index.tsx)

### What is already strong

- **Title + description:** Clear value prop and Uruguay focus; good hub intent.
- **`@graph`:** [`Organization`](https://schema.org/Organization) + [`WebSite`](https://schema.org/WebSite) with **`publisher`** `@id` linkage — aligned with Google site name guidance (see comments in file).
- **`logo`**, **`sameAs`**, **`contactPoint`**, **`hreflang`**, **`canonical`**, default **`seo()`** tags (OG/Twitter/keywords).
- **`potentialAction` / `SearchAction`:** Intention is correct (sitelinks search box pattern).

### Issue to verify and fix (`SearchAction` + breadcrumbs)

- **`urlTemplate`:** `${origin}/eventos?search={search_term_string}` ([`index.tsx` lines 89–96](apps/frontend/src/routes/index.tsx)).
- **Route inventory:** Under `apps/frontend/src/routes/eventos/`, generated routes include **`/eventos/$slug`**, **`/eventos/hoy`**, **`/eventos/este-fin-de-semana`**, **`/eventos/en/$location`** — there is **no** dedicated **`/eventos`** index route in that folder; the **main listing + filters** live on **`/`** with search params `ubicacion`, `desde`, `hasta`, `conEntradas` ([`index.tsx` loader](apps/frontend/src/routes/index.tsx), [`features/home`](apps/frontend/src/features/home/index.tsx)).
- **Risk:** `SearchAction` may point at a URL that **does not match** the app’s real search/filter UX (and may not resolve as intended). **BreadcrumbList** on event pages uses `` `${baseUrl}/eventos` `` as “Eventos” — same risk if `/eventos` is not a valid hub.
- **Plan:** Confirm behavior in dev/prod for `GET /eventos` and `GET /eventos?search=test`. Then either:
  - **A)** Introduce a real **`/eventos`** hub (or redirect) + query contract; **or**
  - **B)** Point `SearchAction` `urlTemplate` at the **actual** search entry point (e.g. `/` with documented Spanish query keys if/when text search exists); **or**
  - **C)** **Remove** `SearchAction` until a canonical search URL exists (prefer honest schema over broken templates).

### Minor consistency

- **`og:url`** uses `baseUrl`; **`canonical`** uses `baseUrl`; JSON-LD `WebSite.url` uses `` `${origin}/` ``. Ensure **`VITE_APP_BASE_URL`** never drifts (trailing slash) between these three.

---

## 3. Quality checklist (from skill)

- [ ] Unique title + description per event (template + `event.name` / date / venue).
- [ ] Valid Event + BreadcrumbList (+ FAQPage after extraction).
- [ ] Internal links: hub/spoke coherent after `/eventos` fix.
- [ ] Post-deploy: Search Console + Rich Results Test on sample events.

---

## 4. Implementation order (suggested)

1. **Home / SearchAction + breadcrumb hub** — avoid misleading structured data.
2. **Event title + schema** (offers + performer) — highest SEO/signal impact.
3. **FAQ module + event FAQ JSON-LD** — reuse content, second valid rich type.
4. **Image/SERP + optional FAQ UI + hydration** — as time allows.
