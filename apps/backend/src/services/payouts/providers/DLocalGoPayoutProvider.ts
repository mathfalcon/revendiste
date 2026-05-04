import {ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {
  API_BASE_URL,
  DLOCAL_PAYOUT_REMITTER_EMAIL,
  DLOCAL_PAYOUT_REMITTER_FIRST_NAME,
  DLOCAL_PAYOUT_REMITTER_LAST_NAME,
  DLOCAL_PAYOUT_REMITTER_NATIONALITY,
  DLOCAL_PAYOUT_REMITTER_PHONE,
  DLOCAL_PAYOUT_REMITTER_DOCUMENT_ID,
  DLOCAL_PAYOUT_REMITTER_DOCUMENT_TYPE,
  DLOCAL_PAYOUT_NOTIFICATION_URL,
} from '~/config/env';
import type {
  EventTicketCurrency,
  PayoutStatus,
  UruguayanBankMetadata,
} from '@revendiste/shared';
import {
  ArgentinianBankMetadataSchema,
  PayoutMetadataSchema,
  UruguayanBankMetadataSchema,
} from '@revendiste/shared';
import {submitDLocalPayout} from './dlocal-payouts/client';
import {BasePayoutProvider} from './BasePayoutProvider';
import type {
  InitiatePayoutParams,
  InitiatePayoutResult,
  ProcessPayoutParams,
  ProcessPayoutResult,
  PayoutStatusResult,
} from './PayoutProvider.interface';
import {mapUruguayanBankNameToDLocalCode} from './uy-bank-codes-dlocal';

function dLocalPayoutFxHintsFromResponse(
  raw: Record<string, unknown>,
): {actualRate?: number; providerFees?: number} | undefined {
  const details = raw.details;
  if (details && typeof details === 'object') {
    const d = details as Record<string, unknown>;
    const src = Number(d.source_amount ?? d['source_amount']);
    const dst = Number(d.destination_amount ?? d['destination_amount']);
    if (Number.isFinite(src) && Number.isFinite(dst) && src > 0) {
      return {actualRate: dst / src};
    }
  }
  const fee = Number(raw.fee ?? raw['fee']);
  if (Number.isFinite(fee)) {
    return {providerFees: fee};
  }
  return undefined;
}

const PURPOSE = 'REMITTANCES';
const PURPOSE_DESCRIPTION = 'Revendiste pago a vendedor';
const DESCRIPTOR = 'Revendiste';

/**
 * dLocal Payouts v3: Uruguay + Argentina bank transfer when the platform flag is on.
 * Manual / ops still confirm in admin; this provider triggers the transfer.
 */
export class DLocalGoPayoutProvider extends BasePayoutProvider {
  readonly name = 'dlocal_go' as const;

  override supportsCurrency(currency: EventTicketCurrency): boolean {
    return currency === 'UYU' || currency === 'USD' || currency === 'ARS';
  }

  async initiatePayout(
    params: InitiatePayoutParams,
  ): Promise<InitiatePayoutResult> {
    const ccy = params.payoutMethodCurrency;
    const summary = `Pago a ${params.accountHolderName} ${params.accountHolderSurname} · dLocal (v3) · ${params.amount} ${ccy} · ${params.payoutType}.`;
    return {instructions: {summary}};
  }

  async processPayout(
    params: ProcessPayoutParams,
  ): Promise<ProcessPayoutResult> {
    const remitter = this.getRemitter();

    if (params.payoutType === 'uruguayan_bank') {
      const m = UruguayanBankMetadataSchema.parse(params.payoutMethodMetadata);
      const {id, raw} = await this.sendUruguayPayout(params, m, remitter);
      return {
        status: 'completed' as PayoutStatus,
        externalId: String(id),
        providerExecutionHints: dLocalPayoutFxHintsFromResponse(raw),
      };
    }

    if (params.payoutType === 'argentinian_bank') {
      const m = ArgentinianBankMetadataSchema.parse(
        params.payoutMethodMetadata,
      );
      const {id, raw} = await this.sendArgentinaPayout(params, m, remitter);
      return {
        status: 'completed' as PayoutStatus,
        externalId: String(id),
        providerExecutionHints: dLocalPayoutFxHintsFromResponse(raw),
      };
    }

    const _e: never = params.payoutType;
    return _e;
  }

  private getRemitter(): Record<string, unknown> {
    if (
      !DLOCAL_PAYOUT_REMITTER_FIRST_NAME ||
      !DLOCAL_PAYOUT_REMITTER_LAST_NAME
    ) {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.DLOCAL_PAYOUT_REMITTER_NOT_CONFIGURED,
      );
    }
    const docId = DLOCAL_PAYOUT_REMITTER_DOCUMENT_ID;
    if (!docId) {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.DLOCAL_PAYOUT_REMITTER_NOT_CONFIGURED,
      );
    }
    return {
      first_name: DLOCAL_PAYOUT_REMITTER_FIRST_NAME,
      last_name: DLOCAL_PAYOUT_REMITTER_LAST_NAME,
      nationality: DLOCAL_PAYOUT_REMITTER_NATIONALITY,
      ...(DLOCAL_PAYOUT_REMITTER_EMAIL
        ? {email: DLOCAL_PAYOUT_REMITTER_EMAIL}
        : {}),
      ...(DLOCAL_PAYOUT_REMITTER_PHONE
        ? {phone: DLOCAL_PAYOUT_REMITTER_PHONE}
        : {}),
      document: {
        type: DLOCAL_PAYOUT_REMITTER_DOCUMENT_TYPE,
        id: docId,
      },
    };
  }

  private async sendUruguayPayout(
    params: ProcessPayoutParams,
    meta: UruguayanBankMetadata,
    remitter: Record<string, unknown>,
  ) {
    const bankCode = mapUruguayanBankNameToDLocalCode(meta.bankName);
    const beneficiary: Record<string, unknown> = {
      first_name: params.accountHolderName,
      last_name: params.accountHolderSurname,
      bank_account: {
        code: bankCode,
        type: 'CHECKING',
        account: meta.accountNumber,
      },
    };
    if (DLOCAL_PAYOUT_REMITTER_EMAIL) {
      beneficiary.email = DLOCAL_PAYOUT_REMITTER_EMAIL;
    }
    const raw = (await submitDLocalPayout({
      external_id: `rv_payout_u_${params.payoutId}`,
      payment_method_id: 'BANK_TRANSFER',
      flow_type: 'B2C',
      country: 'UY',
      currency: params.payoutMethodCurrency,
      currency_to_pay: params.payoutMethodCurrency,
      amount: params.amount,
      purpose: PURPOSE,
      statement_descriptor: DESCRIPTOR,
      description: PURPOSE_DESCRIPTION,
      on_hold: false,
      notification_url: this.notificationUrlForPayouts(),
      beneficiary,
      remitter,
    } as unknown as Record<string, unknown>)) as Record<string, unknown>;
    return {id: String(raw.id ?? ''), raw};
  }

  private async sendArgentinaPayout(
    params: ProcessPayoutParams,
    meta: ReturnType<typeof ArgentinianBankMetadataSchema.parse>,
    remitter: Record<string, unknown>,
  ) {
    const metaPayout = PayoutMetadataSchema.parse(params.payoutMetadata);
    const legacyLock = (
      metaPayout as unknown as {
        dLocalArRateLock?: {quoteId?: string};
      }
    ).dLocalArRateLock;
    const quoteId =
      metaPayout.fxSnapshot?.quoteId ?? legacyLock?.quoteId ?? undefined;

    const doc = meta.document;
    const docType =
      doc.type === 'DNI' ? 'DNI' : doc.type === 'CUIT' ? 'CUIT' : 'CUIL';

    const beneficiary: Record<string, unknown> = {
      first_name: params.accountHolderName,
      last_name: params.accountHolderSurname,
      document: {type: docType, id: doc.id},
    };
    if (DLOCAL_PAYOUT_REMITTER_EMAIL) {
      beneficiary.email = DLOCAL_PAYOUT_REMITTER_EMAIL;
    }
    if (meta.routing === 'cbu_cvu') {
      beneficiary.bank_account = {
        code: meta.bankCode,
        type: 'CHECKING',
        account: meta.accountNumber,
      };
    } else {
      beneficiary.bank_account = {
        code: '000',
        type: 'CHECKING',
        account: meta.alias,
      };
    }

    const body: Record<string, unknown> = {
      external_id: `rv_payout_a_${params.payoutId}`,
      payment_method_id: 'BANK_TRANSFER',
      flow_type: 'B2C',
      country: 'AR',
      purpose: PURPOSE,
      statement_descriptor: DESCRIPTOR,
      description: PURPOSE_DESCRIPTION,
      on_hold: false,
      notification_url: this.notificationUrlForPayouts(),
      beneficiary,
      remitter,
    };
    if (params.payoutMethodCurrency === 'ARS' && quoteId) {
      body.quote_id = quoteId;
      body.currency = 'USD';
      body.currency_to_pay = 'ARS';
      body.amount = params.amount;
    } else {
      body.currency = 'USD';
      body.currency_to_pay = 'USD';
      body.amount = params.amount;
    }
    const raw = (await submitDLocalPayout(
      body as unknown as Record<string, unknown>,
    )) as Record<string, unknown>;
    return {id: String(raw.id ?? ''), raw};
  }

  private notificationUrlForPayouts() {
    if (DLOCAL_PAYOUT_NOTIFICATION_URL) {
      return DLOCAL_PAYOUT_NOTIFICATION_URL;
    }
    return `${String(API_BASE_URL).replace(/\/$/, '')}/api/webhooks/dlocal/payouts`;
  }

  async getPayoutStatus(_externalId: string): Promise<PayoutStatusResult> {
    return {status: 'pending' as PayoutStatus, rawStatus: 'UNKNOWN'};
  }

  normalizeStatus(providerStatus: string): PayoutStatus {
    const s = (providerStatus || '').toUpperCase();
    if (s.includes('PENDING') || s === '100') {
      return 'pending' as PayoutStatus;
    }
    if (s.includes('REJECTED') || s.includes('CANCEL') || s.includes('FAIL')) {
      return 'failed' as PayoutStatus;
    }
    if (s.includes('CONFIRMED') || s === '200' || s === '2') {
      return 'completed' as PayoutStatus;
    }
    return 'pending' as PayoutStatus;
  }
}
