import type {FxSnapshot} from '@revendiste/shared';
import type {FxStrategyContext, PayoutFxStrategy} from './types';

/** Same-currency payout: no FX snapshot row. */
export class NoFxStrategy implements PayoutFxStrategy {
  readonly id = 'no_fx';

  async buildSnapshot(_ctx: FxStrategyContext): Promise<FxSnapshot | null> {
    return null;
  }
}
