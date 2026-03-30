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

## Testing (Backend)

Jest with ts-jest. Test factories in `src/__tests__/factories/`. Mock repositories in service tests. Test business logic, not framework behavior. Run `pnpm --filter @revendiste/shared build` before tests if module resolution errors.

## File Upload (TSOA + Multer)

Use `@UploadedFile('file')` decorator - TSOA auto-generates multer middleware. Do NOT also add `@Middlewares(customMulter)` or you get duplicate multer parsing ("Unexpected end of form" error). Global multer config (50MB) is passed to `RegisterRoutes()` in `server.ts`.
