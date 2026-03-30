# Dev Environment Start/Stop Guide

The dev environment can be turned on and off to save costs when not in use. When stopped, ECS services scale to zero, RDS stops, and cronjobs are disabled.

## How to toggle (from phone or desktop)

### Using GitHub Mobile App

1. Open the **GitHub** app on your phone
2. Navigate to the **revendiste** repository
3. Tap the **Actions** tab
4. Find **"Toggle Dev Environment"**
5. Tap **"Run workflow"**
6. Select **Start** or **Stop**
7. Tap **Run**

### Using GitHub Web

1. Go to the repository on github.com
2. Click **Actions** tab
3. In the left sidebar, click **Toggle Dev Environment**
4. Click **Run workflow** (dropdown on the right)
5. Select **Start** or **Stop** from the dropdown
6. Click **Run workflow**

### Using GitHub CLI

```bash
# Stop
gh workflow run toggle-dev-environment.yml -f action=Stop

# Start
gh workflow run toggle-dev-environment.yml -f action=Start
```

## What happens on Stop

1. ECS backend and frontend services scale to **0 tasks** (immediate)
2. RDS instance **stops** (takes ~1 minute to initiate)
3. All 6 EventBridge cronjob rules are **disabled**

The ALB stays running (fixed cost, can't be stopped without destroying it).

## What happens on Start

1. RDS instance **starts** (~5-10 minutes to become available)
2. EventBridge cronjob rules are **re-enabled**
3. ECS backend and frontend services scale to **1 task** each
4. Workflow waits for ECS services to **stabilize** before completing

Total start time: **~8-12 minutes** (RDS startup is the bottleneck).

## Cost savings

| Resource | Running 24/7 | Stopped |
|----------|-------------|---------|
| ECS Fargate (backend + frontend) | ~$18/month | $0 |
| RDS (db.t4g.micro) | ~$23/month | ~$2/month (storage only) |
| Cronjobs (Fargate Spot) | ~$5/month | $0 |
| Public IPv4 (ECS tasks) | ~$7/month | ~$3.60/month (ALB IPs remain) |

Keeping dev off outside work hours (~10h/day weekdays) saves roughly **$35-45/month**.

## Important notes

- **RDS auto-stop limit**: AWS automatically restarts a stopped RDS instance after **7 days**. If you stop it on Friday, it will auto-start the following Friday. This is an AWS limitation.
- **Deploys while stopped**: If you push to `development` while the environment is stopped, the deploy workflow will fail because ECS can't update services with 0 desired tasks. Start the environment first, then deploy (or just start it — the deploy workflow runs on push to `development`).
- **Cronjobs**: Disabled cronjob rules mean no scheduled tasks run. If you need a specific cronjob to run while testing, you can manually trigger it from the ECS console.
