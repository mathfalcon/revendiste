# ECS Cluster and Services

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name_prefix}-backend"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${local.name_prefix}-backend-logs"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${local.name_prefix}-frontend"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${local.name_prefix}-frontend-logs"
  }
}

resource "aws_cloudwatch_log_group" "cronjob" {
  name              = "/ecs/${local.name_prefix}-cronjob"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${local.name_prefix}-cronjob-logs"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled" # Enable CloudWatch Container Insights for monitoring
  }

  tags = {
    Name = "${local.name_prefix}-cluster"
  }
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name_prefix}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"

      portMappings = [
        {
          containerPort = var.backend_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = tostring(var.backend_port)
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.backend_port}/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-backend-task"
  }
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name_prefix}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"

      portMappings = [
        {
          containerPort = var.frontend_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "VITE_API_URL"
          value = "https://api.${var.domain_name}"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.frontend_port} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-frontend-task"
  }
}

# Cronjob Task Definitions (one per job for better isolation and monitoring)

# Task definition for sync-payments-and-expire-orders
resource "aws_ecs_task_definition" "cronjob_sync_payments" {
  family                   = "${local.name_prefix}-cronjob-sync-payments"
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

      # Run the job once using the standalone script
      command = ["node", "dist/src/scripts/run-job.js", "sync-payments-and-expire-orders"]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "sync-payments"
        }
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-cronjob-sync-payments"
  }
}

# Task definition for notify-upload-availability
resource "aws_ecs_task_definition" "cronjob_notify_upload" {
  family                   = "${local.name_prefix}-cronjob-notify-upload"
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

      command = ["node", "dist/src/scripts/run-job.js", "notify-upload-availability"]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "notify-upload"
        }
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-cronjob-notify-upload"
  }
}

# Task definition for check-payout-hold-periods
resource "aws_ecs_task_definition" "cronjob_check_payout" {
  family                   = "${local.name_prefix}-cronjob-check-payout"
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

      command = ["node", "dist/src/scripts/run-job.js", "check-payout-hold-periods"]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "check-payout"
        }
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-cronjob-check-payout"
  }
}

# Task definition for scrape-events (uses scraping resources for Playwright)
resource "aws_ecs_task_definition" "cronjob_scrape_events" {
  family                   = "${local.name_prefix}-cronjob-scrape-events"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cronjob_scraping_cpu
  memory                   = var.cronjob_scraping_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "cronjob"
      image = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"

      command = ["node", "dist/src/scripts/run-job.js", "scrape-events"]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "scrape-events"
        }
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-cronjob-scrape-events"
  }
}

# Backend ECS Service
resource "aws_ecs_service" "backend" {
  name            = "${local.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true # Public IPs to avoid NAT Gateway costs
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.backend_port
  }

  # Enable autoscaling
  enable_execute_command = true

  # Zero-downtime deployment configuration
  # Allow up to 200% capacity during deployment (2x tasks)
  deployment_maximum_percent = 200
  # Keep at least 50% healthy (1 task minimum when desired_count=2)
  deployment_minimum_healthy_percent = 50

  depends_on = [
    aws_lb_listener.https,
    aws_lb_listener_rule.backend,
    aws_iam_role.ecs_task_execution,
    aws_iam_service_linked_role.ecs
  ]

  tags = {
    Name = "${local.name_prefix}-backend-service"
  }
}

# Frontend ECS Service
resource "aws_ecs_service" "frontend" {
  name            = "${local.name_prefix}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true # Public IPs to avoid NAT Gateway costs
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = var.frontend_port
  }

  # Enable autoscaling
  enable_execute_command = true

  # Zero-downtime deployment configuration
  # Allow up to 200% capacity during deployment (2x tasks)
  deployment_maximum_percent = 200
  # Keep at least 50% healthy (1 task minimum when desired_count=2)
  deployment_minimum_healthy_percent = 50

  depends_on = [
    aws_lb_listener.https,
    aws_lb_listener_rule.frontend,
    aws_iam_role.ecs_task_execution,
    aws_iam_service_linked_role.ecs
  ]

  tags = {
    Name = "${local.name_prefix}-frontend-service"
  }
}

# ECS Autoscaling for Backend
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.backend_max_capacity
  min_capacity       = var.backend_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_iam_service_linked_role.autoscaling]
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${local.name_prefix}-backend-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.backend_cpu_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "backend_memory" {
  name               = "${local.name_prefix}-backend-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.backend_memory_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ECS Autoscaling for Frontend
resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = var.frontend_max_capacity
  min_capacity       = var.frontend_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_iam_service_linked_role.autoscaling]
}

resource "aws_appautoscaling_policy" "frontend_cpu" {
  name               = "${local.name_prefix}-frontend-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.frontend_cpu_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "frontend_memory" {
  name               = "${local.name_prefix}-frontend-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.frontend_memory_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

