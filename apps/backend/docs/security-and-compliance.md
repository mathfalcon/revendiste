# Security & Compliance

## Overview

The payment system implements multiple security layers to protect against fraud, ensure compliance, and maintain data integrity.

---

## Security Features

### 1. Webhook Signature Validation

**Purpose:** Prevent unauthorized webhook calls and ensure authenticity.

**Implementation:**
```typescript
// HMAC-SHA256 signature verification
const expectedSignature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(API_KEY + payload)
  .digest('hex');

if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
  throw new UnauthorizedError('Invalid webhook signature');
}
```

**Benefits:**
- ✅ Prevents webhook replay attacks
- ✅ Ensures webhooks come from legitimate provider
- ✅ Protects against man-in-the-middle attacks

---

### 2. IP Address & User Agent Tracking

**Purpose:** Security auditing, fraud detection, and compliance.

**What We Track:**
- **IP Address** - Source IP of every webhook/payment event
- **User Agent** - Client identification string
- **Timestamp** - Exact time of event

**Stored In:** `payment_events` table (immutable)

#### Why Track IP & User Agent?

##### A. Fraud Detection

**Scenario 1: Multiple Failed Payments from Same IP**
```sql
SELECT ip_address, COUNT(*) as failed_attempts
FROM payment_events pe
JOIN payments p ON p.id = pe.payment_id
WHERE p.status = 'failed'
  AND pe.created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10;
```

**Action:** Flag IP for review or temporarily block.

**Scenario 2: Suspicious Patterns**
```sql
-- Multiple different payment attempts from same IP
SELECT ip_address, COUNT(DISTINCT p.id) as unique_payments
FROM payment_events pe
JOIN payments p ON p.id = pe.payment_id
WHERE pe.created_at > NOW() - INTERVAL '10 minutes'
GROUP BY ip_address
HAVING COUNT(DISTINCT p.id) > 5;
```

##### B. Security Auditing

**Track Webhook Sources:**
```sql
-- Verify webhooks come from provider's IP range
SELECT ip_address, user_agent, COUNT(*)
FROM payment_events
WHERE event_type = 'webhook_received'
  AND ip_address NOT IN ('52.89.214.238', '34.212.75.30') -- dLocal IPs
GROUP BY ip_address, user_agent;
```

**Identify Anomalies:**
```sql
-- Find unusual user agents for webhooks
SELECT user_agent, COUNT(*)
FROM payment_events
WHERE event_type = 'webhook_received'
GROUP BY user_agent
ORDER BY COUNT(*) DESC;
```

##### C. Compliance Requirements

**PCI-DSS Requirement 10.2:**
> "Implement automated audit trails for all system components to reconstruct events"

**GDPR Article 32:**
> "Implement appropriate technical measures to ensure security"

**SOC 2 Type II:**
> "Logging of security-related events"

IP/User Agent tracking satisfies these requirements by providing:
- ✅ Complete audit trail
- ✅ Ability to investigate incidents
- ✅ Evidence for dispute resolution

##### D. Dispute Resolution & Chargebacks

When a customer disputes a charge:

```sql
-- Get complete payment history with sources
SELECT 
  pe.event_type,
  pe.created_at,
  pe.ip_address,
  pe.user_agent,
  pe.event_data
FROM payment_events pe
JOIN payments p ON p.id = pe.payment_id
WHERE p.provider_payment_id = 'DP-12345'
ORDER BY pe.created_at;
```

**Evidence Provided:**
- Timestamp of payment initiation
- IP address of customer
- User agent (device/browser used)
- Geographic location (derived from IP)
- Complete event sequence

This evidence helps:
- ✅ Prove legitimate transaction
- ✅ Identify fraudulent claims
- ✅ Win chargeback disputes

##### E. Rate Limiting & Abuse Prevention

```typescript
// Example: Rate limit payment attempts by IP
async function checkRateLimit(ipAddress: string): Promise<boolean> {
  const recentAttempts = await db
    .selectFrom('payment_events')
    .select(db.fn.count('id').as('count'))
    .where('ip_address', '=', ipAddress)
    .where('created_at', '>', new Date(Date.now() - 60000)) // Last minute
    .executeTakeFirst();

  return (recentAttempts?.count || 0) < 10; // Max 10 attempts per minute
}
```

---

### 3. Amount Validation

**Purpose:** Prevent payment tampering.

**Implementation:**
```typescript
// Validate payment amount matches order
if (Number(providerPayment.amount) !== Number(order.totalAmount)) {
  logger.error('Payment amount mismatch', {
    paymentId,
    orderId: order.id,
    paymentAmount: providerPayment.amount,
    orderAmount: order.totalAmount,
  });
  throw new ValidationError('Payment amount does not match order total');
}
```

**Prevents:**
- ❌ User paying less than order total
- ❌ Currency conversion attacks
- ❌ Amount manipulation in transit

---

### 4. Immutable Audit Log

**Purpose:** Complete, tamper-proof history of all payment events.

**Implementation:**
- `payment_events` table has NO update operations
- NO delete operations (records are permanent)
- Only INSERT operations allowed

**Benefits:**
- ✅ Complete audit trail
- ✅ Cannot be modified after creation
- ✅ Forensic analysis capability
- ✅ Compliance with financial regulations

**Example Audit Trail:**
```
Payment DP-12345:
  1. 2024-01-01 10:00:00 - payment_created (IP: 192.168.1.100)
  2. 2024-01-01 10:00:30 - webhook_received (IP: 52.89.214.238)
  3. 2024-01-01 10:00:31 - status_change: pending → processing
  4. 2024-01-01 10:01:15 - webhook_received (IP: 52.89.214.238)
  5. 2024-01-01 10:01:16 - status_change: processing → paid
```

---

### 5. Secure Credential Management

