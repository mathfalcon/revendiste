# Skill Registry — Revendiste

Generated: 2026-04-01

## Project Skills

| Skill | Trigger | Path |
|-------|---------|------|
| commit-message | Auto-generate commit message | .claude/skills/commit-message/SKILL.md |
| revendiste-infrastructure | Managing revendiste's infrastructure | .claude/skills/revendiste-infrastructure/SKILL.md |
| revendiste-notification-system | Using the notification system or sending notifications | .claude/skills/revendiste-notification-system/SKILL.md |
| revendiste-ux-writing | Writing or reviewing any user-facing text | .claude/skills/revendiste-ux-writing/SKILL.md |
| tanstack-react-router_api | TanStack Router API reference | .claude/skills/tanstack-react-router_api/SKILL.md |
| tanstack-react-router_guide | TanStack Router guides (auth, loaders, etc.) | .claude/skills/tanstack-react-router_guide/SKILL.md |
| tanstack-react-router_installation | TanStack Router installation/setup | .claude/skills/tanstack-react-router_installation/SKILL.md |
| tanstack-react-router_routing | TanStack Router routing patterns | .claude/skills/tanstack-react-router_routing/SKILL.md |
| ui-ux-pro-max | UI/UX design, styling, color palettes, typography | .claude/skills/ui-ux-pro-max/SKILL.md |

## Convention Files

| File | Description |
|------|-------------|
| CLAUDE.md | Project instructions, architecture, commands, patterns |

## Compact Rules

### revendiste-infrastructure
- All Terraform in `infrastructure/`. Core (shared DNS), environment folders, reusable modules.
- Terraform Cloud for state. All resources tagged with Environment, Project, ManagedBy.

### revendiste-notification-system
- Chain: DB enum migration → Shared Zod schemas → Text generation → Helper function → NotificationService → Email template mapper → React Email component.
- Key files: `packages/shared/src/schemas/notifications.ts`, `packages/shared/src/utils/notification-text.ts`, `apps/backend/src/services/notifications/helpers.ts`, `packages/transactional/src/email-templates.ts`

### revendiste-ux-writing
- Target: 18-35 year olds from Uruguay. Voice: confiable, directo, copado.
- Spanish (rioplatense). Not corporate, not a bot.

### commit-message
- Conventional commits format (feat, fix, chore, refactor, docs, etc.)
- Clear subject line (50-72 chars), detailed body if significant changes.

### tanstack-react-router
- File-based routing with TanStack Start/Vinxi SSR.
- Routes are thin: handle loaders, auth, SEO, params. Delegate UI to features.

### ui-ux-pro-max
- Tailwind 4 + shadcn/ui component library.
- Add components: `cd apps/frontend && pnpm dlx shadcn@latest add <component>`
