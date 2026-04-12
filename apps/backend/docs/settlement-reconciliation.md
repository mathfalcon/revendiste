# Processor settlement reconciliation

## Architecture

- **Settlement items link to `payments`** (`processor_settlement_items.payment_id`), not to seller payouts. Processors settle buyer charges; `payments.balance_amount` / `balance_fee` / `balance_currency` are the shared contract (filled by each provider’s webhook normalizer).
- **Multi-provider:** filter unreconciled rows with `payments.provider = settlement.payment_provider`. No provider-specific branches in settlement code.
- **Liquidity pool:** seller withdrawals use the internal pool; processor withdrawals arrive later. This module is **traceability and reconciliation**, not a gate on payouts.

## Create flow

1. Admin declares external settlement id, date, total amount, currency, and provider.
2. Backend loads **unreconciled** payments: `status = paid`, `balance_amount` set, `approved_at` ≤ end of settlement date, not already referenced by any `processor_settlement_items.payment_id`, matching currency (balance currency or fallback to charge currency).
3. **FIFO** by `approved_at`: accumulate `balance_amount` until sum ≥ declared total.
4. Validate **|sum − declared| / declared ≤ 10%** or reject. Between 1% and 10%: allowed with warning metadata; ≤1%: clean.

## APIs

- `POST /admin/settlements/preview` — same body as create; no writes; returns estimated payment count and totals.
- `GET /admin/settlements/{id}/breakdown` — settlement header + sums (customer charges, processor credits/fees, seller earnings by order, platform revenue, difference vs declared).

## Engram

If using Engram MCP in your environment, mirror this doc into memory after releases so assistants stay aligned.