**Environment Variables Only:**
```bash
# .env (NEVER commit to git)
DLOCAL_API_KEY=your_api_key
DLOCAL_SECRET_KEY=your_secret_key
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Validation:**
```typescript
// Validated at startup
const envSchema = z.object({
  DLOCAL_API_KEY: z.string(),
  DLOCAL_SECRET_KEY: z.string(),
});

const env = envSchema.parse(process.env);
```

**Benefits:**
- ✅ Secrets never in source code
- ✅ Different keys per environment
- ✅ Easy rotation

---

### 6. Database-Level Security

#### Unique Constraints
```sql
-- Prevent duplicate payments from same provider
CREATE UNIQUE INDEX payments_provider_payment_id_unique
ON payments (provider, provider_payment_id);
```

#### Soft Deletes
```typescript
// Never hard delete payment records
async softDelete(id: string): Promise<void> {
  await this.db
    .updateTable('payments')
    .set({deletedAt: new Date()})
    .where('id', '=', id)
    .execute();
}
```

#### Foreign Key Constraints
```sql
-- Cascade deletes maintain referential integrity
FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
```

---

## Compliance

### PCI-DSS Compliance

**Our Responsibility:**
- ✅ Secure transmission to payment provider
- ✅ No storage of card data (provider handles this)
- ✅ Audit logging
- ✅ Access controls

**Provider's Responsibility:**
- Card data collection
- Card data storage
- PCI certification

### GDPR Compliance

**Personal Data Stored:**
- Customer email
- Customer name
- Customer document number (for some regions)
- IP address

**Rights Implemented:**
- **Right to Access:** Can query payment_events for user's data
- **Right to Erasure:** Soft delete with `deleted_at`
- **Right to Portability:** Can export payment data in JSON

**Data Retention:**
- Payment records: 7 years (financial regulations)
- Personal data: Can be anonymized after order completion

### SOC 2 Type II

**Controls Implemented:**
- ✅ Audit logging (payment_events)
- ✅ Access controls (authentication required)
- ✅ Encryption in transit (HTTPS)
- ✅ Incident response (error logging)

---

## Security Best Practices

### DO ✅

1. **Always validate webhook signatures**
2. **Log all payment events with IP/User Agent**
3. **Use HTTPS for all endpoints**
4. **Rotate API keys regularly**
5. **Monitor for suspicious patterns**
6. **Keep audit logs immutable**
7. **Validate amounts against orders**
8. **Use environment variables for secrets**
9. **Implement rate limiting**
10. **Review payment events regularly**

### DON'T ❌

1. **Never store card details**
2. **Never skip webhook validation**
3. **Never hard delete payment records**
4. **Never commit secrets to git**
5. **Never expose internal payment IDs**
6. **Never modify payment_events records**
7. **Never log sensitive card data**
8. **Never trust client-side amounts**
9. **Never process webhooks synchronously**
10. **Never ignore security alerts**

---

## Incident Response

### Suspected Fraud

1. **Identify Pattern:**
   ```sql
   SELECT ip_address, COUNT(*) FROM payment_events
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY ip_address HAVING COUNT(*) > 50;
   ```

2. **Block IP Temporarily:**
   - Add to rate limit blocklist
   - Review payment attempts
   
3. **Notify Provider:**
   - Report suspicious activity
   - Request additional verification

4. **Document Incident:**
   - Log in incident tracking system
   - Create payment_event record

### Webhook Compromise

1. **Rotate Webhook Secret Immediately**
2. **Review Recent Webhooks:**
   ```sql
   SELECT * FROM payment_events
   WHERE event_type = 'webhook_received'
   AND created_at > NOW() - INTERVAL '24 hours';
   ```
3. **Verify Payment States with Provider**
4. **Update Webhook Validation Logic**

### Data Breach

1. **Identify Scope:**
   - What data was accessed?
   - Which payments affected?
   
2. **Notify Affected Users** (GDPR requirement)

3. **Report to Authorities** (within 72 hours for GDPR)

4. **Audit and Remediate**

---

## Monitoring & Alerts

### Key Metrics to Monitor

```typescript
// Failed payment rate
const failedRate = (failedPayments / totalPayments) * 100;
if (failedRate > 10) {
  alert('High failure rate detected');
}

// Unusual IP activity
const suspiciousIPs = await db
  .selectFrom('payment_events')
  .select(['ip_address', db.fn.count('id').as('count')])
  .where('created_at', '>', recentTimeWindow)
  .groupBy('ip_address')
  .having(db.fn.count('id'), '>', 20);

// Webhook delivery failures
const webhookFailures = await db
  .selectFrom('payment_events')
  .select(db.fn.count('id').as('count'))
  .where('event_type', '=', 'webhook_received')
  .where('created_at', '>', lastHour)
  .executeTakeFirst();
```

### Recommended Alerts

1. **High failure rate** (>10%)
2. **Unusual IP activity** (>20 attempts/hour)
3. **Webhook validation failures**
4. **Payment amount mismatches**
5. **Multiple payments from same card**
6. **Geo-location anomalies**

---

## Regular Security Tasks

### Daily
- ✅ Review failed payments
- ✅ Check for unusual IP patterns

### Weekly
- ✅ Audit webhook validation failures
- ✅ Review rate limit blocks
- ✅ Check payment event logs

### Monthly
- ✅ Review access logs
- ✅ Update security documentation
- ✅ Test incident response procedures

### Quarterly
- ✅ Rotate API keys
- ✅ Security audit
- ✅ Compliance review
- ✅ Update dependencies

---

## Resources

- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)
- [GDPR Compliance](https://gdpr.eu/)
- [OWASP Payment Security](https://owasp.org/www-project-payment-security/)
- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)
- [dLocal Security](https://docs.dlocalgo.com/security)


