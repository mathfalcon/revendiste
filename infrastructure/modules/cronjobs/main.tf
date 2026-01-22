# Cronjobs Module
# Creates EventBridge rules for scheduled ECS tasks
# All cronjobs use Fargate Spot by default (up to 70% cost savings)
# Safe for cronjobs because they are idempotent and can be retried

# Local to build capacity provider strategy based on use_fargate_spot variable
locals {
  capacity_provider = var.use_fargate_spot ? "FARGATE_SPOT" : "FARGATE"
}

# EventBridge Rule for sync-payments-and-expire-orders
resource "aws_cloudwatch_event_rule" "sync_payments" {
  name                = "${var.name_prefix}-sync-payments"
  description         = "Run sync-payments-and-expire-orders job"
  schedule_expression = var.sync_payments_schedule

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-sync-payments-rule"
  })
}

resource "aws_cloudwatch_event_target" "sync_payments" {
  rule      = aws_cloudwatch_event_rule.sync_payments.name
  target_id = "sync-payments-target"
  arn       = var.ecs_cluster_arn
  role_arn  = var.eventbridge_role_arn

  ecs_target {
    task_count          = 1
    task_definition_arn = var.sync_payments_task_arn
    platform_version    = "LATEST"

    capacity_provider_strategy {
      capacity_provider = local.capacity_provider
      weight            = 1
      base              = 1
    }

    network_configuration {
      subnets          = var.public_subnet_ids
      security_groups  = [var.ecs_security_group_id]
      assign_public_ip = true
    }
  }
}

# EventBridge Rule for notify-upload-availability
resource "aws_cloudwatch_event_rule" "notify_upload" {
  name                = "${var.name_prefix}-notify-upload"
  description         = "Run notify-upload-availability job"
  schedule_expression = var.notify_upload_schedule

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-notify-upload-rule"
  })
}

resource "aws_cloudwatch_event_target" "notify_upload" {
  rule      = aws_cloudwatch_event_rule.notify_upload.name
  target_id = "notify-upload-target"
  arn       = var.ecs_cluster_arn
  role_arn  = var.eventbridge_role_arn

  ecs_target {
    task_count          = 1
    task_definition_arn = var.notify_upload_task_arn
    platform_version    = "LATEST"

    capacity_provider_strategy {
      capacity_provider = local.capacity_provider
      weight            = 1
      base              = 1
    }

    network_configuration {
      subnets          = var.public_subnet_ids
      security_groups  = [var.ecs_security_group_id]
      assign_public_ip = true
    }
  }
}

# EventBridge Rule for check-payout-hold-periods
resource "aws_cloudwatch_event_rule" "check_payout" {
  name                = "${var.name_prefix}-check-payout"
  description         = "Run check-payout-hold-periods job"
  schedule_expression = var.check_payout_schedule

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-check-payout-rule"
  })
}

resource "aws_cloudwatch_event_target" "check_payout" {
  rule      = aws_cloudwatch_event_rule.check_payout.name
  target_id = "check-payout-target"
  arn       = var.ecs_cluster_arn
  role_arn  = var.eventbridge_role_arn

  ecs_target {
    task_count          = 1
    task_definition_arn = var.check_payout_task_arn
    platform_version    = "LATEST"

    capacity_provider_strategy {
      capacity_provider = local.capacity_provider
      weight            = 1
      base              = 1
    }

    network_configuration {
      subnets          = var.public_subnet_ids
      security_groups  = [var.ecs_security_group_id]
      assign_public_ip = true
    }
  }
}

# EventBridge Rule for scrape-events
resource "aws_cloudwatch_event_rule" "scrape_events" {
  name                = "${var.name_prefix}-scrape-events"
  description         = "Run scrape-events job"
  schedule_expression = var.scrape_events_schedule

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-scrape-events-rule"
  })
}

resource "aws_cloudwatch_event_target" "scrape_events" {
  rule      = aws_cloudwatch_event_rule.scrape_events.name
  target_id = "scrape-events-target"
  arn       = var.ecs_cluster_arn
  role_arn  = var.eventbridge_role_arn

  ecs_target {
    task_count          = 1
    task_definition_arn = var.scrape_events_task_arn
    platform_version    = "LATEST"

    capacity_provider_strategy {
      capacity_provider = local.capacity_provider
      weight            = 1
      base              = 1
    }

    network_configuration {
      subnets          = var.public_subnet_ids
      security_groups  = [var.ecs_security_group_id]
      assign_public_ip = true
    }
  }
}

# EventBridge Rule for process-pending-notifications
resource "aws_cloudwatch_event_rule" "process_notifications" {
  name                = "${var.name_prefix}-process-notifications"
  description         = "Run process-pending-notifications job"
  schedule_expression = var.process_notifications_schedule

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-process-notifications-rule"
  })
}

resource "aws_cloudwatch_event_target" "process_notifications" {
  rule      = aws_cloudwatch_event_rule.process_notifications.name
  target_id = "process-notifications-target"
  arn       = var.ecs_cluster_arn
  role_arn  = var.eventbridge_role_arn

  ecs_target {
    task_count          = 1
    task_definition_arn = var.process_notifications_task_arn
    platform_version    = "LATEST"

    capacity_provider_strategy {
      capacity_provider = local.capacity_provider
      weight            = 1
      base              = 1
    }

    network_configuration {
      subnets          = var.public_subnet_ids
      security_groups  = [var.ecs_security_group_id]
      assign_public_ip = true
    }
  }
}
