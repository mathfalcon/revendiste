import {PayoutMethodsRepository} from '~/repositories';
import {NotFoundError, ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {isDLocalGoPayoutsEnabled} from '~/lib/feature-flags';
import {
  UruguayanBankPayoutMethodSchema,
  ArgentinianBankPayoutMethodSchema,
  type EventTicketCurrency,
  type JsonValue,
  type PayoutType,
} from '@revendiste/shared';
import {logger} from '~/utils';

type UruguayanAdd = {
  userId: string;
  payoutType: 'uruguayan_bank';
  accountHolderName: string;
  accountHolderSurname: string;
  currency: EventTicketCurrency;
  metadata: unknown;
  isDefault?: boolean;
};

type ArgentinianAdd = {
  userId: string;
  payoutType: 'argentinian_bank';
  accountHolderName: string;
  accountHolderSurname: string;
  currency: EventTicketCurrency;
  metadata: unknown;
  isDefault?: boolean;
};

type AddPayoutMethodParams = UruguayanAdd | ArgentinianAdd;

interface UpdatePayoutMethodParams {
  accountHolderName?: string;
  accountHolderSurname?: string;
  currency?: EventTicketCurrency;
  metadata?: unknown;
  isDefault?: boolean;
}

function validatePayoutMethodMetadata(
  payoutType: PayoutType,
  metadata: unknown,
) {
  if (payoutType === 'uruguayan_bank') {
    const result = UruguayanBankPayoutMethodSchema.safeParse({
      type: 'uruguayan_bank',
      metadata,
    });
    if (!result.success) {
      throw new ValidationError(
        `Formato de datos de banco (Uruguay) inválido: ${String(result.error)}`,
      );
    }
    return result.data.metadata;
  }
  if (payoutType === 'argentinian_bank') {
    const result = ArgentinianBankPayoutMethodSchema.safeParse({
      type: 'argentinian_bank',
      metadata,
    });
    if (!result.success) {
      throw new ValidationError(
        `Formato de datos de banco (Argentina) inválido: ${String(result.error)}`,
      );
    }
    return result.data.metadata;
  }
  const _e: never = payoutType;
  return _e;
}

export class PayoutMethodsService {
  constructor(
    private readonly payoutMethodsRepository: PayoutMethodsRepository,
  ) {}

  async addPayoutMethod(params: AddPayoutMethodParams) {
    if (params.payoutType === 'argentinian_bank') {
      const enabled = await isDLocalGoPayoutsEnabled(params.userId);
      if (!enabled) {
        throw new ValidationError(
          PAYOUT_ERROR_MESSAGES.DLOCAL_GO_PAYOUTS_DISABLED,
        );
      }
    }

    const {userId, metadata, isDefault = false, ...rest} = params;
    const payoutType: PayoutType = params.payoutType;

    const validatedMetadata = validatePayoutMethodMetadata(
      payoutType,
      metadata,
    );

    const currency = (
      rest as {currency: EventTicketCurrency; accountHolderName: string}
    ).currency;
    if (
      payoutType === 'uruguayan_bank' &&
      currency !== 'UYU' &&
      currency !== 'USD'
    ) {
      throw new ValidationError('La moneda debe ser UYU o USD');
    }
    if (
      payoutType === 'argentinian_bank' &&
      currency !== 'ARS' &&
      currency !== 'USD'
    ) {
      throw new ValidationError('La moneda debe ser ARS o USD');
    }

    const accountHolderName = (
      rest as {accountHolderName: string; accountHolderSurname: string}
    ).accountHolderName;
    const accountHolderSurname = (
      rest as {accountHolderName: string; accountHolderSurname: string}
    ).accountHolderSurname;

    const payoutMethod = await this.payoutMethodsRepository.create({
      userId,
      payoutType,
      accountHolderName,
      accountHolderSurname,
      currency,
      isDefault: false,
      metadata: validatedMetadata as unknown as JsonValue,
    });

    if (isDefault) {
      await this.payoutMethodsRepository.setDefault(userId, payoutMethod.id);
    } else {
      const existingMethods =
        await this.payoutMethodsRepository.getByUserId(userId);
      if (existingMethods.length === 1) {
        await this.payoutMethodsRepository.setDefault(userId, payoutMethod.id);
      }
    }

    logger.info('Payout method added', {
      payoutMethodId: payoutMethod.id,
      userId,
      payoutType,
    });

    return payoutMethod;
  }

  async updatePayoutMethod(
    payoutMethodId: string,
    userId: string,
    updates: UpdatePayoutMethodParams,
  ) {
    const payoutMethod =
      await this.payoutMethodsRepository.getById(payoutMethodId);
    if (!payoutMethod) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_METHOD_NOT_FOUND);
    }

    if (payoutMethod.userId !== userId) {
      throw new ValidationError(PAYOUT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    if (payoutMethod.payoutType === 'argentinian_bank') {
      const enabled = await isDLocalGoPayoutsEnabled(userId);
      if (!enabled) {
        throw new ValidationError(
          PAYOUT_ERROR_MESSAGES.DLOCAL_GO_PAYOUTS_DISABLED,
        );
      }
    }

    if (updates.currency) {
      if (payoutMethod.payoutType === 'uruguayan_bank') {
        if (updates.currency !== 'UYU' && updates.currency !== 'USD') {
          throw new ValidationError('La moneda debe ser UYU o USD');
        }
      } else {
        if (updates.currency !== 'ARS' && updates.currency !== 'USD') {
          throw new ValidationError('La moneda debe ser ARS o USD');
        }
      }
    }

    let validatedMetadata: JsonValue | undefined;
    if (updates.metadata) {
      const validated = validatePayoutMethodMetadata(
        payoutMethod.payoutType,
        updates.metadata,
      );
      validatedMetadata = validated as unknown as JsonValue;
    }

    const {isDefault, ...updateFields} = updates;

    const updated = await this.payoutMethodsRepository.update(payoutMethodId, {
      ...updateFields,
      metadata: validatedMetadata,
      isDefault: false,
    });

    if (isDefault) {
      await this.payoutMethodsRepository.setDefault(userId, payoutMethodId);
    }

    logger.info('Payout method updated', {
      payoutMethodId,
      userId,
    });

    return updated;
  }

  async deletePayoutMethod(payoutMethodId: string, userId: string) {
    const payoutMethod =
      await this.payoutMethodsRepository.getById(payoutMethodId);
    if (!payoutMethod) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_METHOD_NOT_FOUND);
    }

    if (payoutMethod.userId !== userId) {
      throw new ValidationError(PAYOUT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    await this.payoutMethodsRepository.delete(payoutMethodId);

    logger.info('Payout method deleted', {
      payoutMethodId,
      userId,
    });
  }

  async getPayoutMethods(userId: string) {
    return await this.payoutMethodsRepository.getByUserId(userId);
  }

  async getDefaultPayoutMethod(userId: string) {
    return await this.payoutMethodsRepository.getDefault(userId);
  }
}
