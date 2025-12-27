import {PayoutMethodsRepository} from '~/repositories';
import {NotFoundError, ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {
  UruguayanBankPayoutMethodSchema,
  PayPalPayoutMethodSchema,
  type UruguayanBankMetadata,
  type PayPalMetadata,
  type JsonValue,
} from '@revendiste/shared';
import {logger} from '~/utils';
import type {EventTicketCurrency} from '@revendiste/shared';

interface AddPayoutMethodParams {
  userId: string;
  payoutType: 'uruguayan_bank' | 'paypal';
  accountHolderName: string;
  accountHolderSurname: string;
  currency: EventTicketCurrency;
  metadata: UruguayanBankMetadata | PayPalMetadata;
  isDefault?: boolean;
}

interface UpdatePayoutMethodParams {
  accountHolderName?: string;
  accountHolderSurname?: string;
  currency?: EventTicketCurrency;
  // metadata is validated in the service layer using the existing payout method's payoutType
  metadata?: unknown;
  isDefault?: boolean;
}

export class PayoutMethodsService {
  constructor(
    private readonly payoutMethodsRepository: PayoutMethodsRepository,
  ) {}

  /**
   * Validates payout method metadata using Zod discriminated union schema
   */
  validatePayoutMethodMetadata(
    payoutType: 'uruguayan_bank' | 'paypal',
    metadata: unknown,
  ): UruguayanBankMetadata | PayPalMetadata {
    if (payoutType === 'uruguayan_bank') {
      // Validate using the full payout method schema, then extract metadata
      const result = UruguayanBankPayoutMethodSchema.safeParse({
        type: 'uruguayan_bank',
        metadata,
      });
      if (!result.success) {
        throw new ValidationError(
          `Invalid uruguayan_bank metadata: ${result.error.message}`,
        );
      }
      return result.data.metadata;
    }

    if (payoutType === 'paypal') {
      // Validate using the full payout method schema, then extract metadata
      const result = PayPalPayoutMethodSchema.safeParse({
        type: 'paypal',
        metadata,
      });
      if (!result.success) {
        throw new ValidationError(
          `Invalid paypal metadata: ${result.error.message}`,
        );
      }
      return result.data.metadata;
    }

    throw new ValidationError(`Unsupported payout type: ${payoutType}`);
  }

  /**
   * Add payout method (MVP: only uruguayan_bank)
   * Validates metadata with Zod
   */
  async addPayoutMethod(params: AddPayoutMethodParams) {
    const {userId, payoutType, metadata, isDefault = false, ...rest} = params;

    // Validate metadata using Zod
    const validatedMetadata = this.validatePayoutMethodMetadata(
      payoutType,
      metadata,
    );

    // Create payout method (don't set isDefault yet - we'll handle it after creation)
    const payoutMethod = await this.payoutMethodsRepository.create({
      userId,
      payoutType,
      ...rest,
      isDefault: false, // Always create as non-default first
      metadata: validatedMetadata as unknown as JsonValue,
    });

    // If setting as default, set it as default after creation
    if (isDefault) {
      await this.payoutMethodsRepository.setDefault(userId, payoutMethod.id);
    } else {
      // If this is the first payout method, set it as default automatically
      const existingMethods = await this.payoutMethodsRepository.getByUserId(
        userId,
      );
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

  /**
   * Update payout method
   */
  async updatePayoutMethod(
    payoutMethodId: string,
    userId: string,
    updates: UpdatePayoutMethodParams,
  ) {
    const payoutMethod = await this.payoutMethodsRepository.getById(
      payoutMethodId,
    );
    if (!payoutMethod) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_METHOD_NOT_FOUND);
    }

    if (payoutMethod.userId !== userId) {
      throw new ValidationError(PAYOUT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    // Validate metadata if provided
    let validatedMetadata: JsonValue | undefined;
    if (updates.metadata) {
      const validated = this.validatePayoutMethodMetadata(
        payoutMethod.payoutType,
        updates.metadata,
      );
      validatedMetadata = validated as unknown as JsonValue;
    }

    // Extract isDefault from updates to handle separately
    const {isDefault, ...updateFields} = updates;

    // Update payout method (don't set isDefault yet - we'll handle it after update)
    const updated = await this.payoutMethodsRepository.update(payoutMethodId, {
      ...updateFields,
      metadata: validatedMetadata,
      isDefault: false, // Always update as non-default first
    });

    // If setting as default, set it as default after update
    if (isDefault) {
      await this.payoutMethodsRepository.setDefault(userId, payoutMethodId);
    }

    logger.info('Payout method updated', {
      payoutMethodId,
      userId,
    });

    return updated;
  }

  /**
   * Delete payout method
   */
  async deletePayoutMethod(payoutMethodId: string, userId: string) {
    const payoutMethod = await this.payoutMethodsRepository.getById(
      payoutMethodId,
    );
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

  /**
   * Get payout methods for user
   */
  async getPayoutMethods(userId: string) {
    return await this.payoutMethodsRepository.getByUserId(userId);
  }

  /**
   * Get default payout method for user
   */
  async getDefaultPayoutMethod(userId: string) {
    return await this.payoutMethodsRepository.getDefault(userId);
  }
}
