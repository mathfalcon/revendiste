# Uruguayan bank account validation (dLocal Go alignment)

Seller payout methods for Uruguay use `packages/shared/src/schemas/payout-methods.ts`. Account number rules match **dLocal Go** Uruguay payout documentation (lengths, prefixes, no leading zeros where specified).

## Bank codes (`bank_code`)

Typed mapping for UI and future API integration: `packages/shared/src/utils/uruguayan-banks.ts` — `URUGUAYAN_BANK_INFO` maps each internal `UruguayanBankName` to dLocal’s numeric `bankCode`, `supportsUyu` / `supportsUsd`, and a `displayName` for the frontend.

## Payout provider strategy

Backend payout execution uses the **Strategy** pattern under `apps/backend/src/services/payouts/providers/`:

- `PayoutProvider` — `initiatePayout` (after DB create, outside transaction), `processPayout` (before admin marks completed, outside transaction), status helpers.
- `PayoutProviderRegistry` — selects provider by `payoutType` (and later by feature flag for `dlocal_automated`).
- `ManualBankTransferProvider` — current production behaviour.

Adding dLocal automated payouts: register `DLocalAutomatedProvider` in the registry, extend the DB `payout_provider` enum via migration, and implement `processPayout` with the dLocal API (still **outside** DB transactions).

## Beneficiary document

dLocal requires beneficiary document type/format (CI, RUT, etc.). Revendiste does not store this on `payout_methods` today; decide at integration time whether to reuse KYC / identity data or add explicit fields.

## Historical note

Banks removed from the enum (not supported by dLocal automated payouts) are no longer selectable in the app. Manual-only institutions can be reintroduced only if product requires them and reconciliation stays manual.
