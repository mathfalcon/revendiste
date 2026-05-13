# `deploy/`

Artifacts consumed by the Revendiste single-EC2 "VPS" deployment defined in
[`infrastructure/modules/ec2-app`](../infrastructure/modules/ec2-app).

| File                       | Purpose                                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend.Dockerfile`       | Image used in dev (single VM) and prod (ECS today, EC2 Phase 5).                                                                                                                                                                                  |
| `frontend.Dockerfile`      | Image used in dev and prod.                                                                                                                                                                                                                       |
| `backend-entrypoint.sh`    | Parses `DB_CREDENTIALS_JSON` + `BACKEND_SECRETS_JSON`, runs migrations, then `node dist/src/server.js`.                                                                                                                                           |
| `docker-compose.dev.yml`   | Compose file for the dev EC2: `postgres` + `backend` + `frontend` + `caddy`.                                                                                                                                                                      |
| `Caddyfile`                | Reverse proxy: routes `/api*` → `backend:3001`, everything else → `frontend:3000`. TLS via `tls internal` (Cloudflare Full mode); switch to a Cloudflare Origin CA cert before going to production-grade end-to-end TLS (Cloudflare Full strict). |
| `scripts/bootstrap-env.sh` | Boot-time helper: pulls `DB_CREDENTIALS_JSON` and `BACKEND_SECRETS_JSON` from AWS Secrets Manager and writes `/opt/revendiste/.env` (`chmod 600`). Idempotent; runs from a systemd unit before `docker compose up`.                               |

> **No backups for dev Postgres.** Dev data is disposable — `kysely migrate:latest` runs on every backend boot, and dev rows are throwaway. If you ever need a populated dev DB, restore from a sanitized prod RDS snapshot manually via `aws ssm start-session` + `psql`.

## Secret contracts

`DB_CREDENTIALS_JSON` is the same shape that
[`infrastructure/modules/rds/main.tf`](../infrastructure/modules/rds/main.tf)
writes today, so [`backend-entrypoint.sh`](backend-entrypoint.sh) keeps working
unchanged:

```json
{
  "username": "revendiste_admin",
  "password": "<random>",
  "dbname": "revendiste",
  "host": "postgres",
  "port": 5432,
  "database_url": "postgresql://revendiste_admin:<random>@postgres:5432/revendiste"
}
```

For dev the `host` is `postgres` (the compose service name) and the password is
generated once during `terraform apply` of the `ec2-app` module — never
committed.

`BACKEND_SECRETS_JSON` continues to come from
[`infrastructure/modules/secrets`](../infrastructure/modules/secrets) unchanged.

## In-process cronjobs

The dev compose file sets `ENABLE_INPROCESS_CRONJOBS=true`, which makes
[`apps/backend/src/server.ts`](../apps/backend/src/server.ts) start all six
cronjobs via `node-cron` instead of relying on EventBridge → ECS RunTask. Each
job's helper uses `cron.schedule(...)` which by default skips a tick when the
previous run is still in flight, so we get per-job concurrency=1 for free —
important on the 2 GiB `t4g.small` where the scrape job must not stack up.

Production keeps `ENABLE_INPROCESS_CRONJOBS=false` until the Phase 5 cutover.
