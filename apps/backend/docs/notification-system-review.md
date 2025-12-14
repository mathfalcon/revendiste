# Notification System Architecture Review

## Executive Summary

The notification system is **well-architected** with good separation of concerns, type safety, and clean integration with the transactional package. However, there are several **scalability and reliability concerns** that should be addressed for production use at scale.

## ✅ Strengths

### 1. **Architecture & Separation of Concerns**

- ✅ Clean service layer (`NotificationService`)
- ✅ Repository pattern for data access
- ✅ Provider abstraction (`IEmailProvider`) allows easy swapping
- ✅ Template builder separates email rendering logic
- ✅ Helper functions provide convenient APIs

### 2. **Type Safety**

- ✅ Discriminated unions for notification types
- ✅ Shared schemas in `@revendiste/shared` package
- ✅ Type-safe metadata parsing with Zod validation
- ✅ Type-safe template props

### 3. **Transactional Package Integration**

- ✅ Clean separation: React Email templates in separate package
- ✅ No React in backend (renders to HTML in transactional package)
- ✅ Type-safe template mapping
- ✅ Reusable across monorepo

### 4. **Database Design**

- ✅ Proper enum types for status, channel, type
- ✅ JSONB for flexible metadata/actions
- ✅ Soft deletes for audit trail
- ✅ Proper indexing (assumed, verify)

### 5. **Retry Mechanism**

- ✅ Cron job for processing pending notifications
- ✅ Status tracking (pending → sent/failed)
- ✅ Error message storage

## ⚠️ Issues & Recommendations

### 1. **Critical: Fire-and-Forget Pattern Risk**

**Current Implementation:**

```typescript
// Send through configured channels (fire-and-forget)
this.sendNotification(notification.id).catch(error => {
  logger.error('Failed to send notification', {...});
});
```

**Problem:**

- If the process crashes before `sendNotification` completes, notification stays in `pending` forever
- No guarantee of delivery
- Silent failures

**Recommendation:**

- **Option A (Recommended)**: Use a message queue (BullMQ, RabbitMQ, AWS SQS)

  ```typescript
  // Create notification
  const notification = await this.notificationsRepository.create({...});

  // Enqueue for processing
  await notificationQueue.add('send-notification', {
    notificationId: notification.id
  });

  return notification;
  ```

- **Option B**: At minimum, ensure `sendNotification` is awaited in a background worker
  ```typescript
  // Still fire-and-forget, but more reliable
  setImmediate(() => {
    this.sendNotification(notification.id).catch(error => {
      logger.error('Failed to send notification', {...});
    });
  });
  ```

### 2. **Scalability: Sequential Processing in Cron Job**

**Current Implementation:**

```typescript
for (const notification of pending) {
  try {
    await this.sendNotification(notification.id);
  } catch (error) {
    // ...
  }
}
```

**Problem:**

- Processes notifications sequentially (one at a time)
- With 100 notifications, could take minutes
- Doesn't scale with volume

**Recommendation:**

```typescript
// Process in parallel batches
const BATCH_SIZE = 10;
for (let i = 0; i < pending.length; i += BATCH_SIZE) {
  const batch = pending.slice(i, i + BATCH_SIZE);
  await Promise.allSettled(
    batch.map(notification => this.sendNotification(notification.id)),
  );
}
```

### 3. **Performance: Synchronous Email Rendering**

**Current Implementation:**

```typescript
const {html, text} = await buildEmailTemplate(...);
await this.emailProvider.sendEmail({...});
```

**Problem:**

- React Email rendering is CPU-intensive
- Blocks the event loop during rendering
- Could cause timeouts in high-traffic scenarios

**Recommendation:**

- Move rendering to background worker/queue
- Or use worker threads for rendering:

  ```typescript
  import {Worker} from 'worker_threads';

  // Render in worker thread
  const html = await renderInWorker(Component, props);
  ```

### 4. **Reliability: No Exponential Backoff**

**Current Implementation:**

- Cron job retries every 5 minutes
- No backoff strategy
- Could spam failed notifications

**Recommendation:**

```typescript
// Add retry count and exponential backoff
async getPendingNotifications(limit: number = 100) {
  return await this.db
    .selectFrom('notifications')
    .selectAll()
    .where('status', '=', 'pending')
    .where('deletedAt', 'is', null)
    // Don't retry too frequently
    .where('createdAt', '<', new Date(Date.now() - 5 * 60 * 1000))
    // Limit retry attempts
    .where(eb => eb.or([
      eb('retryCount', 'is', null),
      eb('retryCount', '<', 5)
    ]))
    .orderBy('createdAt', 'asc')
    .limit(limit)
    .execute();
}
```

