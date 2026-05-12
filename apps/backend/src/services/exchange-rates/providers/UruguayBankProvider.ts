import type {IExchangeRateProvider} from '../IExchangeRateProvider';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {ServiceUnavailableError} from '~/errors';
import {logger} from '~/utils';
import {fetchItauUsdVentaFromSource} from './itauCotizXml';
import {parseUyRateNumber} from './uyRateNumberParse';

const BROU_COTIZACIONES_PORTLET_URL =
  'https://www.brou.com.uy/c/portal/render_portlet?p_l_id=20593&p_p_col_count=2&p_p_col_id=column-1&p_p_col_pos=0&p_p_id=cotizacionfull_WAR_broutmfportlet_INSTANCE_otHfewh1klyS&p_p_isolated=1&p_p_lifecycle=0&p_p_mode=view&p_p_state=normal&p_t_lifecycle=0';

/** Parse BROU portlet valor text (same rules as {@link parseUyRateNumber}). */
export function parseBrouNumber(raw: string): number {
  return parseUyRateNumber(raw);
}

async function fetchBrouEbrouVentaRateFromSource(): Promise<number> {
  const response = await fetch(BROU_COTIZACIONES_PORTLET_URL, {
    headers: {'User-Agent': 'RevendisteBackend/1.0'},
  });
  if (!response.ok) {
    throw new Error(`BROU cotizaciones HTTP ${response.status}`);
  }
  const html = await response.text();
  const marker = 'Dólar eBROU';
  const idx = html.indexOf(marker);
  if (idx === -1) {
    throw new Error('BROU: Dólar eBROU row not found');
  }
  const slice = html.slice(idx, idx + 2500);
  const valorMatches = [...slice.matchAll(/<p class="valor">\s*([^<]+)\s*<\/p>/gi)];
  const numbers: number[] = [];
  for (const m of valorMatches) {
    const n = parseUyRateNumber(m[1] ?? '');
    if (!Number.isNaN(n) && n > 0) {
      numbers.push(n);
    }
  }
  // Row order: Compra, Venta, Arbitraje Compra, Arbitraje Venta
  if (numbers.length < 2) {
    throw new Error('BROU: could not parse eBROU compra/venta');
  }
  const venta = numbers[1];
  if (venta < 1 || venta > 200) {
    throw new Error(`BROU: unexpected venta rate ${venta}`);
  }
  return venta;
}

/**
 * USD electronic **venta** (UYU per 1 USD): BROU eBROU first, then Itaú cotiz.xml.
 * If both fail, throws {@link ServiceUnavailableError}.
 */
export async function fetchBrouEbrouVentaRate(): Promise<number> {
  try {
    return await fetchBrouEbrouVentaRateFromSource();
  } catch (brouError) {
    logger.warn('BROU eBROU rate fetch failed, trying Itaú cotiz.xml', {
      error: brouError,
    });
    try {
      const venta = await fetchItauUsdVentaFromSource();
      logger.warn('Using Itaú USD venta as fallback (BROU unavailable)', {
        venta,
      });
      return venta;
    } catch (itauError) {
      logger.error('BROU and Itaú USD venta fetch both failed', {
        brouError,
        itauError,
      });
      throw new ServiceUnavailableError(
        PAYOUT_ERROR_MESSAGES.USD_UYU_EXCHANGE_RATE_UNAVAILABLE,
      );
    }
  }
}

/**
 * BROU / Itaú-backed USD↔UYU rates (same venta semantics as {@link fetchBrouEbrouVentaRate}).
 */
export class UruguayBankProvider implements IExchangeRateProvider {
  readonly name = 'uruguay_bank';

  isAvailable(): boolean {
    return true;
  }

  async getExchangeRate(
    from: 'UYU' | 'USD',
    to: 'UYU' | 'USD',
  ): Promise<number> {
    if (from === to) {
      return 1;
    }

    const venta = await fetchBrouEbrouVentaRate();

    // Venta = UYU charged per 1 USD when the bank sells USD (we buy USD with UYU)
    if (from === 'UYU' && to === 'USD') {
      return 1 / venta;
    }
    if (from === 'USD' && to === 'UYU') {
      return venta;
    }

    logger.warn('UruguayBankProvider unexpected pair', {from, to});
    return 1;
  }
}
