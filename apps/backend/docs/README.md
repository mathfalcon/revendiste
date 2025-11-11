# Backend Documentation

Welcome to the Revendiste backend documentation! This directory contains comprehensive guides for understanding and working with the system.

---

## 📚 Documentation Index

### Core Documentation

1. **[Payment System Overview](./payment-system-overview.md)**
   - Architecture and design patterns
   - Payment flow diagrams
   - Database schema
   - Transaction safety
   - Critical edge cases

2. **[Adding Payment Providers](./adding-payment-providers.md)**
   - Step-by-step guide for new providers
   - Code examples (Stripe, PayPal)
   - Testing strategies
   - Common pitfalls

3. **[Security & Compliance](./security-and-compliance.md)**
   - Security features explained
   - Why we track IP & User Agent
   - Fraud detection strategies
   - Compliance requirements (PCI-DSS, GDPR, SOC 2)
   - Incident response procedures

---

## 🚀 Quick Start

### For New Developers

1. Read [Payment System Overview](./payment-system-overview.md) first
2. Understand the [Security & Compliance](./security-and-compliance.md) requirements
3. If adding a new provider, follow [Adding Payment Providers](./adding-payment-providers.md)

### For Product Managers

- Focus on "Payment Flow" section in [Payment System Overview](./payment-system-overview.md)
- Review "Critical Edge Cases Handled" for business logic understanding
- Check "Future Enhancements" for roadmap planning

### For Security Auditors

- Start with [Security & Compliance](./security-and-compliance.md)
- Review "Immutable Audit Log" and "IP Tracking" sections
- Check incident response procedures

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────┐
│            Frontend (React)             │
│    TanStack Router + React Query        │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│          API Controllers                │
│    (TSOA + Express)                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          Services Layer                 │
│  • PaymentsService (Orchestration)      │
│  • OrdersService                        │
│  • EventsService                        │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┬──────────────┐
      ▼                 ▼              ▼
┌──────────┐    ┌──────────────┐  ┌──────────┐
│ dLocal   │    │ Repositories │  │  Other   │
│ Provider │    │   (Kysely)   │  │ Providers│
└──────────┘    └──────────────┘  └──────────┘
                        │
                        ▼
                ┌──────────────┐
                │  PostgreSQL  │
                │  (Database)  │
                └──────────────┘
```

---

## 🔑 Key Concepts

### Provider Pattern
- Abstraction layer for payment providers
- Easy to add new providers (Stripe, PayPal, etc.)
- Standardized types across providers

### Immutable Audit Log
- `payment_events` table records all changes
- Cannot be modified or deleted
- Complete forensic trail

### Transaction Safety
- ACID guarantees for related operations
- External API calls outside transactions
- Repository pattern for consistency

### Security First
- Webhook signature validation
- IP & User Agent tracking
- Amount validation
- Fraud detection

---

## 📊 Database Tables

### `payments`
Current state of each payment with complete details.

### `payment_events`
**Immutable** audit log of all payment activity.

### `orders`
Customer orders with reservation tracking.

### `order_items`
Individual tickets in each order.

### `order_ticket_reservations`
Ticket reservations with expiration.

---

## 🛠️ Common Tasks

### View Payment Audit Trail
```sql
SELECT * FROM payment_events
WHERE payment_id = 'your-payment-id'
ORDER BY created_at ASC;
```

### Find Failed Payments
```sql
SELECT * FROM payments
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '24 hours';
```

### Check Webhook History
```sql
SELECT * FROM payment_events
WHERE event_type = 'webhook_received'
ORDER BY created_at DESC
LIMIT 100;
```

### Detect Suspicious IPs
```sql
SELECT ip_address, COUNT(*) as attempts
FROM payment_events pe
JOIN payments p ON p.id = pe.payment_id
WHERE p.status = 'failed'
AND pe.created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10;
```

---

## 🚨 Important Notes

### DO ✅
- Always validate webhook signatures
- Log all payment events
- Use transactions for related DB operations
- Return webhooks immediately (fire-and-forget)
- Store complete provider responses

### DON'T ❌
- Never store card details
- Never skip webhook validation
- Never modify payment_events records
- Never put API calls inside transactions
- Never hard delete payment records

---

## 📞 Support

For questions or issues:

1. Check the relevant documentation file
2. Review payment_events logs for debugging
3. Check provider's official documentation
4. Contact the team

---

## 🔄 Keeping Documentation Updated

When making significant changes:

1. Update relevant documentation files
2. Add examples if introducing new patterns
3. Update diagrams if architecture changes
4. Document any new security considerations

---

## 📈 Metrics & Monitoring

Key metrics to track:

- **Payment Success Rate**
- **Average Processing Time**
- **Failed Payment Reasons**
- **Webhook Delivery Success**
- **Suspicious IP Activity**
- **Provider Response Times**

See [Security & Compliance](./security-and-compliance.md) for monitoring queries.

---

## 🎯 Future Documentation Needed

- [ ] API endpoint reference
- [ ] Error codes and handling
- [ ] Rate limiting strategies
- [ ] Refund process documentation
- [ ] Deployment procedures
- [ ] Disaster recovery plan

---

## 📝 Contributing

When adding documentation:

1. Use clear, concise language
2. Include code examples
3. Add diagrams where helpful
4. Link to related documentation
5. Keep formatting consistent

---

## 🔗 External Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kysely Documentation](https://kysely.dev/)
- [TSOA Documentation](https://tsoa-community.github.io/docs/)
- [dLocal API Docs](https://docs.dlocalgo.com/)
- [Stripe API Docs](https://stripe.com/docs/api)

---

**Last Updated:** January 2024  
**Maintained By:** Engineering Team


