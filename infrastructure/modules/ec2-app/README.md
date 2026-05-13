# `ec2-app` module

Single Graviton EC2 + EIP + dedicated EBS data volume + IAM instance profile,
ready to run the [Revendiste Docker Compose stack](../../../deploy) under SSM.

Used in:

- **dev** (today) — with `create_db_credentials_secret = true` so the module
  generates a Postgres password and writes a Secrets Manager secret. Postgres
  runs in a Docker container on the data volume.
- **prod** (Phase 5) — with `create_db_credentials_secret = false` and
  `db_credentials_secret_arn` set to the ARN of the existing RDS-backed
  secret. No Postgres container; the backend talks to RDS via the in-VPC
  endpoint.

## Why a dedicated data volume

Postgres data and the Docker image cache live on
`aws_ebs_volume.data` mounted at `/var/lib/docker`. Instance-type changes
(e.g. `t4g.small → t4g.medium` when scrape jobs need more RAM) replace the
EC2 — `aws_volume_attachment.data` detaches and re-attaches the volume to the
new instance, so Postgres data survives. `user-data.sh.tftpl` only formats the
volume when no filesystem is present (first attach).

## Inputs that change per environment

| Variable                       | Dev                          | Prod (planned)                   |
| ------------------------------ | ---------------------------- | -------------------------------- |
| `create_db_credentials_secret` | `true`                       | `false`                          |
| `db_credentials_secret_arn`    | (ignored)                    | RDS module's existing secret ARN |
| `db_host`                      | `postgres` (compose service) | RDS endpoint                     |
| `instance_type`                | `t4g.small` (default)        | `t4g.medium` (decide at Phase 5) |
| `data_volume_size_gb`          | `50`                         | `30` (no in-VM Postgres) — TBD   |
| `app_hostname`                 | `dev.revendiste.com`         | `revendiste.com`                 |

## Bootstrap flow (cold boot)

1. AWS launches the instance with the user-data script.
2. The script installs Docker + Compose, mounts the data volume at
   `/var/lib/docker`, writes `/opt/revendiste/runtime.env`, registers the
   `revendiste.service` systemd unit, and enables it (without starting it).
3. The deploy workflow (`.github/workflows/deploy-dev-ec2.yml`) ships the
   `deploy/` files (`docker-compose.dev.yml`, `Caddyfile`,
   `scripts/bootstrap-env.sh`) via `aws ssm send-command`, then
   `systemctl start revendiste.service`.
4. The systemd unit runs `bootstrap-env.sh` to fetch
   `DB_CREDENTIALS_JSON` + `BACKEND_SECRETS_JSON` from Secrets Manager into
   `/opt/revendiste/.env` (`chmod 600`), logs in to ECR, and runs
   `docker compose up -d`.
5. The backend container's `backend-entrypoint.sh` parses the JSON blobs,
   runs `kysely migrate:latest` against the in-VM Postgres, then starts the
   API. With `ENABLE_INPROCESS_CRONJOBS=true` (set in the compose file),
   `apps/backend/src/server.ts` schedules all six cronjobs via `node-cron`.

## Backups

None. Dev data is disposable (`kysely migrate:latest` recreates the schema on
every backend boot, dev rows are throwaway). Prod will reuse this same module
but it talks to RDS, which has its own automated backups + PITR — the data
volume on prod EC2 only holds the Docker image cache, also not worth
snapshotting. If a real recovery need ever appears, add it deliberately rather
than carrying always-on backup machinery for hypothetical future cases.

## Why not in `infrastructure/environments/development/main.tf` directly

So Phase 5 (prod) can re-use the same module by toggling
`create_db_credentials_secret` and pointing at the existing RDS secret —
without a second copy of the EC2/EIP/SG/IAM/EBS resource graph drifting.
