import {logger} from '~/utils';
import {parseUyRateNumber} from './uyRateNumberParse';

const ITAU_COTIZ_XML_URL = 'https://www.itau.com.uy/inst/aci/cotiz.xml';

/**
 * Itaú publishes USD as moneda code `LINK` in cotiz.xml (legacy naming).
 * Fallback codes cover possible feed variants.
 */
const USD_MONEDA_CODES = ['LINK', 'DOL', 'USD', 'DLS'] as const;

/**
 * Parse Itaú {@link ITAU_COTIZ_XML_URL} body and return USD **venta** (UYU per 1 USD).
 */
export function parseItauUsdVentaFromXml(xml: string): number {
  const blockRe = /<cotizacion\b[^>]*>[\s\S]*?<\/cotizacion>/gi;
  const blocks = [...xml.matchAll(blockRe)].map(m => m[0]);

  for (const code of USD_MONEDA_CODES) {
    for (const block of blocks) {
      const monedaMatch = block.match(
        /<moneda>\s*([^<]*?)\s*<\/moneda>/i,
      );
      const moneda = monedaMatch?.[1]?.trim();
      if (!moneda || moneda.toUpperCase() !== code) {
        continue;
      }
      const ventaMatch = block.match(/<venta>\s*([^<]*?)\s*<\/venta>/i);
      const rawVenta = ventaMatch?.[1];
      if (rawVenta == null) {
        continue;
      }
      const venta = parseUyRateNumber(rawVenta);
      if (!Number.isNaN(venta) && venta > 1 && venta < 200) {
        return venta;
      }
    }
  }

  throw new Error('Itaú cotiz.xml: USD venta not found or invalid');
}

export async function fetchItauUsdVentaFromSource(): Promise<number> {
  const response = await fetch(ITAU_COTIZ_XML_URL, {
    headers: {'User-Agent': 'RevendisteBackend/1.0'},
  });
  if (!response.ok) {
    throw new Error(`Itaú cotiz.xml HTTP ${response.status}`);
  }
  const xml = await response.text();
  const venta = parseItauUsdVentaFromXml(xml);
  logger.info('Itaú cotiz.xml USD venta fetched', {venta});
  return venta;
}
