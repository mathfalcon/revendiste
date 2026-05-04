# Revendiste Fee Strategy Analysis

## Purpose

This document consolidates the current commercial thinking for Revendiste across three future revenue lines:

1. Ticket resale
2. Official ticket sales
3. In-party products sold through the web, such as drinks or cigarettes

The goal is to answer four questions:

1. Is the current resale fee of `6% + VAT` on each side economically defensible?
2. Should payout minimums exist, and if so, at what level?
3. How should official ticket sales be priced to compete with Entraste while keeping organizer fees low?
4. What fee structure makes sense for small in-party product purchases that will also be paid through dLocal?

This is a strategic pricing memo, not an accounting opinion. It uses conservative assumptions, especially around taxes charged by dLocal.

## Sources And Inputs

### Founder-provided commercial inputs

- Current resale pricing:
  - Buyer fee: `6% + VAT`
  - Seller fee: `6% + VAT`
- dLocal collection fee card:
  - Uruguay, Argentina, Brazil
- dLocal payout fee card:
  - Local payouts: `1% + USD 0.2`
  - Cross-border payouts: `1.5% + USD 0.2`
- Entraste benchmark for official ticket sales:
  - Buyer fee: `10% + VAT`
  - Online seller fee: `UYU 40 + VAT`
  - Physical seller fee: `UYU 30`

### Market-mix references

