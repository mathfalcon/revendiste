import axios, {type RawAxiosRequestHeaders} from 'axios';
import {
  DLOCAL_API_KEY,
  DLOCAL_BASE_URL,
  DLOCAL_PAYOUTS_BASE_URL,
  DLOCAL_PAYOUTS_TIMEOUT_MS,
  DLOCAL_SECRET_KEY,
} from '~/config/env';

/**
 * dLocal Payouts API v3 (same base host as Go payins, path `/payouts/v3`).
 * @see https://docs.dlocal.com/docs/integrate-payouts-v3
 */
const DEFAULT_TIMEOUT_MS = DLOCAL_PAYOUTS_TIMEOUT_MS;

function payoutV3Path(suffix: 'quote' | 'submit') {
  const base = (DLOCAL_PAYOUTS_BASE_URL || DLOCAL_BASE_URL).replace(/\/$/, '');
  if (suffix === 'quote') {
    return `${base}/payouts/v3/quote`;
  }
  return `${base}/payouts/v3`;
}

function v3Headers(): RawAxiosRequestHeaders {
  return {
    'Content-Type': 'application/json',
    'X-Date': new Date().toISOString(),
    'X-Version': '3.0',
    Authorization: `Bearer ${DLOCAL_API_KEY}:${DLOCAL_SECRET_KEY}`,
  };
}

/**
 * @see https://docs.dlocal.com/reference/create-quote-payouts-v3
 */
export type DLocalPayoutQuoteRequest = {
  country: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceAmount: number;
};

export type DLocalPayoutQuoteResponse = {
  quote_id: string;
  created_date?: string;
  expiration_date?: string;
  details?: {
    source_currency?: string;
    destination_currency?: string;
    source_amount?: number;
    destination_amount?: number;
  };
  [key: string]: unknown;
};

export async function createDLocalPayoutQuote(
  body: DLocalPayoutQuoteRequest,
): Promise<DLocalPayoutQuoteResponse> {
  const {data} = await axios.post(
    payoutV3Path('quote'),
    {
      country: body.country,
      source_currency: body.sourceCurrency,
      destination_currency: body.destinationCurrency,
      source_amount: body.sourceAmount,
    },
    {headers: v3Headers(), timeout: DEFAULT_TIMEOUT_MS, maxRedirects: 0},
  );
  return data as DLocalPayoutQuoteResponse;
}

/**
 * @see https://docs.dlocal.com/reference/requesting-payout-v3
 */
export async function submitDLocalPayout(
  requestBody: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const {data} = await axios.post<Record<string, unknown>>(
    payoutV3Path('submit'),
    requestBody,
    {headers: v3Headers(), timeout: DEFAULT_TIMEOUT_MS, maxRedirects: 0},
  );
  return data;
}
