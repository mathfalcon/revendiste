import type {JsonValue} from '@revendiste/shared';
import type {PayoutEventsRepository} from '~/repositories';

/**
 * Immutable audit row for raw provider responses (dLocal submit, etc.).
 * Call from provider integrations when you need a forensic trail.
 */
export async function logPayoutProviderResponse(
  payoutEventsRepository: PayoutEventsRepository,
  input: {
    payoutId: string;
    payload: unknown;
    createdBy?: string;
  },
) {
  await payoutEventsRepository.create({
    payoutId: input.payoutId,
    eventType: 'provider_response',
    eventData: {payload: input.payload} as JsonValue,
    createdBy: input.createdBy,
  });
}
