# Dashboard revenue accounting — future evolution (theoretical)

This note is **not a specification**. It captures how admin dashboard revenue metrics might evolve when Revendiste expands beyond peer‑to‑peer resale (e.g. official primary sales, official resale, producer settlements). It exists so future work has a shared vocabulary.

## Current model (reference)

- **GMV**: sum of `orders.totalAmount` for confirmed orders with a qualifying paid payment; converted with `payments.exchangeRate` when present so totals align with processor settlement currency.
- **Platform commission + VAT (`platformRevenue`, `vatOnRevenue`)**: sums over **`issued`** rows in `invoices` (`base_amount`, `vat_amount`), not `orders.platformCommission` alone (that column is buyer‑side only).
- **Processor fees**: sum of `payments.balanceFee` (settlement currency).
- **`revenueByParty`**: aggregates issued invoices grouped by `invoice_party` (`buyer`, `seller`, …), FX‑converted like GMV; frontend maps known parties to Spanish labels.
- **`ordersMissingInvoices`**: heuristic count of confirmed orders with buyer commission on the order row but **no** issued invoices yet (FEU backlog / failures).

## Order taxonomy we might add later

- **Resale (today)** — buyer fee + seller fee, both invoiced.
- **Official primary sale** — direct sale from producer inventory; possible producer fee per ticket + buyer % fee.
- **Official resale** — secondary on tickets originally sold via Revendiste; fee caps / producer revenue share are plausible product constraints.

## Likely data‑model directions

- **`orders.order_type` / `monetization_model`** — dispatch fee strategies and feed dashboard segmentation (“revenue by order type”).
- **`invoice_party` enum extensions** — e.g. `producer` when we invoice rights‑holders separately.
- **Payout / obligation modeling** — today `seller_earnings` targets peer sellers; primary markets may need obligations to producers or split payouts; **net platform income** might need to subtract non‑processor liabilities once those exist.

## Dashboard‑specific ideas

- Charts: revenue by order type, take rate (commission ÷ GMV) by type, producer settlements vs platform retention.
- **`revenueByParty`**: new enum values should surface without backend shape changes; extend only the frontend label map (`producer` → “Productor”).
- **GMV refinements**: net GMV excluding refunds; GMV by order type once typed orders exist.

## Open questions

- Processor‑fee attribution when money flows buyer → platform → producer with multiple legs.
- Tax treatment differences between resale and primary sales — align with FEU/legal before changing invoicing.
- Refunds / credit notes — until modeled, issued‑invoice sums remain “best effort” for realized revenue.

When implementation starts for official events, replace this document with a dated tech design linked from the change proposal.
