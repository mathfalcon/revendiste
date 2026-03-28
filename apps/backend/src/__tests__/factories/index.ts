/**
 * Test Factories
 *
 * Centralized exports for all test data factories.
 * Use factories to create mock entities with sensible defaults.
 *
 * @example
 * import { createUser, createOrder } from '../factories';
 *
 * const user = createUser({ email: 'custom@test.com' });
 * const order = createOrder({ userId: user.id });
 */

export * from './user.factory';
export * from './order.factory';
export * from './ticket-reports.factory';
