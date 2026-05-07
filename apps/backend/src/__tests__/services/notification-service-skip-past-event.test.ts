/**
 * Buyer notification skip when event date is in the past.
 */
import {shouldSkipBuyerNotificationForPastEvent} from '~/services/notifications/skip-notification-if-event-past';
import type {NotificationService} from '~/services/notifications';
import {
  notifyOrderExpired,
  notifyPaymentFailed,
} from '~/services/notifications/helpers';

describe('shouldSkipBuyerNotificationForPastEvent', () => {
  it('returns false when skip option is missing', () => {
    expect(shouldSkipBuyerNotificationForPastEvent(undefined)).toBe(false);
  });

  it('returns false when eventEndDate is null', () => {
    expect(shouldSkipBuyerNotificationForPastEvent({eventEndDate: null})).toBe(
      false,
    );
  });

  it('returns true when event ended before now', () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(shouldSkipBuyerNotificationForPastEvent({eventEndDate: past})).toBe(
      true,
    );
  });

  it('returns false when event ends in the future', () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(
      shouldSkipBuyerNotificationForPastEvent({eventEndDate: future}),
    ).toBe(false);
  });
});

describe('notifyOrderExpired / notifyPaymentFailed', () => {
  it('passes skipIfEventPast through to createNotification', async () => {
    const createNotification = jest.fn().mockResolvedValue(null);
    const svc = {createNotification} as unknown as NotificationService;
    const end = new Date('2020-01-01');

    await notifyOrderExpired(svc, {
      buyerUserId: 'u1',
      orderId: 'o1',
      eventName: 'E',
      eventEndDate: end,
    });

    await notifyPaymentFailed(svc, {
      buyerUserId: 'u1',
      orderId: 'o1',
      eventName: 'E',
      eventEndDate: end,
    });

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        skipIfEventPast: {eventEndDate: end},
        type: 'order_expired',
      }),
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        skipIfEventPast: {eventEndDate: end},
        type: 'payment_failed',
      }),
    );
  });
});
