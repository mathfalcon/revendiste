# Rollback to ECS

The single-EC2 migration is intentionally reversible: the old ECS Fargate +
ALB + EventBridge + Bastion modules still live under
[`infrastructure/modules/`](../infrastructure/modules) and the legacy
deploy workflows (`deploy-dev.yml`, `deploy-production.yml`,
`toggle-dev-environment.yml`) remain in
[`.github/workflows/`](../.github/workflows) — they're set to
`workflow_dispatch` only so they don't fire automatically.

This doc describes how to roll back **dev** and **prod** independently.

---

## Dev rollback (after the gate has destroyed dev RDS)

Reality check: dev data is **disposable** in the new architecture (no
backups, no snapshots — see [`deploy/README.md`](../deploy/README.md)). A dev
rollback re-creates the ECS-era infrastructure and starts from an empty
schema, then `kysely migrate:latest` runs on the next backend boot.

If you genuinely need a populated dev DB (rare), seed it manually from a
sanitized prod RDS snapshot **before** running the rollback.

If dev rollback is what you want:

1. **Recreate dev RDS** — re-add `module "rds"` to
   [`infrastructure/environments/development/main.tf`](../infrastructure/environments/development/main.tf)
   from the pre-migration commit (search git log for "dev RDS" in this PR's
   parent commit). `terraform apply`.
2. **Recreate dev IAM, ALB, ECS, Bastion, Service Discovery, cronjobs,
   EventBridge policy** the same way. `terraform apply` again. The module
   sources are unchanged.
3. **Repoint Cloudflare DNS** — set the `cloudflare_dns` module inputs back
   to `alb_dns_name = module.alb.alb_dns_name` /
   `acm_certificate_domain_validation_options =
module.alb.acm_certificate_domain_validation_options`, drop `origin_ip`.
   `terraform apply`.
4. **Re-enable the legacy deploy:** edit
   [`.github/workflows/deploy-dev.yml`](../.github/workflows/deploy-dev.yml)
   to remove the `workflow_dispatch:` only trigger and restore the
   `push: branches: [development]` trigger from git history. Push. The
   first deploy will run `kysely migrate:latest` against the new dev RDS.
5. **Stop the new EC2 stack** so traffic doesn't hit two backends:
   `terraform destroy -target=module.ec2_app` in dev. (This deletes the
   Postgres-in-Docker volume — fine, dev data was disposable.)
6. **Rerun the audit workflow** afterwards
   (`.github/workflows/audit-dev-vpc.yml` with `delete=true`) so any new
   resources you accidentally created are cleaned up.

This rollback intentionally takes effort. The whole point of the migration was
to escape ECS dev costs; a one-click rollback would imply we hadn't really
moved.

---

## Prod rollback (during the cutover overlap)

Phase 5 keeps the prod ECS modules in place until at least 7 days after a
healthy EC2 cutover. During that window prod rollback is fast:

1. **Cloudflare DNS:** flip `module "cloudflare_dns"` in
   [`infrastructure/environments/production/main.tf`](../infrastructure/environments/production/main.tf)
   back to `alb_dns_name = module.alb.alb_dns_name` /
   `acm_certificate_domain_validation_options = module.alb.acm_certificate_domain_validation_options`,
   drop `origin_ip`. `terraform apply`.
2. **Scale prod ECS services back up** in Terraform (or directly via
   `aws ecs update-service ... --desired-count 1`) — they were left at
   `desired_count = 0` post-cutover, not destroyed.
3. **Re-enable prod EventBridge cron rules** that drive ECS RunTask:

   ```bash
   for rule in revendiste-prod-sync-payments revendiste-prod-notify-upload \
              revendiste-prod-check-payout revendiste-prod-scrape-events \
              revendiste-prod-process-notifications revendiste-prod-process-pending-jobs; do
     aws events enable-rule --name "$rule" --region sa-east-1
   done
   ```

4. **Verify the prod RDS security group still allows ECS:** the ECS tasks SG
   ingress rule on RDS was kept during the cutover (we only added an extra
   ingress for the prod `app_compute` SG). Confirm via:

   ```bash
   aws ec2 describe-security-groups \
     --filters Name=group-name,Values=revendiste-prod-rds-sg \
     --query 'SecurityGroups[0].IpPermissions[?FromPort==`5432`]'
   ```

5. **Re-enable the legacy deploy workflow:** restore the `release: [published]`
   trigger in
   [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml)
   from git history (it was set to `workflow_dispatch` only at cutover) and
   push.
6. **Stop the prod EC2 stack:** `terraform destroy -target=module.ec2_app` in
   prod (or temporarily set the EC2 to stopped via the AWS console). Do not
   delete the EBS data volume if you anticipate retrying the cutover —
   `aws_volume_attachment.data` has `skip_destroy = true` so the volume
   itself survives.

Prod rollback should take **<10 minutes** end-to-end during the overlap
window. After the overlap window expires (and the prod ALB module is finally
removed for cost reasons), prod rollback becomes a longer reapply just like
the dev case above.

---

## What to delete only after a long stable window

Both environments are designed so the most expensive AWS Fargate / ALB /
EventBridge resources can be deleted in a follow-up commit once you trust the
EC2 stack:

- **Dev:** legacy modules already deleted as part of this migration.
- **Prod:** `module.alb`, `module.ecs`, `module.cronjobs`,
  `module.service_discovery`, `module.bastion` — leave for at least 7 days
  after cutover, then remove in a focused PR. After that the rollback path
  becomes "reapply prior commit" rather than "scale services up", so plan the
  PR carefully.

Note: there are **no app-level backups** owned by this migration (no DLM
snapshots, no logical dumps to R2). Prod still has RDS automated backups +
PITR. Dev data is disposable. If a future business need calls for explicit
backup machinery here, add it deliberately rather than carrying always-on
infrastructure for hypothetical recoveries.
