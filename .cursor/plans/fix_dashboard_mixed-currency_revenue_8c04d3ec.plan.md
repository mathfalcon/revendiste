---
name: Fix dashboard mixed-currency revenue
overview: Fix admin dashboard revenue by expressing GMV, commission, and VAT in the same currency as processor settlement (payments.balance_currency), using payments.exchange_rate when order currency differs. No schema change—balance_currency and exchange_rate already exist; no backfill needed.
todos:
  - id: fix-balance-fee-falsy
    content: Fix PaymentWebhookAdapter balanceFee falsy-zero bug (0 treated as undefined)
    status: pending
  - id: rewrite-revenue-queries
    content: Rewrite getRevenueByCurrency and getRevenueTimeSeries to convert order amounts to settlement currency using exchange_rate when present; group/label by balance_currency
    status: pending
  - id: update-service-currency
    content: Update dashboard service to use settlement currency (from balance_currency rows) for response currency and mixedCurrency
    status: pending
  - id: regenerate-types
    content: Run tsoa:both and generate:api if API docs/comments change
    status: pending
  - id: verify-dashboard
    content: Verify dashboard shows correct settlement-currency figures for USD + UYU test orders
    status: pending
---

# Fix Dashboard Mixed-Currency Revenue (revised)

## Problem

The dashboard sums `orders.platformCommission` + `orders.vatOnCommission` (in **order currency**) and subtracts `payments.balanceFee` (in **settlement currency**, e.g. UYU for dlocal). That mixes units and breaks metrics for USD orders.

## Schema (no migration)

- **`payments.balance_currency`** — already on the table; use it as the **settlement currency** for reporting.
- **`payments.exchange_rate`** — already populated when charge currency differs from balance currency (e.g. USD orders); **no backfill** is required: USD payments already have a rate, and same-currency (UYU) rows can use raw order amounts when `exchange_rate` is null.

## Solution

Express GMV, commission, VAT, and fees in **one currency per aggregate**: settlement / `balance_currency`.

**Conversion in SQL (per payment row joined to order):**

- If `payments.exchange_rate` is not null:  
  `orders.totalAmount * exchange_rate`, same for `platformCommission`, `vatOnCommission` (maps order-currency → settlement currency using the processor’s implied rate).
- Else (same currency as settlement, typically UYU): use order columns as-is.

**Processor fees:** keep `sum(coalesce(payments.balanceFee, 0))` — already in settlement currency.

**Grouping / display currency:** group by `payments.balanceCurrency` (not `orders.currency`). Response `currency` should reflect settlement currency; `mixedCurrency` is true only when multiple **settlement** currencies appear (future multi-processor), not when orders differ in charge currency.

## Files to change

1. **[apps/backend/src/repositories/admin-dashboard/index.ts](apps/backend/src/repositories/admin-dashboard/index.ts)** — `getRevenueByCurrency`, `getRevenueTimeSeries` (and any other revenue aggregates that join orders + paid payments).
2. **[apps/backend/src/services/admin/dashboard/index.ts](apps/backend/src/services/admin/dashboard/index.ts)** — currency / `mixedCurrency` from settlement-side grouping; document semantics in types.
3. **[apps/backend/src/services/admin/dashboard/types.ts](apps/backend/src/services/admin/dashboard/types.ts)** — comment that `currency` is settlement (`balance_currency`) for revenue responses.
4. **[apps/backend/src/services/payments/adapters/PaymentWebhookAdapter.ts](apps/backend/src/services/payments/adapters/PaymentWebhookAdapter.ts)** — fix `balanceFee` truthy check so `0` is persisted.

## Edge cases

- **Paid payment missing `balance_currency`:** exclude from aggregates or treat as data error; in practice dlocal webhooks populate it.
- **`exchange_rate` null but currencies differ:** should not happen for USD per current pipeline; if it does, service could skip row or log — optional hardening.

## Validation

Same two orders (UYU + USD): dashboard totals in UYU (or single settlement currency), fee ratio and net platform income coherent with converted commission + VAT minus `balanceFee`.