- Uruguay payment-method mix from dLocal:
  - [Uruguay payment methods, processors, and ecommerce market](https://www.dlocal.com/payment-processors-in-latin-america/uruguay-payment-methods-processors-e-commerce-market-dlocal/)
- Argentina payment-method mix from dLocal:
  - [Argentina payment methods, processors, and ecommerce market](https://www.dlocal.com/payment-processors-in-latin-america/argentina-payment-methods-processors-e-commerce-market-dlocal/)
- Brazil payment-method mix from dLocal:
  - [Brazil payment methods, processors, and ecommerce market](https://www.dlocal.com/payment-processors-in-latin-america/brazil-payment-methods-processors-ecommerce-market-dlocal/)

### Working assumptions used in this memo

- Main benchmark ticket: `UYU 2,000`
- Additional resale ticket bands for sensitivity:
  - `UYU 500`
  - `UYU 800`
  - `UYU 1,000`
  - `UYU 2,000`
- Uruguay VAT: `22%`
- Argentina VAT on dLocal pricing: `21%`
- Brazil VAT on dLocal pricing: `18%`
- Conservative tax treatment:
  - VAT charged by dLocal on collection fees is treated as a real cost for now
- Exchange assumption for fixed payout illustrations:
  - `USD 1 ~= UYU 40`
  - This is only a planning assumption used to translate the fixed `USD 0.2` payout fee into UYU examples

## Core Concepts

### 1. Visible fee vs platform revenue

The biggest conceptual mistake to avoid is confusing:

- the fee percentage visible to the user
- the total wedge between what the buyer pays and the seller receives
- the actual revenue Revendiste keeps before processor costs

For a resale transaction:

- Buyer fee before VAT:
  - `buyerFeeBeforeVat = ticketPrice * buyerRate`
- Seller fee before VAT:
  - `sellerFeeBeforeVat = ticketPrice * sellerRate`
- VAT charged on those fees:
  - `buyerVat = buyerFeeBeforeVat * vatRate`
  - `sellerVat = sellerFeeBeforeVat * vatRate`
- Buyer total:
  - `buyerTotal = ticketPrice + buyerFeeBeforeVat + buyerVat`
- Seller net:
  - `sellerNet = ticketPrice - sellerFeeBeforeVat - sellerVat`
- Platform revenue before payment costs:
  - `platformRevenue = buyerFeeBeforeVat + sellerFeeBeforeVat`
- Total wedge between buyer and seller:
  - `buyerTotal - sellerNet`

### 2. What `6% + VAT` actually means in Uruguay

At `6%` commission and `22%` VAT:

- Visible fee on each side:
  - `6% * 1.22 = 7.32%`
- Total marketplace wedge:
  - `7.32% + 7.32% = 14.64%`
- Actual platform revenue before costs:
  - `6% + 6% = 12%`

So `7.32%` is not the full platform take. It is only the visible fee on one side.

## dLocal Rate Inputs

### Collection fees provided by the founder

#### Uruguay

- Credit card: `2.99% + VAT`
- Debit card: `1.99% + VAT`
- Cash: `0.99% + USD 0.4 + VAT`
- Bank transfer: `1.49% + VAT`

#### Argentina

- Credit card: `2.99% + VAT`
- Debit card: `1.99% + VAT`
- Cash: `2.99% + VAT`
- Bank transfer: `1.49% + VAT`

#### Brazil

- Credit card: `2.99% + VAT`
- Debit card: `1.99% + VAT`
- Cash:
  - boleto: `USD 0.5`
  - Pix: `0.99% + VAT`
- Bank transfer: `1.49% + VAT`

### Payout fees provided by the founder

For Uruguay, Argentina, and Brazil:

- Local payout: `1% + USD 0.2`
- Cross-border payout: `1.5% + USD 0.2`

### Market-mix observations from dLocal country pages

#### Uruguay

The dLocal Uruguay page highlights:

- `61%` credit card
- `14%` eWallet
- `10%` bank transfer
- `7%` debit card
- `4%` cash
- `4%` other

This means Uruguay is still largely card-driven, but there is a non-trivial `18%` of payment volume in categories for which this memo does not have a fee quote from the founder:

- eWallet
- other

#### Argentina

The dLocal Argentina page highlights:

- `52%` eWallet
- `20%` domestic credit card
- `11%` international credit card
- `9%` debit card
- `2%` cash
- `2%` bank transfer
- `4%` other

This is strategically important. Argentina should not receive a final pricing decision until the wallet fee schedule is known, because over half of the local mix is concentrated there.

#### Brazil

The dLocal Brazil page highlights:

- `44%` Pix
- `31%` domestic credit card
- `10%` international credit card
- `7%` eWallet
- `7%` boleto
- `1%` debit card
- `1%` BNPL

Brazil looks structurally more favorable than Argentina because Pix is usually a lower-cost method than cards.

## Uruguay Resale Economics

This section ignores Entraste because Entraste does not compete directly in resale.

### Current resale fee model

- Buyer: `6% + VAT`
- Seller: `6% + VAT`

### Gross economics before dLocal

| Ticket price |    Buyer total |     Seller net | Platform revenue before costs | VAT remitted |
| ------------ | -------------: | -------------: | ----------------------------: | -----------: |
| `UYU 500`    |   `UYU 536.60` |   `UYU 463.40` |                   `UYU 60.00` |  `UYU 13.20` |
| `UYU 800`    |   `UYU 858.56` |   `UYU 741.44` |                   `UYU 96.00` |  `UYU 21.12` |
| `UYU 1,000`  | `UYU 1,073.20` |   `UYU 926.80` |                  `UYU 120.00` |  `UYU 26.40` |
| `UYU 2,000`  | `UYU 2,146.40` | `UYU 1,853.60` |                  `UYU 240.00` |  `UYU 52.80` |

### Collection-cost estimate for Uruguay

Using only the payment methods for which both a usage share and a quoted fee are available, the known-method blended collection cost is approximately:

- Credit card with VAT:
  - `2.99% * 1.22 = 3.6478%`
- Debit card with VAT:
  - `1.99% * 1.22 = 2.4278%`
- Bank transfer with VAT:
  - `1.49% * 1.22 = 1.8178%`
- Cash variable fee with VAT:
  - `0.99% * 1.22 = 1.2078%`
- Cash fixed fee with VAT:
  - `USD 0.4 * 1.22 ~= USD 0.488 ~= UYU 19.52`

Normalizing only the known-method buckets from the Uruguay page, the implied blended collection cost is roughly:

- around `3.2%` of the buyer payment amount
- plus a very small average fixed cash component spread across all transactions

That produces a useful planning shortcut:

- On a `UYU 2,000` resale ticket, buyer total is `UYU 2,146.40`
- A rough Uruguay blended collection cost is about `UYU 69` to `UYU 70`

This is directionally consistent with the founder's intuition that dLocal consumes a large share of commission revenue.

### Payout cost with no minimum

For resale, payout cost matters because sellers are fragmented and balances may be small.

Using:

- local payout:
  - `1% + UYU 8`
- cross-border payout:
  - `1.5% + UYU 8`

and paying a seller immediately after one sale:

| Ticket price |     Seller net | Local payout cost | Cross-border payout cost |
| ------------ | -------------: | ----------------: | -----------------------: |
| `UYU 500`    |   `UYU 463.40` |       `UYU 12.63` |              `UYU 14.95` |
| `UYU 800`    |   `UYU 741.44` |       `UYU 15.41` |              `UYU 19.12` |
| `UYU 1,000`  |   `UYU 926.80` |       `UYU 17.27` |              `UYU 21.90` |
| `UYU 2,000`  | `UYU 1,853.60` |       `UYU 26.54` |              `UYU 35.80` |

### What no minimum means in practice

If the average ticket price is above `UYU 1,000`, the risk of having no payout minimum is real but not catastrophic.

The fixed `UYU 8` equivalent matters as a share of platform revenue:

- on a `UYU 1,000` ticket:
  - platform revenue is `UYU 120`
  - the fixed `UYU 8` alone is `6.7%` of that revenue
- on a `UYU 2,000` ticket:
  - platform revenue is `UYU 240`
  - the fixed `UYU 8` alone is `3.3%` of that revenue

So the main risk of no minimum is not that the model immediately breaks. The main risk is that many low-value, one-ticket payouts quietly compress margin.

### Batching effect: no minimum vs `UYU 1,000` vs `UYU 1,500`

At the current seller net values, the payout thresholds imply:

| Ticket price | Seller net per ticket | Sales needed for `UYU 1,000` payout | Sales needed for `UYU 1,500` payout |
| ------------ | --------------------: | ----------------------------------: | ----------------------------------: |
| `UYU 500`    |          `UYU 463.40` |                                 `3` |                                 `4` |
| `UYU 800`    |          `UYU 741.44` |                                 `2` |                                 `3` |
| `UYU 1,000`  |          `UYU 926.80` |                                 `2` |                                 `2` |

Local payout cost per ticket after batching:

| Ticket price |  No minimum | `UYU 1,000` minimum | `UYU 1,500` minimum |
| ------------ | ----------: | ------------------: | ------------------: |
| `UYU 500`    | `UYU 12.63` |          `UYU 7.30` |          `UYU 6.63` |
| `UYU 800`    | `UYU 15.41` |         `UYU 11.41` |         `UYU 10.08` |
| `UYU 1,000`  | `UYU 17.27` |         `UYU 13.27` |         `UYU 13.27` |

Important implication:

- Moving from `UYU 1,500` down to `UYU 1,000` does not hurt much
- Moving from no minimum to any batched threshold saves more, but still not enough to justify a bad seller experience if the average ticket is already high

### Strategic payout conclusion for resale

Given the current discussion, the best launch posture is likely:

- no public hard payout minimum shown to users
- post-event payout release only
- weekly batched payout processing
- monthly fallback payout cycle for low balances if needed operationally

This preserves seller trust better than a visible minimum while still capturing some batching benefit.

### Should resale commission increase to `6.5%`?

At `6.5% + VAT` on each side:

- visible fee on each side becomes:
  - `6.5% * 1.22 = 7.93%`
- platform revenue before costs becomes:
  - `13%` of ticket face value instead of `12%`

Illustrative impact:

| Ticket price | Revenue at `6% + 6%` | Revenue at `6.5% + 6.5%` | Revenue lift |
| ------------ | -------------------: | -----------------------: | -----------: |
| `UYU 1,000`  |         `UYU 120.00` |             `UYU 130.00` |  `UYU 10.00` |
| `UYU 2,000`  |         `UYU 240.00` |             `UYU 260.00` |  `UYU 20.00` |

Customer-facing impact:

| Ticket price | Extra paid by buyer | Extra lost by seller |
| ------------ | ------------------: | -------------------: |
| `UYU 1,000`  |          `UYU 6.10` |           `UYU 6.10` |
| `UYU 2,000`  |         `UYU 12.20` |          `UYU 12.20` |

Interpretation:

- `6.5%` is a strong margin lever
- the user-visible difference is small
- most of that extra `0.5%` on each side should flow to contribution margin

However, the current recommendation is still:

- keep resale at `6% + VAT` on each side for launch
- revisit `6.5%` only after observing real fee sensitivity, cross-border mix, and refund/support burden

That recommendation is driven less by math than by sequencing:

- launch first
- learn actual behavior
- increase later if justified

### Resale conclusion

Current best recommendation:

- Keep resale at `6% + VAT` on the buyer side
- Keep resale at `6% + VAT` on the seller side
- Do not launch with a strict public payout minimum
- Instead, batch payouts operationally after the event
- Revisit `6.5%` only after volume provides evidence

This is consistent with the founder's intuition that `6% + VAT` is not meaningfully high once dLocal costs are included.

## Official Ticket Sales

Official ticket sales are a different product and should not inherit the resale model.

### Why official ticketing is different

Resale and official ticketing differ on several points:

1. Official sales face direct organizer-side competition
2. Official sales can batch settlements to producers
3. Official sales do not require fragmented seller payouts like resale
4. Organizer acquisition is strategically important at launch

### Entraste benchmark

The founder provided the following benchmark for Entraste:

- Buyer fee: `10% + VAT`
- Online seller fee: `UYU 40 + VAT`
- Physical seller fee: `UYU 30`

At a `UYU 2,000` ticket sold online:

- Buyer fee before VAT:
  - `UYU 200`
- Buyer total:
  - `UYU 2,244.00`
- Seller fee before VAT:
  - `UYU 40`
- Seller total deduction:
  - `UYU 48.80`
- Seller net:
  - `UYU 1,951.20`
- Platform revenue before costs:
  - `UYU 240`

This means Entraste and Revendiste's current resale fee generate the same pre-cost revenue at `UYU 2,000`, but the split is very different:

- Entraste is heavier on buyers
- Revendiste resale is heavier on sellers

Since organizer acquisition matters for official sales, Revendiste should likely keep organizer fees very low.

### Official ticket sales scenarios

Below are three possible starting scenarios for Uruguay official ticketing.

#### Scenario A: Organizer acquisition

- Buyer fee: `8% + VAT`
- Organizer fee: `UYU 20 + VAT`

At `UYU 2,000`:

- Buyer total:
  - `UYU 2,195.20`
- Organizer net:
  - `UYU 1,975.60`
- Platform revenue before costs:
  - `UYU 180`

Use this if the top priority is signing producers quickly.

#### Scenario B: Balanced undercut

- Buyer fee: `9% + VAT`
- Organizer fee: `UYU 20 + VAT`

At `UYU 2,000`:

- Buyer total:
  - `UYU 2,219.60`
- Organizer net:
  - `UYU 1,975.60`
- Platform revenue before costs:
  - `UYU 200`

This is the strongest general-purpose starting point.

#### Scenario C: Margin-preserving undercut

- Buyer fee: `9% + VAT`
- Organizer fee: `UYU 30 + VAT`

At `UYU 2,000`:

- Buyer total:
  - `UYU 2,219.60`
- Organizer net:
  - `UYU 1,963.40`
- Platform revenue before costs:
  - `UYU 210`

This still undercuts Entraste on both sides while protecting more margin.

### Official ticketing payout implications

For official sales, payout fees are less problematic than in resale because organizer settlements should be batched:

- daily
- weekly
- or after the event

That makes the fixed `USD 0.2` almost irrelevant on a per-ticket basis.

Therefore the main pricing decisions for official ticket sales should be driven by:

- competitive positioning
- buyer conversion
- organizer acquisition
- support and refund burden

not by fragmented payout economics

### Official ticket sales conclusion

Current recommendation:

- Use a different fee structure from resale
- Keep organizer fee intentionally low
- Start with either:
  - `9% + VAT` buyer fee and `UYU 20 + VAT` organizer fee
  - or `9% + VAT` buyer fee and `UYU 30 + VAT` organizer fee if more margin protection is needed

The `9% + 20` model is the most attractive initial candidate if organizer acquisition is strategic.

## In-Party Products Sold Through The Web

This includes things like:

- drinks
- cigarettes
- add-ons consumed at the event
- other ancillary products linked to an event sold on Revendiste

### Why this needs a separate model

In-party products should not inherit either the resale fee model or the official ticketing model without modification.

Key reasons:

1. Average order value can be much lower than a ticket
2. Buyer-visible fees are more painful on small baskets
3. If the organizer fulfills the product, settlements can still be batched
4. Payment may happen on the web through dLocal, so collection cost remains relevant

### Unit-economics principle

For ancillary products, the danger is low order value.

At low order values:

- payment processing consumes a larger share of GMV
- buyer-visible percentage fees feel more expensive
- refunds and support consume a larger share of margin

This means Revendiste should avoid offering very low-value standalone purchases under a fee model that is too light.

### Recommended commercial logic

#### Best case: ancillary products purchased together with tickets

If drinks or add-ons are purchased inside the same ticket checkout:

- operational complexity is lower
- the organizer can still be settled in batches
- the customer already expects a checkout flow

Recommended approach:

- low or zero buyer fee
- organizer-side fee in the `8%` to `10%` range

This keeps the customer experience cleaner for small add-ons.

#### Standalone ancillary purchase before the event

If the user buys only drinks or only in-party products in a separate web checkout, the model gets tougher.

Recommended approach:

- organizer-side fee in the `10%` to `12%` range
- optional minimum cart amount, for example `UYU 400` to `UYU 500`
- avoid enabling high-friction or fixed-fee-heavy payment methods for very small orders

### Illustrative ancillary-product economics

Assume:

- organizer fulfills the product
- Revendiste collects online through dLocal
- settlement to organizer is batched
- fee model is organizer-side only at `10% + VAT`

#### Example: `UYU 300` standalone order

- Platform revenue before costs:
  - `UYU 30`
- Rough Uruguay collection cost at about `3.2%` of buyer payment:
  - around `UYU 9.6`
- Batched organizer payout cost at roughly `1.1%` effective:
  - around `UYU 3.3`
- Remaining gross contribution before support/refunds:
  - around `UYU 17.1`

#### Example: `UYU 600` standalone order

- Platform revenue before costs:
  - `UYU 60`
- Rough collection cost:
  - around `UYU 19.2`
- Batched organizer payout cost:
  - around `UYU 6.6`
- Remaining gross contribution before support/refunds:
  - around `UYU 34.2`

These examples show why small ancillary orders can work, but not under an overly soft fee structure.

### Ancillary-products conclusion

Current recommendation:

- If sold in the same checkout as tickets:
  - charge the organizer around `8%` to `10%`
  - avoid a visible buyer surcharge if possible
- If sold standalone:
  - charge the organizer around `10%` to `12%`
  - consider a minimum cart amount around `UYU 400` to `UYU 500`
  - avoid or limit payment methods that create high fixed costs on low baskets

## Country Expansion Implications

### Uruguay

Uruguay is mature enough for fee design now because:

- the resale model appears defensible at `6% + VAT` per side
- the official-sales benchmark versus Entraste is clear enough to price against

### Argentina

Argentina should not receive a final official-sales or resale fee decision until the local wallet pricing is known.

Reason:

- `52%` of the dLocal Argentina payment mix is eWallet
- this memo does not have the founder's fee card for that category

### Brazil

Brazil appears more promising than Argentina for future price aggressiveness because:

- `44%` of the dLocal Brazil mix is Pix
- Pix is usually structurally cheaper than cards

## Final Recommended Framework

### 1. Ticket resale

- Launch fee:
  - Buyer: `6% + VAT`
  - Seller: `6% + VAT`
- Payout policy:
  - no strict public payout minimum at launch
  - post-event release only
  - weekly batched payout processing
- Revisit after data:
  - only consider moving to `6.5% + VAT` once real fee sensitivity and support burden are understood

### 2. Official ticket sales

- Use a separate model from resale
- Keep organizer fee intentionally low
- Initial candidate:
  - Buyer: `9% + VAT`
  - Organizer: `UYU 20 + VAT`
- Margin-protecting fallback:
  - Buyer: `9% + VAT`
  - Organizer: `UYU 30 + VAT`

### 3. In-party products

- If bundled with ticket checkout:
  - Organizer fee: `8%` to `10%`
- If standalone web purchase:
  - Organizer fee: `10%` to `12%`
  - minimum cart consideration: `UYU 400` to `UYU 500`

## Key Strategic Takeaways

1. Resale is not over-priced at `6% + VAT` on each side once dLocal costs are considered.
2. The strongest resale risk is not the fee itself, but fragmented low-value payouts.
3. Seller trust is likely more important than enforcing a visible payout minimum at launch.
4. Official ticket sales should be optimized for organizer acquisition, not copied from resale.
5. In-party products need a separate, low-basket-aware fee structure.
6. Argentina pricing remains incomplete until eWallet costs are known.

## Open Questions For Future Revision

1. What is the real average ticket value after launch?
2. What percentage of resale payouts will be cross-border?
3. What is the actual dLocal wallet fee schedule for Argentina and Uruguay?
4. Will in-party products be mostly:
   - bundled into ticket checkout
   - or sold as standalone purchases?
5. Will official ticket sales require organizer-specific custom pricing for large accounts?
