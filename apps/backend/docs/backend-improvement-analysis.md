# Backend Improvement Analysis

Analysis of `apps/backend` (Express/TSOA, Kysely, PostgreSQL). References use paths under `apps/backend/src/` unless noted.

---

## 1. Structure & Architecture

### 1.1 Folder layout and flow

- **controllers/** – TSOA route handlers; most delegate to services. Some (e.g. `identity-verification`, `webhooks`) do extra work (validation, metadata).
- **services/** – Business logic; orchestrate repositories and external APIs. One service may use several repositories.
- **repositories/** – Extend `BaseRepository<T>`, implement `withTransaction(trx)`. Data access only; no HTTP or errors in principle.
- **db/** – Kysely setup, migrations. Types come from `@revendiste/shared` (generated from DB).
- **config/** – `env.ts` (Zod-validated env), `logging.ts`. No circular dependency with app code.

Flow: **Request → routes.ts (generated) → controller → service → repository(ies) → DB.** Error handler and middleware are in `middleware/`.

### 1.2 Pattern violations and boundaries

- **Repositories throwing domain errors**  
`EventsRepository` throws `NotFoundError` in:
  - `getEventByIdWithTicketWaves` (line 550: `'Event not found'`),
  - `getEventByIdForListing` (846), `updateEvent` (870), `softDeleteEvent` (895) (`'Evento no encontrado'`).  
  Documented pattern: “Services throw errors”; repositories should return `null`/empty and let the service decide and throw. **Files:** `repositories/events/index.ts`.
- **Controller-level validation and hardcoded errors**  
`IdentityVerificationController` does manual checks and throws `BadRequestError` with inline Spanish messages (`'Documento es requerido'`, `'Tipo de documento inválido o faltante'`, etc.) instead of using `~/constants/error-messages`. **File:** `controllers/identity-verification/index.ts` (e.g. 137, 144, 220, 272).
- **WebhooksController wiring**  
`controllers/webhooks/index.ts` builds a large object graph at module load (repos, notification service, ticket-listings service, seller-earnings service, `PaymentWebhookAdapter`). This is a single place of coupling and makes testing and future provider additions heavier. Consider DI or a small factory.

### 1.3 Circular dependencies

- No circular imports detected. Repositories do not import services; services import repositories; controllers import services (and in webhooks case, also construct adapters that use services).

---

## 2. Error Handling & Validation

### 2.1 How errors become HTTP

- **Central handler:** `middleware/errorHandler.ts`.  
  - Maps `ValidateError` (TSOA) → 422 + `message`, `details`.  
  - Maps `ZodError` → `ZodValidationError` (422).  
  - Maps `AppError` subclasses → `error.statusCode` and JSON body (`error`, `message`, `statusCode`, `timestamp`, `path`, `method`; `metadata` for `ValidationError`; optional `stack` in development).  
  - Non-`AppError` (e.g. DB, JWT) are normalized to 401/500 and logged.
- **Custom errors:** `errors/index.ts` defines `BadRequestError`, `NotFoundError`, `ValidationError`, etc., with `statusCode` and optional `metadata`.

### 2.2 Validation

- **Zod at controller:** Many routes use `@ValidateBody(Schema)` and controller-level validation schemas in `*/validation.ts` (e.g. `orders`, `ticket-listings`, `payouts`, `webhooks`). Error messages often come from `~/constants/error-messages`.
- **Manual checks in controllers:** e.g. identity-verification (`!file`, `documentType`), with hardcoded Spanish messages instead of constants.

### 2.3 Gaps and inconsistencies

- **Hardcoded error messages (not from constants):**  
  - `controllers/identity-verification/index.ts`: `'Documento es requerido'`, `'Tipo de documento inválido o faltante'`, Face Liveness message.  
  - `services/admin-events/index.ts`: `'Tanda de tickets no encontrada'`, `'No se subió ningún archivo'`, `'Error al subir la imagen'`, `'Imagen no encontrada'`.  
  - `services/admin-identity-verification/index.ts`: `'Usuario no encontrado'`, `'Imagen no encontrada'`, and validation strings.  
  - `services/identity-verification/index.ts`: `'User not found'` (English).  
  - `services/payout-documents/index.ts`: `'Error al crear el registro del documento'`, `'Documento no encontrado'`, `'Error al eliminar el documento'`, etc.  
  - `repositories/events/index.ts`: mix of `'Event not found'` and `'Evento no encontrado'`.
- **Repositories throwing:** Same as §1.2; prefer returning `null` and letting the service throw with messages from constants.
- **Clerk webhook validation failure:** `validateClerkWebhook.ts` returns `res.status(400).json({})` with an empty body. No error message or code for clients or logs.
- **ValidateError response shape:** Error handler returns `message` + `details` for TSOA `ValidateError`, while `AppError` responses use `error` (class name), `message`, `statusCode`, etc. Frontend may need to handle two shapes.

### 2.4 Swallowed or under-reported errors

- **optionalAuthMiddleware** (`middleware/auth.ts`): On failure to get/create user it logs and continues without `req.user`. Acceptable for “optional” auth, but it logs with both `logger.warn` and `logger.error` (line 37–38); one level is enough.
- **Webhook fire-and-forget:** DLocal and Clerk webhook handlers do not await processing; failures are only logged (e.g. `WebhooksService`, `PaymentWebhookAdapter`). No retry or dead-letter mechanism in code; acceptable if another system handles retries.

---

## 3. Security

### 3.1 Auth and middleware

- **Clerk:** `optionalAuthMiddleware` and `requireAuthMiddleware` use `@clerk/express` and populate `req.user` via `UsersService.getOrCreateUser`.  
- **Admin:** `middleware/admin.ts` checks `req.user?.role === 'admin'` and uses `ADMIN_ERROR_MESSAGES.ADMIN_ONLY` from constants.

### 3.2 Webhook signature validation

- **dLocal:** `middleware/validateDLocalWebhook.ts`: HMAC-SHA256 with `ApiKey + payload`, constant-time compare (`crypto.timingSafeEqual`). **Issue:** On failure it logs `receivedSignature`, `expectedSignature`, and full `payload` (lines 57–61). Logging the expected signature and full payload is a security and privacy risk; log only that validation failed and optionally a non-sensitive identifier (e.g. `payment_id`).
- **Clerk:** `middleware/validateClerkWebhook.ts` uses Svix `Webhook.verify(JSON.stringify(req.body), headers)`. No logging of body on failure; 400 with empty body (see §2.3).

### 3.3 Input and injection

- **SQL:** Kysely parameterized queries used; no raw SQL with user input concatenation observed. Low SQL injection risk.
- **Secrets:** `config/env.ts` uses Zod and does not log secrets. DLocal uses `DLOCAL_API_KEY`, `DLOCAL_SECRET_KEY` from env.

### 3.4 CORS and rate limiting

- **CORS:** Configured in `server.ts` with explicit origins (localhost, revendiste.com, etc.), `credentials: true`, and restricted methods/headers.
- **Rate limiting:** No application-level rate limiting (e.g. express-rate-limit) found. Only scraping services have their own `rateLimit` (e.g. `services/scraping/base/config.ts`). API routes are not rate-limited; consider adding for auth, payments, and webhooks.

---

## 4. Database & Transactions

### 4.1 Where transactions are used

- **executeTransaction / withTransaction** used in:
  - **Payment webhook flow:** `PaymentWebhookAdapter` (orders, reservations, listings, payments, seller earnings) – three blocks (e.g. confirm, reject, expire).
  - **Orders:** `OrdersService.createOrder`, `cancelOrder` (orders + items + reservations).
  - **Orders cleanup:** `orders/cleanup.ts` (expire orders + release reservations).
  - **Payments:** `PaymentsService` (create payment + payment event; order update + reservations in one path).
  - **Payouts:** `PayoutsService` (payout + earnings + payout events; and update flows).
  - **Seller earnings:** `SellerEarningsService` (earnings + reservations).
  - **Cron:** `sync-payments-and-expire-orders.ts` (expire orders; confirm payments + orders + reservations).
  - **Ticket documents:** `TicketDocumentsRepository` (document + listing ticket update).

Transactions are scoped to a single flow; no long-held transactions wrapping external HTTP calls.

### 4.2 External calls and transaction boundaries

- Payment provider calls (e.g. DLocal) are done outside transaction boundaries (e.g. payment creation in `PaymentsService`). Consistent with “no network inside transaction” guidance.

### 4.3 Rollback

- Kysely transactions roll back on throw. No explicit try/finally that could swallow errors; failures propagate.

### 4.4 N+1 and indexes

- **N+1:** Many list/detail endpoints use Kysely `jsonObjectFrom` / `jsonArrayFrom` in a single query (e.g. events with ticket waves, listings with tickets). Good. Some code paths (e.g. notifications, cron) loop and query per item; worth checking if any list is large.
- **Indexes:** Not re-verified against migrations. Patterns like `getByPaymentId`, `getByUserId`, pagination `orderBy`/`limit`/`offset` assume appropriate indexes; recommend auditing high-traffic and cron queries against actual indexes.

### 4.5 Soft deletes

- Events: `deletedAt` and `status = 'inactive'`; repository filters with `where('deletedAt', 'is', null)`. Ticket/listings and related tables use `deletedAt` consistently in queries. No obvious mix of soft-delete and hard-delete for the same entity.

---

## 5. External Integrations

### 5.1 Payment (DLocal)

- **Provider:** `services/dlocal/index.ts` – axios client, env-based URL and keys. No explicit timeout in the grep; recommend setting `timeout` and `maxRedirects`.
- **Adapter:** `PaymentWebhookAdapter` normalizes provider data, applies status transitions, and runs DB updates in transactions. Errors are logged and rethrown; webhook handler does not await (fire-and-forget), so provider sees quick 200.

### 5.2 Retries and idempotency

- **Retries:** No generic retry (e.g. axios-retry) or backoff in DLocal or payment service. Cron `sync-payments-and-expire-orders` and payment sync tolerate individual failures and log.
- **Idempotency:** Payment events are logged (e.g. `logWebhookReceived`, `logStatusChange`). Processing is keyed by `paymentId` and status transitions; duplicate webhooks may be applied again if logic is not idempotent (e.g. “already in this status” short-circuit). Recommend explicit idempotency (e.g. by provider event id or payment_id + status) and documenting intended behavior.

### 5.3 Webhook handling

- **DLocal:** Controller does not await `handleDLocalPaymentWebhook`; service calls `dlocalAdapter.processWebhook(...).then(...).catch(...)`. Response is sent immediately; processing is async. Matches fire-and-forget guidance.
- **Clerk:** Same pattern: controller calls `handleClerkWebhook` without await, service uses `.then`/`.catch`. Good.

### 5.4 Other integrations

- **Notifications:** Email (Resend) and in-app; failures logged in provider and in notification service. Batch processing in cron uses per-item error handling.
- **Exchange rates:** Provider abstraction and cache TTL from env; failures logged and fallback used where implemented.

---

## 6. Testing & Maintainability

### 6.1 Test patterns

- **Location:** `__tests__/services/` (orders, payments, payment-webhook-adapter, payouts, seller-earnings), `__tests__/utils/fees.test.ts`, `__tests__/factories/` (user, order), `__tests__/setup.ts`.
- **Style:** Service tests mock repositories (e.g. `executeTransaction`, `withTransaction`, `getById`, `create`) with Jest. No direct DB in these tests. Factories build plain objects for payloads.

### 6.2 Hard-to-test areas

- **WebhooksController:** Large construction at module load and no DI; testing would require either exporting a test double or refactoring to inject adapter/service.
- **optionalAuthMiddleware:** Depends on Clerk and `UsersService`; integration or E2E would be more realistic than unit.

### 6.3 Dead code and duplication

- **Magic numbers/strings:** Some limits (e.g. 10 tickets, 100 payments per sync run) are inline. Consider constants (e.g. `constants/orders.ts`, `constants/reservation.ts` already used elsewhere).
- **Duplication:** Similar error handling in multiple services (e.g. “not found then throw”); could be a small helper. Payment status handling in the adapter is a single place but complex; already a good candidate for tests.

### 6.4 Loose types

- `**as any` / `any`:** Used in: `PaymentWebhookAdapter` (`metadata`, `payment`, normalizers), `repositories/orders/index.ts` (`updateData`), `repositories/notifications/index.ts` (retryCount), `repositories/payment-events/index.ts` (fromStatus/toStatus), `middleware/pagination.ts` (query), `services/health/index.ts` (checks), `services/admin-identity-verification/index.ts` (metadata/confidenceScores), `services/dlocal/index.ts` (error), and in tests for mocks. Tightening these (e.g. proper enums for status, typed metadata) would improve safety and refactors.

---

## 7. Performance & Observability

### 7.1 Logging

- **Winston** in `utils/logger.ts`; level and transports from `config/logging.ts`. Format: timestamp, level, message, plus metadata (safe stringify, circular handling). Morgan streams to logger for HTTP.
- **Consistency:** Many services log with `logger.info`/`logger.error` and an object (e.g. `paymentId`, `orderId`). Some use `logger.warn` for validation/auth. No structured “request id” or correlation id (see below).

### 7.2 Request ID / correlation

- No `x-request-id` or correlation id is set or propagated in middleware. For tracing and support, consider adding a request-scoped id and including it in logs and error responses.

### 7.3 Pagination and heavy operations

- **Paginated:** Events (public and admin), notifications, admin payouts, admin identity verifications, payouts history, seller earnings (cron). Uses `paginationMiddleware` and `PaginationOptions`.
- **Unbounded lists:** `getMyOrders`, `getMyListings`, `getOrderTickets` return all for the user. For users with many orders/listings this can grow; consider pagination or a cap.

### 7.4 Caching

- Exchange rates: cache TTL from env. No in-memory or Redis cache for hot read paths (e.g. event by id, ticket waves). Acceptable if traffic is low; consider caching for high-read endpoints.

---

## 8. Documentation & DX

### 8.1 README and env

- **README:** `apps/backend/README.md` describes architecture, TSOA, controllers/services/repositories, validation, errors, DB, migrations, health, pagination. Some examples reference “examples” and port 4000; actual app uses different resources and port (e.g. 3001). Updating examples and port would reduce confusion.
- **Env:** `config/env.ts` documents variables via Zod schema and comments. No `.env.example` in the paths seen; adding one (with dummy/placeholder values) would help onboarding.

### 8.2 API docs (Swagger)

- TSOA generates `swagger/swagger.json` and routes; Swagger UI is registered. Response types use named types (e.g. `GetOrderTicketsResponse`), which keeps the spec readable.

### 8.3 Type safety

- **Shared types:** `@revendiste/shared` for DB and shared domain types. Payment provider interface uses `[key: string]: any` for provider-specific fields; acceptable for adapters but could be narrowed where possible.
- **Loose types:** See §6.4; reducing `any` and using enums (e.g. from `~/types/db`) would improve DX and safety.

---

## Summary: High-impact and risk-focused items


| Priority   | Area          | Action                                                                                                                                                                                                       |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **High**   | Security      | Stop logging `expectedSignature` and full `payload` in dLocal webhook validation failure (`validateDLocalWebhook.ts`).                                                                                       |
| **High**   | Errors        | Move all user-facing error messages to `constants/error-messages.ts` (identity-verification, admin-events, admin-identity-verification, payout-documents, identity-verification service, events repository). |
| **High**   | Boundaries    | Stop throwing `NotFoundError` (and similar) from `EventsRepository`; return `null` and let services throw using constants.                                                                                   |
| **Medium** | Security      | Add rate limiting for API routes (auth, payments, webhooks).                                                                                                                                                 |
| **Medium** | Validation    | Return a clear body (and log) on Clerk webhook verification failure instead of `400` with `{}`.                                                                                                              |
| **Medium** | API           | Add pagination or a safe limit for `getMyOrders`, `getMyListings`.                                                                                                                                           |
| **Medium** | Observability | Add request/correlation id middleware and include it in logs and error responses.                                                                                                                            |
| **Medium** | Integrations  | Document or implement idempotency for payment webhooks; consider retries/timeouts for DLocal.                                                                                                                |
| **Low**    | DX            | Add `.env.example`; align README examples and port with real app.                                                                                                                                            |
| **Low**    | Types         | Replace critical `any`/`as any` (payment adapter, payment-events, orders repo) with proper types/enums.                                                                                                      |


---

## Done well

- Clear controller → service → repository flow; TSOA and Zod for routes and validation.
- Centralized error classes and handler.
- Webhooks fire-and-forget (return 200 quickly so dLocal/Clerk do not timeout) and dLocal signature verification with constant-time compare. Payment webhook idempotency: duplicate "paid" webhooks are handled by returning early when the order is already confirmed. Indexes reviewed: critical query patterns (orders by user, payments by order, listings by user) are covered by existing migrations.
- CORS and env validation.
- Kysely transactions used in the right places without wrapping external calls.
- Many list endpoints paginated.
- Error constants used in payments, orders, ticket-listings, payouts, and notifications.

