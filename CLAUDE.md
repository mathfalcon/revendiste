# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Revendiste is a ticket resale marketplace. Full-stack TypeScript monorepo using pnpm workspaces + Turborepo.

- **Backend**: Express 5 + TSOA + PostgreSQL + Kysely
- **Frontend**: React 19 + TanStack Router (file-based, SSR via TanStack Start/Vinxi) + TanStack Query + Tailwind + shadcn/ui
- **Shared**: `@revendiste/shared` (Zod schemas, DB types, utils), `@revendiste/transactional` (React Email templates)
- **Auth**: Clerk
- **Payments**: dLocal Go
- **Storage**: Cloudflare R2 (S3-compatible), local in dev
- **Infra**: AWS (ECS Fargate, RDS Aurora Serverless v2), Terraform in `infrastructure/`

## Common Commands

```bash
# Development (backend + frontend)
pnpm dev

# Backend
cd apps/backend
pnpm tsoa:both                    # Regenerate routes + OpenAPI spec (after controller changes)
pnpm kysely migrate:make <name>   # Create migration (always use CLI, never manual timestamps)
pnpm kysely:migrate               # Run pending migrations
pnpm generate:db                  # Regenerate DB types to packages/shared/src/types/db.d.ts
pnpm test                         # Run all tests (Jest)
pnpm test -- --testPathPattern=orders         # Run tests matching pattern
pnpm test -- -t "should create order"         # Run tests matching description

# Frontend
cd apps/frontend
pnpm generate:api                 # Regenerate TypeScript API client from OpenAPI spec
pnpm type-check                   # TypeScript check
pnpm lint:fix                     # ESLint fix

# Transactional emails
cd packages/transactional
pnpm dev                          # Preview email templates on :3003
```

### After API Changes Workflow

1. `cd apps/backend && pnpm tsoa:both` (regenerate routes + spec)
2. `cd apps/frontend && pnpm generate:api` (regenerate TS client)

### After Migration Workflow

1. `cd apps/backend && pnpm kysely:migrate` (apply migration)
2. `cd apps/backend && pnpm generate:db` (regenerate types)

## Architecture

### Backend: Controller -> Service -> Repository

- **Controllers** (`src/controllers/{resource}/index.ts`): Thin - TSOA decorators, validation, delegate to services. Return type aliases must be named (`type GetOrderResponse = ReturnType<...>`).
- **Validation** (`src/controllers/{resource}/validation.ts`): Zod schemas wrapping body in `z.object({ body: ... })`. Export `{Name}RouteSchema` and `{Name}RouteBody`.
- **Services** (`src/services/{resource}/`): Business logic, orchestrate repositories, data enrichment. Throw custom errors (`NotFoundError`, `ValidationError`, etc.).
- **Repositories** (`src/repositories/{resource}/`): Kysely queries only. Extend `BaseRepository<T>`. Never type return types - let Kysely infer. Return `null` for not found (services throw).
- **Error messages**: All centralized in `src/constants/error-messages.ts`, grouped by domain, in Spanish.

### Frontend: Routes -> Features -> Components

- **Routes** (`src/routes/`): Thin - file-based TanStack Router. Handle loaders, auth, SEO, params. Delegate UI to features.
- **Features** (`src/features/`): Feature-specific logic and components.
- **Components** (`src/components/`): Reusable. `components/ui/` for shadcn/ui.
- **API** (`src/lib/api/`): Query options and mutations. Generated types in `generated.ts`.
- User-facing query params must be in Spanish (e.g., `subirTicket` not `uploadTicket`).
- Paginated APIs return `{ data: T[], pagination }`. Unwrap with `res.data.data` in query options.
- Forms: always use `react-hook-form` with `standardSchemaResolver` from `@hookform/resolvers/standard-schema` + Zod.
- Add shadcn components: `cd apps/frontend && pnpm dlx shadcn@latest add <component>`

### Notification System

Chain: DB enum migration -> Shared Zod schemas -> Text generation -> Helper function -> NotificationService -> Email template mapper -> React Email component.

See `.cursor/rules/notification-system.mdc` for full step-by-step guide on adding new notification types.

Key files: `packages/shared/src/schemas/notifications.ts`, `packages/shared/src/utils/notification-text.ts`, `apps/backend/src/services/notifications/helpers.ts`, `packages/transactional/src/email-templates.ts`

### Key Patterns

- **Transactions**: External API calls MUST be outside DB transactions. Use `this.executeTransaction()` from BaseRepository.
- **Webhooks**: Return immediately (fire-and-forget), process async. Always validate signatures.
- **Notifications**: Fire-and-forget with `.catch()`. Title/description auto-generated from metadata.
- **Kysely**: Use camelCase for all columns (CamelCase plugin). Use `jsonObjectFrom`/`jsonArrayFrom` with callback `select(eb => [...])` for subqueries. Use `.$notNull()` for guaranteed non-null. Use `Insertable<T>`/`Updateable<T>`. Never `JSON.stringify()` for JSONB. Never type return types explicitly.
- **API responses**: Nested structures for relationships (not flat). E.g., `{ event: { name, date } }` not `{ eventName, eventDate }`.
- **Background jobs**: Parallel batch processing with `Promise.allSettled()`. Exponential backoff for retries.
- **Soft deletes**: `deletedAt` timestamp column, filter with `.where('deletedAt', 'is', null)`.

