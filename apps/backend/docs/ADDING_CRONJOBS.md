# Adding New Cronjobs

This guide explains how to add a new cronjob that works in both development/local (using node-cron) and production (using EventBridge + ECS RunTask).

## Overview

- **Development/Local**: Jobs run continuously using `node-cron` schedulers started in `server.ts`
- **Production**: Jobs run on-demand via EventBridge + ECS RunTask using standalone scripts

## Step-by-Step Guide

### 1. Create the Cronjob File

Create a new file in `apps/backend/src/cronjobs/` (e.g., `my-new-job.ts`):

```typescript
import cron from 'node-cron';
import {db} from '~/db';
import {logger} from '~/utils';
// ... other imports

/**
 * Runs the my new job logic once
 * Used by production EventBridge + ECS RunTask
 */
export async function runMyNewJob() {
  try {
    logger.info('Starting my new job...');
    
    // Your job logic here
    // ...
    
    logger.info('My new job completed successfully');
  } catch (error) {
    logger.error('Error in my new job:', error);
    throw error; // Important: re-throw for production error handling
  }
}

/**
 * Starts the cron scheduler for my new job
 * Only used in development/local environments
 * In production, use runMyNewJob() via EventBridge
 */
export function startMyNewJob() {
  const job = cron.schedule('0 * * * *', async () => { // Example: hourly
    try {
      await runMyNewJob();
    } catch (error) {
      logger.error('Error in scheduled my new job:', error);
    }
  });

  logger.info('Scheduled job: my-new-job started (runs hourly)');
  return job;
}
```

**Key Points:**
- Export both `runMyNewJob()` (run-once) and `startMyNewJob()` (cron scheduler)
- The run-once function should be `async` and throw errors
- The cron scheduler wraps the run-once function

### 2. Register in Server (Development/Local)

Add the job to `apps/backend/src/server.ts`:

```typescript
import {startMyNewJob} from './cronjobs/my-new-job';

// ... in app.listen callback:
if (NODE_ENV !== 'production') {
  logger.info('Starting cronjob schedulers (dev/local mode)...');
  startSyncPaymentsAndExpireOrdersJob();
  startNotifyUploadAvailabilityJob();
  startCheckPayoutHoldPeriodsJob();
  startMyNewJob(); // Add your new job here
}
```

### 3. Register in Script Runner (Production)

Add the job to `apps/backend/src/scripts/run-job.ts`:

```typescript
case 'my-new-job': {
  const {runMyNewJob} = await import('~/cronjobs/my-new-job');
  await runMyNewJob();
  break;
}
```

Also update the usage help:

```typescript
logger.info('Available jobs:');
logger.info('  - sync-payments-and-expire-orders');
logger.info('  - notify-upload-availability');
logger.info('  - check-payout-hold-periods');
logger.info('  - process-pending-notifications');
logger.info('  - my-new-job'); // Add your new job
```

### 4. Add to Terraform (Production Infrastructure)

#### 4a. Create ECS Task Definition

Add to `infrastructure/production/ecs.tf`:

```hcl
# Task definition for my-new-job
resource "aws_ecs_task_definition" "cronjob_my_new_job" {
  family                   = "${local.name_prefix}-cronjob-my-new-job"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cronjob_cpu
  memory                   = var.cronjob_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "cronjob"
      image = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"

      command = ["node", "dist/scripts/run-job.js", "my-new-job"]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:database_url::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "my-new-job"
        }
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-cronjob-my-new-job"
  }
}
```

#### 4b. Create EventBridge Rule

Add to `infrastructure/production/cronjobs.tf`:

```hcl
# EventBridge Rule for my-new-job
resource "aws_cloudwatch_event_rule" "my_new_job" {
  name                = "${local.name_prefix}-my-new-job"
  description         = "Run my new job hourly"
  schedule_expression = "cron(0 * * * ? *)" # Every hour at minute 0

  tags = {
    Name = "${local.name_prefix}-my-new-job-rule"
  }
}

resource "aws_cloudwatch_event_target" "my_new_job" {
  rule      = aws_cloudwatch_event_rule.my_new_job.name
  target_id = "my-new-job-target"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.cronjob_my_new_job.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = aws_subnet.public[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = true
    }
  }
}
```

#### 4c. Update IAM Permissions

Update `infrastructure/production/iam.tf` to include the new task definition:

```hcl
Resource = [
  aws_ecs_task_definition.cronjob_sync_payments.arn,
  aws_ecs_task_definition.cronjob_notify_upload.arn,
  aws_ecs_task_definition.cronjob_check_payout.arn,
  aws_ecs_task_definition.cronjob_process_notifications.arn,
  aws_ecs_task_definition.cronjob_my_new_job.arn, # Add your new job
]
```

### 5. Deploy

1. **Backend Code**: Deploy your backend changes (the new cronjob file and script updates)
2. **Terraform**: Run `terraform plan` and `terraform apply` to create the new infrastructure
3. **Verify**: Check CloudWatch Logs to ensure the job runs on schedule

## Schedule Expressions

EventBridge uses cron expressions. Common patterns:

- `cron(*/5 * * * ? *)` - Every 5 minutes
- `cron(0 * * * ? *)` - Every hour at minute 0
- `cron(0 0 * * ? *)` - Daily at midnight UTC
- `cron(0 0 ? * MON *)` - Every Monday at midnight UTC
- `cron(0 9 * * ? *)` - Daily at 9 AM UTC

For node-cron (development), use standard cron syntax:
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Daily at midnight

## Testing

### Local Testing

```bash
# Run the job once manually
node dist/scripts/run-job.js my-new-job

# Or start the server and let cron handle it
npm run dev
```

### Production Testing

After deploying, you can manually trigger the job:

```bash
aws ecs run-task \
  --cluster revendiste-production-cluster \
  --task-definition revendiste-production-cronjob-my-new-job \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED]}" \
  --region sa-east-1
```

## Checklist

When adding a new cronjob:

- [ ] Create cronjob file with `runXxx()` and `startXxx()` functions
- [ ] Add to `server.ts` (dev/local only)
- [ ] Add to `scripts/run-job.ts` (production)
- [ ] Create ECS task definition in `ecs.tf`
- [ ] Create EventBridge rule in `cronjobs.tf`
- [ ] Update IAM permissions in `iam.tf`
- [ ] Test locally
- [ ] Deploy and verify in production

## Changing Schedules

To change a job's schedule:

1. **Development**: Update the cron expression in the `startXxx()` function
2. **Production**: Update the `schedule_expression` in the EventBridge rule in `cronjobs.tf`
3. **Apply**: Run `terraform apply` to update the schedule

## Example: Complete New Job

See `apps/backend/src/cronjobs/process-pending-notifications.ts` for a complete example of a job that:
- Has both run-once and cron scheduler functions
- Handles errors properly
- Uses proper logging
- Works in both dev and production

