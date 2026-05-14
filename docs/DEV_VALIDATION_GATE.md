# Dev EC2 Validation Gate

After applying the single-EC2 dev migration (Terraform + workflows in this
repo) **and before** scaling the prod ECS stack to zero or starting any prod
EC2 work, run this checklist on the new dev EC2 (`revendiste-dev-app-compute`).

The gate fails closed: if any step is unclear or partially failing, do **not**
proceed to Phase 5 (production cutover).

## 0. Apply order recap

1. `terraform apply` in `infrastructure/environments/development/` to create
   the new `module.ec2_app` (and the deploy-artifacts S3 bucket / EBS data
   volume). The dev RDS, ALB, ECS, EventBridge, Bastion, Service Discovery,
   and IAM-for-ECS resources should still exist — the destroy comes **after**
   this gate passes.
2. Trigger `.github/workflows/deploy-dev-ec2.yml` manually to ship the first
   bundle and start the systemd unit.
3. Watch `aws ssm start-session --target $(terraform output -raw app_instance_id) --region sa-east-1`
   to check `journalctl -u revendiste -f`.

## 1. HTTPS path through Cloudflare

- [ ] `dig +short dev.revendiste.com` returns the new EIP after Cloudflare
      propagation (or, while the old DNS hasn't been re-pointed yet, force
      with `curl -k --resolve dev.revendiste.com:443:<NEW_EIP>` from a
      laptop).
- [ ] `curl -fsS https://dev.revendiste.com/api/health` returns `200`.
- [ ] Cloudflare SSL/TLS mode is set to **Full** (not "Full (strict)") for now
      — Caddy issues an internal cert. Switch to **Full (strict)** with a
      Cloudflare Origin CA cert in [`deploy/Caddyfile`](../deploy/Caddyfile)
      before considering the origin production-grade.

## 2. Application smoke

- [ ] Sign-up / login (Clerk) works against the dev URL.
- [ ] Creating a listing succeeds.
- [ ] Uploading a ticket attachment lands in R2 (verify in Cloudflare → R2 →
      `dev-revendiste-private`).
- [ ] An R2-backed image renders via `dev-cdn.revendiste.com`.
- [ ] Static files served by the frontend (TanStack Start / Nitro) load
      without 404s.

## 3. In-process cronjobs

The compose file sets `ENABLE_INPROCESS_CRONJOBS=true`. All six jobs should
appear in backend startup logs:

```
docker logs revendiste-dev-backend --since 5m | grep -i 'Scheduled job'
```

Confirm each fires at least once and produces the expected DB / R2 / log
side-effects:

- [ ] `sync-payments-and-expire-orders` (every 5 minutes)
- [ ] `notify-upload-availability` (every hour)
- [ ] `check-payout-hold-periods` (every hour)
- [ ] `process-pending-notifications` (every minute)
- [ ] `process-pending-jobs` (every 2 minutes)
- [ ] `scrape-events` (daily; run manually with
      `docker exec revendiste-dev-backend node dist/scripts/run-job.js scrape-events`
      and watch CPU/memory while it runs)

## 4. Webhooks (sandbox)

- [ ] dLocal sandbox webhook to `https://dev.revendiste.com/api/payments/webhook`
      returns `200` and produces an idempotent payment record (replays don't
      duplicate).
- [ ] Clerk webhook test event hits the dev URL successfully.
- [ ] Repeat each webhook to confirm idempotency (no double-charge / double
      notification).

## 5. Playwright / scrape resource use

The whole point of starting at `t4g.small` is to confirm Chromium-on-2GiB
holds up. While the manual scrape job runs:

```
docker stats --no-stream
free -m
docker exec revendiste-dev-backend ps aux | head
```

- [ ] Memory headroom stays above ~150 MiB (otherwise upgrade to `t4g.medium`
      now).
- [ ] CPU credits don't bottom out (`aws cloudwatch get-metric-statistics
  --namespace AWS/EC2 --metric-name CPUCreditBalance ...`).
- [ ] The scrape completes without `FATAL: out of memory` from Postgres.

## 6. Postgres survives restarts

Dev data is intentionally disposable (no backups, no snapshots — see
`deploy/README.md`). We still want to confirm the EBS data volume is doing
its job across restarts so an instance reboot doesn't surprise us:

- [ ] `docker compose -f /opt/revendiste/docker-compose.dev.yml restart` keeps
      data: log a row in any table, restart, confirm it's still there.
- [ ] `systemctl restart revendiste.service` keeps data.
- [ ] After `terraform apply` that changes `instance_type` (e.g. swap to
      `t4g.medium`), the data volume reattaches and the row is still there.

## 7. Cleanup (only after 1–6 are green)

Do these in order — Bastion last so SSM access into the dev VPC isn't lost
mid-cleanup:

1. Remove `module.ecs`, `module.alb`, `module.cronjobs`,
   `module.service_discovery`, `aws_iam_role_policy.eventbridge_ecs_run_task`
   from the previous-known-good `infrastructure/environments/development/main.tf`
   (this PR already removed them); `terraform apply`.
2. Remove `module.bastion` and `module.rds` (this PR already removed them);
   `terraform apply`.
3. Run `.github/workflows/audit-dev-vpc.yml` with `delete=false` (dry-run),
   then `delete=true` once the list looks right. Expects to delete the SSM
   trio of interface VPC endpoints, any leftover NAT gateways, and orphaned
   EIPs / public-IPv4 ENIs.
4. Verify `.github/workflows/toggle-dev-environment.yml` is dispatch-only
   (already done in this change set) and don't run it. The same for
   `.github/workflows/deploy-dev.yml`.

After this list is green, **production EC2 work (Phase 5) may begin**.