### Infrastructure (Terraform)

All in `infrastructure/`. Core (shared DNS), environment folders (staging/production), reusable modules. Terraform Cloud for state. All resources tagged with Environment, Project, ManagedBy. See `.claude/skills/revendiste-infrastructure/SKILL.md` for full patterns.

## Logging & PostHog (OTel)

Canonical PostHog guidance: [Logging best practices](https://posthog.com/docs/logs/best-practices) and [Node installation](https://posthog.com/docs/logs/installation). Logs are system telemetry (retries, errors, latency); user behavior funnels belong in `posthog.capture()` / analytics.

### Stack (backend)

- **`apps/backend/src/lib/otel.ts`**: `NodeSDK` with `OTLPLogExporter` → PostHog **`https://us.i.posthog.com/i/v1/logs`** (override with `POSTHOG_OTLP_LOGS_URL`; EU: `https://eu.i.posthog.com/i/v1/logs`). Resource attributes: `service.name`, `deployment.environment`. **`NODE_ENV=local` skips PostHog entirely** (no SDK, no export). Elsewhere, `POSTHOG_KEY` (`phc_…`) is required to export; **`POSTHOG_OTEL_DEBUG`** enables diag + export tracing.
- **`apps/backend/src/utils/logger.ts`**: Winston → `OTelTransport` → `@opentelemetry/api-logs` `emit()`. Metadata from `logger.info('msg', { key: value })` becomes **log attributes**; non-scalars are `safeStringify`’d (PostHog recommends **scalars** where possible—prefer explicit fields over dumping objects).
- **`server.ts`**: Call **`initOtel()`** before other code logs at startup. Morgan HTTP lines use `logger.info` (skip `/api/health`).

### Alignment vs PostHog best practices

| Topic                                     | Status      | Notes                                                                                                                                                                                                               |
| ----------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Centralized logs (PostHog Logs)           | **Yes**     | When `POSTHOG_KEY` is set and `NODE_ENV` is not `local`, Winston logs export to PostHog.                                                                                                                            |
| Structured / queryable fields             | **Partial** | Use `logger.info('msg', { … })` with **scalar** attributes for best search. Objects become JSON strings in attributes.                                                                                              |
| Resource attributes (`service.name`, env) | **Yes**     | Set in `initOtel`. Consider adding `service.version` (e.g. git SHA) for release correlation.                                                                                                                        |
| Wide events (one rich log per request)    | **Gap**     | Much of the codebase emits many small `info` lines (startup, jobs). Prefer **one** outcome log with accumulated context on hot paths; keep step noise at **`debug`**.                                               |
| Log levels                                | **Partial** | `http` maps to OTel DEBUG2. Use **`error` / `warn` / `info` / `debug`** deliberately—`ERROR` should be actionable. Do not run `LOG_LEVEL=debug` in production by default.                                           |
| Trace + session context                   | **Gap**     | NodeSDK is logs-only (no trace provider). No automatic `posthog_distinct_id` / `session_id`—add **explicit** attributes where needed ([Session Replay linking](https://posthog.com/docs/logs/link-session-replay)). |
| Health noise                              | **Partial** | Morgan skips `/api/health`; apply the same idea to other noisy endpoints if needed.                                                                                                                                 |
| Sampling                                  | **Gap**     | No tail/head sampling yet—add when volume/cost requires it (Collector or app-level).                                                                                                                                |
| Security (secrets, bodies, PII)           | **Ongoing** | Never log tokens, passwords, or full request/response bodies. Errors already include `requestId`; avoid raw PII in log messages.                                                                                    |

### Conventions for new / changed code

1. **Structured search fields**: `logger.warn('payments.dlocal.timeout', { paymentId, orderId, durationMs })` with scalars.
2. **INFO** = durable outcomes; **DEBUG** = inner steps; **ERROR** = needs action or alerts.
3. Never log secrets (`phc_`, `phx_`, Clerk/dLocal keys) or full payloads.
4. Treat log **attribute names** like a small API—rename with care (saved searches / alerts).

## Testing (Backend)

Jest with ts-jest. Test factories in `src/__tests__/factories/`. Mock repositories in service tests. Test business logic, not framework behavior. Run `pnpm --filter @revendiste/shared build` before tests if module resolution errors.

## File Upload (TSOA + Multer)

Use `@UploadedFile('file')` decorator - TSOA auto-generates multer middleware. Do NOT also add `@Middlewares(customMulter)` or you get duplicate multer parsing ("Unexpected end of form" error). Global multer config (50MB) is passed to `RegisterRoutes()` in `server.ts`.