### 5. **Data Integrity: Manual JSON Stringification**

**Current Implementation:**

```typescript
actions: data.actions ? JSON.stringify(data.actions) : null,
metadata: data.metadata ? JSON.stringify(data.metadata) : null,
```

**Problem:**

- Kysely should handle JSONB automatically
- Manual stringification is error-prone
- Inconsistent with other repositories

**Recommendation:**

```typescript
// Let Kysely handle JSONB
actions: data.actions ?? null,
metadata: data.metadata ?? null,
```

### 6. **Missing: Rate Limiting**

**Problem:**

- No rate limiting per user/channel
- Could spam users with notifications
- No protection against abuse

**Recommendation:**

```typescript
// Add rate limiting check
async createNotification(params: CreateNotificationParams) {
  // Check rate limits
  const recentCount = await this.notificationsRepository
    .getRecentCountByUser(params.userId, '5 minutes');

  if (recentCount > 10) {
    throw new ValidationError('Rate limit exceeded');
  }

  // ... rest of logic
}
```

### 7. **Missing: Circuit Breaker**

**Problem:**

- If email provider fails, all notifications fail
- No circuit breaker to prevent cascading failures

**Recommendation:**

```typescript
class EmailProviderWithCircuitBreaker implements IEmailProvider {
  private circuitBreaker = new CircuitBreaker(
    this.provider.sendEmail.bind(this.provider),
    {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    }
  );

  async sendEmail(params: {...}) {
    return this.circuitBreaker.fire(params);
  }
}
```

### 8. **Missing: Metrics & Monitoring**

**Problem:**

- No metrics for notification delivery rates
- No monitoring of email provider health
- Hard to debug issues

**Recommendation:**

```typescript
// Add metrics
import {metrics} from '~/utils/metrics';

async sendEmailNotification(...) {
  const startTime = Date.now();
  try {
    await this.emailProvider.sendEmail({...});
    metrics.increment('notifications.email.sent');
    metrics.timing('notifications.email.duration', Date.now() - startTime);
  } catch (error) {
    metrics.increment('notifications.email.failed');
    throw error;
  }
}
```

### 9. **Transaction Safety: External API Calls**

**Current Implementation:**

- Notification creation happens in transaction (if called from one)
- Email sending happens outside transaction ✅ (correct)

**Status:** ✅ Already follows best practice

### 10. **Dynamic React Import Performance**

**Current Implementation:**

```typescript
const React = await import('react');
```

**Problem:**

- Dynamic import on every email render
- Could be optimized

**Recommendation:**

- Pre-import React at module level (if possible)
- Or use a worker pool for rendering

## 📊 Scalability Assessment

### Current Capacity

- **Low-Medium Volume**: ✅ Works well (< 1000 notifications/hour)
- **High Volume**: ⚠️ Will struggle (> 10,000 notifications/hour)
- **Very High Volume**: ❌ Needs queue system (> 100,000 notifications/hour)

### Bottlenecks

1. Sequential cron processing
2. Synchronous email rendering
3. No batching
4. No rate limiting
5. No horizontal scaling support

## 🎯 Priority Recommendations

### High Priority (Before Production)

1. ✅ **Add message queue** for reliable delivery
2. ✅ **Fix JSON stringification** (let Kysely handle it)
3. ✅ **Add parallel processing** in cron job
4. ✅ **Add exponential backoff** for retries

### Medium Priority (Scale to 10k+/hour)

5. ⚠️ **Add rate limiting** per user/channel
6. ⚠️ **Add circuit breaker** for email provider
7. ⚠️ **Move rendering to worker threads**
8. ⚠️ **Add metrics/monitoring**

### Low Priority (Scale to 100k+/hour)

9. 📝 **Consider dedicated notification service**
10. 📝 **Add horizontal scaling support**
11. 📝 **Add notification preferences/per-user settings**

## ✅ Transactional Package Integration

The integration with the transactional package is **excellent**:

1. **Clean Separation**: React Email templates in separate package
2. **Type Safety**: Type-safe props and metadata
3. **No React in Backend**: Renders to HTML in transactional package
4. **Reusable**: Can be used across monorepo
5. **Maintainable**: Easy to add new templates

**Minor Optimization:**

- Consider pre-rendering common templates
- Cache rendered templates for identical metadata

## Conclusion

The notification system is **well-designed** for small to medium scale applications. For production at scale, implement the high-priority recommendations, especially the message queue for reliable delivery.

**Overall Grade: B+**

- Architecture: A
- Type Safety: A+
- Scalability: C+
- Reliability: B
- Integration: A
