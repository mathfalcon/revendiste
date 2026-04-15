# USD / UYU exchange for payouts

Brief reference for how the backend obtains **USD electronic-dollar venta** (UYU per 1 USD) and how that ties into seller withdrawals.

## What “venta” means here

We use the bank’s **venta** rate: how many UYU the bank charges for **1 USD** when selling USD (same idea as BROU “Dólar eBROU” venta). That value is stored in payout metadata as `rateLock.brouVentaRate` even when the live quote came from Itaú (see below).

## Primary and fallback sources

Resolution order is implemented in `fetchBrouEbrouVentaRate()` (`services/exchange-rates/providers/UruguayBankProvider.ts`):

1. **BROU** — public cotizaciones HTML portlet; locate the **Dólar eBROU** row and read the second `<p class="valor">` in that block (compra, **venta**, …).
2. **Itaú** — if BROU fails (HTTP, HTML change, parse error), fetch `https://www.itau.com.uy/inst/aci/cotiz.xml`, find a `<cotizacion>` whose `<moneda>` matches USD codes (try in order: `LINK`, `DOL`, `USD`, `DLS`), read `<venta>`.

Number parsing for both feeds uses Uruguayan conventions (thousands `.`, decimal `,`) via `parseUyRateNumber` (`uyRateNumberParse.ts`).

## When both sources fail

The caller receives **`ServiceUnavailableError` (503)** with `PAYOUT_ERROR_MESSAGES.USD_UYU_EXCHANGE_RATE_UNAVAILABLE` (Spanish message in `constants/error-messages.ts`). There is no static or third-party API fallback.

## Where the rate is used

- **`PayoutsService.requestPayout`** — PayPal path with earnings in UYU: fetches venta, applies configured **spread** (`PAYOUT_FX_SPREAD_PERCENT`), computes USD amount, and writes **`rateLock`** into payout `metadata` (schema: `packages/shared/src/schemas/payouts.ts`).
- **`PayoutsService.refreshPayoutRateLock`** — Pending payouts: recomputes USD from locked UYU principal using a fresh venta + spread.
- **`PayoutsService.getPayoutDetailsForAdmin`** — Loads **current** venta for the FX decision panel (if BROU+Itaú both fail, the whole admin detail request errors with 503).

## ExchangeRateService (optional path)

`ExchangeRateService` (`services/exchange-rates/index.ts`) converts UYU↔USD through **`UruguayBankProvider`**, which internally calls the same `fetchBrouEbrouVentaRate()` chain. It keeps an **in-memory cache** per pair for `EXCHANGE_RATE_CACHE_TTL_HOURS`; **failed fetches are not masked with expired cache** — the error propagates.

The factory (`ExchangeRateProviderFactory.ts`) only instantiates `UruguayBankProvider` (no alternate commercial FX API).

## Operations notes

- **Logs**: WARN when falling back to Itaú; ERROR when both BROU and Itaú fail.
- **Metadata**: `brouVentaRate` may reflect Itaú if BROU was down at lock time; the field name is historical.

## Related docs

- [Payout system](./payout-system.md) — earnings, holds, request flow, admin processing.
