# EventBridge Rules for Cronjobs
# Note: These jobs run the job logic once per schedule, not as long-running cron processes
# The jobs need to be modified to support a "run-once" mode, or we need wrapper scripts

# EventBridge Rule for sync-payments-and-expire-orders (every 5 minutes)
resource "aws_cloudwatch_event_rule" "sync_payments" {
  name                = "${local.name_prefix}-sync-payments"
  description         = "Run sync-payments-and-expire-orders job every 5 minutes"
  schedule_expression = "cron(*/5 * * * ? *)" # Every 5 minutes

  tags = {
    Name = "${local.name_prefix}-sync-payments-rule"
  }
}

resource "aws_cloudwatch_event_target" "sync_payments" {
  rule      = aws_cloudwatch_event_rule.sync_payments.name
  target_id = "sync-payments-target"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.cronjob_sync_payments.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = aws_subnet.public[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = true # Public IPs to avoid NAT Gateway costs
    }
  }
}

# EventBridge Rule for notify-upload-availability (hourly)
resource "aws_cloudwatch_event_rule" "notify_upload" {
  name                = "${local.name_prefix}-notify-upload"
  description         = "Run notify-upload-availability job hourly"
  schedule_expression = "cron(0 * * * ? *)" # Every hour at minute 0

  tags = {
    Name = "${local.name_prefix}-notify-upload-rule"
  }
}

resource "aws_cloudwatch_event_target" "notify_upload" {
  rule      = aws_cloudwatch_event_rule.notify_upload.name
  target_id = "notify-upload-target"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.cronjob_notify_upload.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = aws_subnet.public[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = true # Public IPs to avoid NAT Gateway costs
    }
  }
}

# EventBridge Rule for check-payout-hold-periods (hourly)
resource "aws_cloudwatch_event_rule" "check_payout" {
  name                = "${local.name_prefix}-check-payout"
  description         = "Run check-payout-hold-periods job hourly"
  schedule_expression = "cron(0 * * * ? *)" # Every hour at minute 0

  tags = {
    Name = "${local.name_prefix}-check-payout-rule"
  }
}

resource "aws_cloudwatch_event_target" "check_payout" {
  rule      = aws_cloudwatch_event_rule.check_payout.name
  target_id = "check-payout-target"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.cronjob_check_payout.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = aws_subnet.public[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = true # Public IPs to avoid NAT Gateway costs
    }
  }
}

# EventBridge Rule for scrape-events (every 30 minutes)
resource "aws_cloudwatch_event_rule" "scrape_events" {
  name                = "${local.name_prefix}-scrape-events"
  description         = "Run scrape-events job every 30 minutes"
  schedule_expression = "cron(*/30 * * * ? *)" # Every 30 minutes

  tags = {
    Name = "${local.name_prefix}-scrape-events-rule"
  }
}

resource "aws_cloudwatch_event_target" "scrape_events" {
  rule      = aws_cloudwatch_event_rule.scrape_events.name
  target_id = "scrape-events-target"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.cronjob_scrape_events.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = aws_subnet.public[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = true # Public IPs to avoid NAT Gateway costs
    }
  }
}

