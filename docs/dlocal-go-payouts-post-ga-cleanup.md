# dLocal Go payouts: post-GA cleanup checklist

Run this **only after** dLocal Go payouts are in production, the `dlocal_go_payouts_enabled` PostHog feature flag is at 100% for 30+ clean days, and no incidents require rollback to manual processing.

## Preconditions

- [ ] Flag `dlocal_go_payouts_enabled` is enabled for all target users; no more need for a manual UY path.
- [ ] Query the database: zero open `payouts` in `pending` with `payoutProvider = 'manual_bank'` (or a migration path exists for all).
- [ ] All historical rows that still use `payouts.metadata.rateLock` / `fxProcessing` are archived or migrated (see [Data](#data-migration-before-dropping-schemas) below).

## Data migration before dropping schemas

Before removing `rateLock` / `fxProcessing` from `PayoutMetadataSchema` (shared Zod) or the JSON column usage:

1. Find payouts with a rate lock (adjust table/column names to match your live DB):

```sql
-- Example: inspect count of payouts that still have rate_lock in JSON metadata
-- SELECT id, (metadata->'rateLock') IS NOT NULL AS has_rl
-- FROM payouts WHERE (metadata->'rateLock') IS NOT NULL;
```

2. If any rows need retention for accounting, export them or denormalize key fields to a dedicated `payout_fx_snapshots` table. Do **not** delete metadata keys until the export is complete.

3. Re-run the same check until **zero** rows need legacy metadata.

## Code to delete

### Provider layer

- [ ] [apps/backend/src/services/payouts/providers/ManualBankTransferProvider.ts](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/src/services/payouts/providers/ManualBankTransferProvider.ts) and its `PROVIDERS.manual_bank` entry in the registry.
- [ ] Simplify [apps/backend/src/services/payouts/providers/PayoutProviderRegistry.ts](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/src/services/payouts/providers/PayoutProviderRegistry.ts):
  - Remove the `dlocalGoEnabled` parameter; default is always `dlocal_go` for UY, or resolve without the flag.
  - Remove the `'manual_bank'` branch in `resolveProviderName`.

### BROU / manual FX (payouts-only)

- [ ] `fetchBrouEbrouVentaRate` in [apps/backend/src/services/exchange-rates/providers/UruguayBankProvider.ts](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/src/services/exchange-rates/providers/UruguayBankProvider.ts) — **only** if no other product path uses it.
- [ ] Grep: `rg 'fetchBrouEbrouVentaRate|UruguayBankProvider' apps/backend` before deleting; keep if used by `ExchangeRateProviderFactory` for non-payouts.

### Payouts service & routes

- [ ] [apps/backend/src/services/payouts/index.ts](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/src/services/payouts/index.ts): `refreshPayoutRateLock` and any BROU call paths only used for manual/legacy flows.
- [ ] Admin route `POST /admin/payouts/{payoutId}/refresh-rate-lock` in [apps/backend/src/controllers/admin/payouts/index.ts](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/src/controllers/admin/payouts/index.ts).
- [ ] [apps/backend/src/lib/feature-flags.ts](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/src/lib/feature-flags.ts): remove `DLOCAL_GO_PAYOUTS_ENABLED` and `isFeatureEnabled` usages in `PayoutsService` / add-payout controller — **or** keep the file for future flags.

### Env vars (double-check other usages first)

- [ ] `PAYOUT_FX_SPREAD_PERCENT`
- [ ] `PAYOUT_FX_RATE_LOCK_HOURS`
- Grep: `PAYOUT_FX_` in `apps/backend` and `infrastructure/`.

### Frontend: admin

- [ ] [apps/frontend/src/features/admin/payouts/StepFxReview.tsx](file:///Users/mathfalcon/Desktop/revendiste-1/apps/frontend/src/features/admin/payouts/StepFxReview.tsx)
- [ ] [apps/frontend/src/features/admin/payouts/FxDecisionPanel.tsx](file:///Users/mathfalcon/Desktop/revendiste-1/apps/frontend/src/features/admin/payouts/FxDecisionPanel.tsx)
- [ ] "Refresh rate lock" button and any route calling `refresh-rate-lock` from admin payout feature.

### Schemas (after data migration)

- [ ] [packages/shared/src/schemas/payouts.ts](file:///Users/mathfalcon/Desktop/revendiste-1/packages/shared/src/schemas/payouts.ts): `rateLock`, `fxProcessing` from `PayoutMetadataSchema` if nothing references them in DB.
- [ ] `pnpm tsoa:both` (backend) and `pnpm generate:api` (frontend) after.

### Tests

- [ ] [apps/backend/src/**tests**/services/payouts.test.ts](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/src/__tests__/services/payouts.test.ts): remove or rewrite tests for `refreshPayoutRateLock`, `manual_bank`-only `processPayout`, and flag-gating if the API no longer takes a flag.
- [ ] Mocks of `fetchBrouEbrouVentaRate` in payout tests if the service no longer imports it.

## PostHog

- [ ] In PostHog, delete the `dlocal_go_payouts_enabled` feature flag only after all code and env references to it are removed, so old clients cannot rely on a missing flag.

## Docs to update

- [ ] [docs/payout-system.md](file:///Users/mathfalcon/Desktop/revendiste-1/docs/payout-system.md) — remove manual/eBROU as the current path; describe dLocal Go as primary.
- [ ] [apps/backend/docs/payment-system-overview.md](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/docs/payment-system-overview.md)
- [ ] [apps/backend/docs/dlocal-go-payouts.md](file:///Users/mathfalcon/Desktop/revendiste-1/apps/backend/docs/dlocal-go-payouts.md) (created during implementation) — remove "feature flag" / "dual path" wording.

## What to keep

- Audit / event logging on payouts (`payout_events` table, notification helpers).
- `metadata.externalPayoutId` (or equivalent) and `DLocalGoProvider` + dLocal Go HTTP client.
- `PayoutsService` orchestration (DB transaction boundaries, idempotent admin approval, notifications).

## DB enums

- Dropping `manual_bank` from `payout_provider` in PostgreSQL is **optional and risky** if any historical `payouts` rows still reference it. It is often safer to leave the enum value forever and never insert new `manual_bank` rows.

## Verification (copy-paste)

```bash
rg "manual_bank|refreshPayoutRateLock|dlocal_go_payouts_enabled|PAYOUT_FX_SPREAD" apps/backend apps/frontend packages/shared --glob '!**/*.d.ts' --glob '!**/generated*'
```

Expect no hits in application code (except allowed historical migrations / comments you intentionally keep).

---

_Last updated: created as part of the dLocal Go payouts + Argentina implementation plan. Revise as the codebase evolves before GA._
