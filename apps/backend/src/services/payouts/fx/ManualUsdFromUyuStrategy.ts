import type {FxSnapshot} from '@revendiste/shared';
import {PAYOUT_FX_SPREAD_PERCENT} from '~/config/env';
import {fetchBrouEbrouVentaRate} from '~/services/exchange-rates/providers/UruguayBankProvider';
import {roundToDecimals} from '@revendiste/shared';
import type {FxStrategyContext, PayoutFxStrategy} from './types';

/**
 * Manual UY bank USD payout: we hold UYU at the processor, seller receives USD.
 * Reference = BROU eBROU venta; providerRate = BROU × (1 + spread).
 */
export class ManualUsdFromUyuStrategy implements PayoutFxStrategy {
  readonly id = 'manual_usd_from_uyu';

  async buildSnapshot(ctx: FxStrategyContext): Promise<FxSnapshot | null> {
    const brouVenta = await fetchBrouEbrouVentaRate();
    const spreadFrac = PAYOUT_FX_SPREAD_PERCENT / 100;
    const effectiveUyuPerUsd = brouVenta * (1 + spreadFrac);
    const sourceAmount = roundToDecimals(
      ctx.destinationAmount * effectiveUyuPerUsd,
      2,
    );
    const nowIso = new Date().toISOString();

    const snapshot: FxSnapshot = {
      sourceCurrency: 'UYU',
      sourceAmount,
      destinationCurrency: 'USD',
      destinationAmount: ctx.destinationAmount,
      referenceRate: {
        value: brouVenta,
        source: 'brou_venta',
        fetchedAt: nowIso,
      },
      providerRate: effectiveUyuPerUsd,
      spreadPercent: PAYOUT_FX_SPREAD_PERCENT,
      executor: 'admin_manual',
    };
    return snapshot;
  }
}
