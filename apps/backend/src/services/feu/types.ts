/**
 * FEU (Facturación Electrónica Uruguay) API types.
 * Aligned with official API docs: auth token, crear comprobante request/response.
 */

/**
 * Auth response. FEU only returns access_token, token_type, refresh_token (no expires_in).
 * FeuAuthService derives TTL from the JWT exp claim when possible, else uses a 1-day default.
 */
export interface FeuTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  /** Optional; FEU does not send this — we use JWT exp or 1-day default when missing */
  expires_in?: number;
}

/** Response from GET /comprobantes/{id}/pdf — PDF as base64 in data */
export interface FeuPdfResponse {
  file_name: string;
  mime_type: string;
  format: 'base64';
  data: string; // base64-encoded PDF
}

/** Response from POST /comprobantes/crear (Parámetros de Salida doc). url = DGI page; use GET /comprobantes/{id}/pdf for PDF. */
export interface FeuCreateComprobanteResponse {
  id: number; // CFE id — use in GET /comprobantes/{id}/pdf to obtain PDF
  serie: string;
  numero: number;
  hash: string;
  cae_numero: number;
  cae_rango_inicio?: number;
  cae_rango_final?: number;
  cae_vencimiento: string;
  url: string; // DGI page, not direct PDF; use getPdfByCfeId(id) for PDF
  comprobante_tipo?: number;
  importe_total?: number;
}

/** Item: cantidad (>0), concepto (max 80), precio (>0), indicador_facturacion, unidad (Doc) */
export interface FeuComprobanteItem {
  cantidad: number;
  concepto: string;
  precio: number;
  indicador_facturacion: number; // 1–17 per Doc tabla
  unidad: string;
}

/**
 * Payload for POST /comprobantes/crear.
 * Emisión de un e-ticket sin receptor identificado (consumidor final).
 * No se envía "cliente"; válido cuando no se tienen datos del receptor.
 */
export interface FeuComprobantePayload {
  sucursal: number; // Nro sucursal DGI emisor, > 0
  tipo_comprobante: number; // 101 = eTicket
  forma_pago: number; // 1 = Contado, 2 = Crédito
  moneda: string; // ISO 4217 (UYU, USD, EUR)
  cod_montos_brutos: number; // 1 = ítems con IVA incluido
  fecha_comprobante: string; // AAAA-MM-DD
  id_externo?: string; // Token idempotencia (opcional)
  items: FeuComprobanteItem[];
  adenda?: { texto: string }; // max 150 caracteres
}
