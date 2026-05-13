# Production Cutover Checklist (Phase 5)

Do **not** run this until [`docs/DEV_VALIDATION_GATE.md`](DEV_VALIDATION_GATE.md)
has been signed off and the dev EC2 has been stable for at least a few days.

## 0. Prep

- [ ] dev EC2 has been running cleanly for >= 3 days.
- [ ] Confirm the prod RDS Engine version major and the dev compose Postgres
      major still match (so the rollback story stays clean).
- [ ] Read [`docs/ROLLBACK_TO_ECS.md`](ROLLBACK_TO_ECS.md) end to end.
- [ ] Pick a low-traffic window. Cloudflare DNS TTL is set to "auto" — flip
      effective time is usually under a minute behind the proxy.

## 1. Terraform: enable the prod EC2 stack

In [`infrastructure/environments/production/main.tf`](../infrastructure/environments/production/main.tf)
uncomment the `module "ec2_app"` block (and the
`aws_security_group_rule.rds_from_prod_app_compute` resource that follows it).
Pick `instance_type` = `t4g.medium` or `t4g.large` based on what the dev EC2
has shown about Chromium memory pressure.

```bash
cd infrastructure/environments/production
terraform plan
# Review carefully — should be additive: EC2, EIP, SG, IAM profile, S3
# deploy-artifacts bucket, EBS data volume, RDS SG rule.
terraform apply
```

The legacy `module.alb`, `module.ecs`, `module.cronjobs`,
`module.service_discovery`, `module.bastion` stay untouched — both stacks
coexist during the overlap window.

## 2. Ship the deploy bundle and start the unit

```bash
gh workflow run deploy-production-ec2.yml -f confirm=CUTOVER
```

This builds + pushes prod images, uploads the `deploy/` tarball to
`s3://revendiste-prod-deploy-artifacts/`, sends the deploy command via SSM,
and probes `https://revendiste.com` **using a `--resolve` spoof against the
EIP** so it doesn't need Cloudflare DNS to be flipped yet.

Confirm the workflow's "Health check via direct EIP" step prints `200` for
both `/api/health` and `/`.

## 3. Pre-flight on the EIP before flipping DNS

From a laptop:

```bash
EIP=$(cd infrastructure/environments/production && terraform output -raw app_public_ip)
curl -sk --resolve revendiste.com:443:$EIP https://revendiste.com/api/health
curl -sk --resolve revendiste.com:443:$EIP https://revendiste.com/
```

- [ ] Both return `200`.
- [ ] Sign-up / login work end-to-end (Clerk session created against prod EC2,
      verified by tailing `journalctl -u revendiste -f` over SSM Session
      Manager).
- [ ] Trigger a small dLocal sandbox payment if possible; verify webhook
      lands at the new origin.
- [ ] `docker compose -f /opt/revendiste/docker-compose.dev.yml ps` shows all
      containers Healthy.

If anything is off, **abort here**: prod traffic is still on ECS via
Cloudflare. No customer impact yet.

## 4. Cloudflare DNS flip

Update `module "cloudflare_dns"` in
[`production/main.tf`](../infrastructure/environments/production/main.tf):

```hcl
module "cloudflare_dns" {
  source = "../../modules/cloudflare-dns"

  zone_name   = "revendiste.com"
  domain_name = var.domain_name
  origin_ip   = module.ec2_app.instance_public_ip
  # alb_dns_name + acm_certificate_domain_validation_options dropped.
  common_tags = local.common_tags
}
```

`terraform apply`. Watch `dig +short revendiste.com` from a few locations
until the EIP appears.

- [ ] `https://revendiste.com/api/health` returns `200` from a fresh device.
- [ ] CloudWatch shows traffic on the EC2 (ALB request count starts dropping).

## 5. Drain the legacy ECS stack

Once prod traffic is clearly going through the EC2:

```bash
aws ecs update-service --cluster revendiste-prod-cluster \
  --service revendiste-prod-backend --desired-count 0 --region sa-east-1
aws ecs update-service --cluster revendiste-prod-cluster \
  --service revendiste-prod-frontend --desired-count 0 --region sa-east-1
```

Pause the EventBridge prod cron rules so they don't try to RunTask against an
empty service:

```bash
for rule in revendiste-prod-sync-payments revendiste-prod-notify-upload \
            revendiste-prod-check-payout revendiste-prod-scrape-events \
            revendiste-prod-process-notifications revendiste-prod-process-pending-jobs; do
  aws events disable-rule --name "$rule" --region sa-east-1
done
```

Set `ENABLE_INPROCESS_CRONJOBS=true` in the prod backend's environment if you
want the in-process scheduler to take over (requires re-deploying the prod
backend with that env var). Otherwise leave the legacy cron disabled until you
have a separate decision on how prod cron should run on the EC2.

## 6. Watch the overlap window (>= 7 days)

- [ ] `docs/ROLLBACK_TO_ECS.md` "Prod rollback" path stays viable: ECS
      services scaled-to-0 (not destroyed), legacy ALB target groups
      unchanged, EventBridge rules disabled (not deleted),
      `deploy-production.yml` workflow set to `workflow_dispatch:` only.
- [ ] CloudWatch alarms on the prod RDS (existing
      `module.cloudwatch_alarms`) stay quiet.
- [ ] Prod data lives in RDS (automated backups + PITR), not on the EC2 data
      volume — the volume there only holds the Docker image cache. No
      additional backup machinery on the EC2 itself.

## 7. Final cleanup (after the overlap window)

In a focused PR:

- Remove `module.alb`, `module.ecs`, `module.cronjobs`,
  `module.service_discovery`, `module.bastion` from
  [`production/main.tf`](../infrastructure/environments/production/main.tf).
- Delete the legacy `deploy-production.yml` workflow file.
- Re-run `audit-dev-vpc.yml`'s logic against prod (or copy it to
  `audit-prod-vpc.yml`) to release any orphaned EIPs / VPC endpoints / NAT
  gateways.
- Update `module.cloudwatch_alarms` if any of its alarms reference the now-
  deleted ECS / ALB metrics.

After this PR, prod rollback becomes "reapply prior commit" rather than
"scale services up", so plan it carefully and announce a maintenance window.
