import axios from 'axios';
import { logger } from '~/utils';
import { withRetry } from '~/utils/retry';
import {
  FEU_API_BASE_URL,
  FEU_EMISOR_RUT,
  FEU_REQUEST_TIMEOUT_MS,
} from '~/config/env';
import type {
  FeuCreateComprobanteResponse,
  FeuComprobantePayload,
  FeuPdfResponse,
} from './types';
import { INVOICE_ERROR_MESSAGES } from '~/constants/error-messages';
import type { FeuAuthService } from './FeuAuthService';

/** Optional PDF format: A4 (default) or ticket 80mm thermal */
export type FeuPdfTipo = 'A4' | 'ticket80';

/**
 * FEU API client: create comprobante and get PDF by CFE id.
 * The URL returned by crear comprobante is a DGI page; use getPdfByCfeId for the actual PDF.
 */
export class FeuClient {
  constructor(private readonly auth: FeuAuthService) {}

  /**
   * Create a comprobante (e-ticket invoice) via FEU API.
   */
  async createComprobante(
    payload: FeuComprobantePayload,
  ): Promise<FeuCreateComprobanteResponse> {
    if (!FEU_API_BASE_URL || !FEU_EMISOR_RUT) {
      throw new Error(INVOICE_ERROR_MESSAGES.FEU_AUTH_FAILED);
    }

    const token = await this.auth.getAccessToken();
    const url = `${FEU_API_BASE_URL.replace(/\/$/, '')}/comprobantes/crear`;

    const response = await withRetry(
      () =>
        axios.post<FeuCreateComprobanteResponse>(url, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Emisor': FEU_EMISOR_RUT,
            'Content-Type': 'application/json',
          },
          timeout: FEU_REQUEST_TIMEOUT_MS ?? 30_000,
        }),
      {
        maxAttempts: 2,
        shouldRetry: err =>
          !axios.isAxiosError(err) || (err.response?.status ?? 0) >= 500,
      },
    );

    return response.data;
  }

  /**
   * Get PDF for a comprobante by its CFE id (id returned by crear comprobante).
   * The URL in the create response points to DGI; this endpoint returns the actual PDF.
   */
  async getPdfByCfeId(
    cfeId: number,
    tipo: FeuPdfTipo = 'A4',
  ): Promise<Buffer> {
    if (!FEU_API_BASE_URL || !FEU_EMISOR_RUT) {
      throw new Error(INVOICE_ERROR_MESSAGES.FEU_AUTH_FAILED);
    }

    const token = await this.auth.getAccessToken();
    const base = FEU_API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/comprobantes/${cfeId}/pdf${tipo === 'ticket80' ? '?tipo=ticket80' : ''}`;

    const response = await withRetry(
      () =>
        axios.get<FeuPdfResponse>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Emisor': FEU_EMISOR_RUT,
          },
          timeout: FEU_REQUEST_TIMEOUT_MS ?? 30_000,
        }),
      {
        maxAttempts: 2,
        shouldRetry: err =>
          !axios.isAxiosError(err) || (err.response?.status ?? 0) >= 500,
      },
    );

    const { data: base64Data } = response.data;
    if (!base64Data || response.data.format !== 'base64') {
      throw new Error(INVOICE_ERROR_MESSAGES.FEU_PDF_DOWNLOAD_FAILED);
    }
    return Buffer.from(base64Data, 'base64');
  }
}
