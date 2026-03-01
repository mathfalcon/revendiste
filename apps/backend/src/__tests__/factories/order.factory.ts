import type {Insertable} from 'kysely';
import type {Orders} from '@revendiste/shared';

type OrderFactoryOverrides = Partial<Insertable<Orders>>;

let counter = 1;

export function createOrder(
  overrides: OrderFactoryOverrides = {},
): Insertable<Orders> {
  const id = (overrides.id as string | undefined) ?? `order-${counter++}`;
  const now = new Date();
  const reservationExpiresAt =
    overrides.reservationExpiresAt ??
    new Date(now.getTime() + 10 * 60 * 1000);
  return {
    id,
    userId: overrides.userId ?? 'user-1',
    eventId: overrides.eventId ?? 'event-1',
    status: overrides.status ?? 'pending',
    totalAmount: overrides.totalAmount ?? '107.32',
    subtotalAmount: overrides.subtotalAmount ?? '100',
    platformCommission: overrides.platformCommission ?? '6',
    vatOnCommission: overrides.vatOnCommission ?? '1.32',
    currency: overrides.currency ?? 'UYU',
    reservationExpiresAt,
    confirmedAt: overrides.confirmedAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
    ...overrides,
  };
}

export function createPendingOrder(
  overrides: OrderFactoryOverrides = {},
): Insertable<Orders> {
  return createOrder({status: 'pending', ...overrides});
}

export function createConfirmedOrder(
  overrides: OrderFactoryOverrides = {},
): Insertable<Orders> {
  return createOrder({
    status: 'confirmed',
    confirmedAt: new Date(),
    cancelledAt: null,
    ...overrides,
  });
}

export function resetOrderFactory(): void {
  counter = 1;
}
