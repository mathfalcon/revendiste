# ECS Module
# Creates ECS cluster, task definitions, services, and autoscaling

locals {
  backend_secrets = [
    {
      name      = "DB_CREDENTIALS_JSON"
      valueFrom = var.db_credentials_secret_arn
    },
    {
      name      = "BACKEND_SECRETS_JSON"
      valueFrom = var.backend_secrets_arn
    }
  ]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.name_prefix}-backend"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-backend-logs"
  })
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.name_prefix}-frontend"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-frontend-logs"
  })
}

resource "aws_cloudwatch_log_group" "cronjob" {
  name              = "/ecs/${var.name_prefix}-cronjob"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cronjob-logs"
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cluster"
  })
}

# Capacity providers for the cluster (enables Fargate Spot)
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  # Default to regular Fargate for services
  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.name_prefix}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  # Use ARM64 (Graviton) for ~20% cost savings
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${var.backend_repository_url}:${var.backend_image_tag}"

      portMappings = [
        {
          containerPort = var.backend_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
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
          "awslogs-region"        = var.aws_region
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

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-backend-task"
  })
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.name_prefix}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  # Use ARM64 (Graviton) for ~20% cost savings
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${var.frontend_repository_url}:${var.frontend_image_tag}"

      portMappings = [
        {
          containerPort = var.frontend_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
        },
        {
          name  = "VITE_API_URL"
          value = "https://${var.domain_name}/api"
        },
        {
          name  = "BACKEND_IP"
          value = "backend.${var.service_discovery_namespace_name}:${var.backend_port}"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
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

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-frontend-task"
  })
}

# Cronjob Task Definitions
resource "aws_ecs_task_definition" "cronjob_sync_payments" {
  family                   = "${var.name_prefix}-cronjob-sync-payments"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cronjob_cpu
  memory                   = var.cronjob_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  # Use ARM64 (Graviton) for ~20% cost savings
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name    = "cronjob"
      image   = "${var.backend_repository_url}:${var.backend_image_tag}"
      command = ["node", "dist/src/scripts/run-job.js", "sync-payments-and-expire-orders"]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "sync-payments"
        }
      }
    }
  ])

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cronjob-sync-payments"
  })
}

resource "aws_ecs_task_definition" "cronjob_notify_upload" {
  family                   = "${var.name_prefix}-cronjob-notify-upload"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cronjob_cpu
  memory                   = var.cronjob_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  # Use ARM64 (Graviton) for ~20% cost savings
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name    = "cronjob"
      image   = "${var.backend_repository_url}:${var.backend_image_tag}"
      command = ["node", "dist/src/scripts/run-job.js", "notify-upload-availability"]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "notify-upload"
        }
      }
    }
  ])

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cronjob-notify-upload"
  })
}

resource "aws_ecs_task_definition" "cronjob_check_payout" {
  family                   = "${var.name_prefix}-cronjob-check-payout"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cronjob_cpu
  memory                   = var.cronjob_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  # Use ARM64 (Graviton) for ~20% cost savings
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name    = "cronjob"
      image   = "${var.backend_repository_url}:${var.backend_image_tag}"
      command = ["node", "dist/src/scripts/run-job.js", "check-payout-hold-periods"]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "check-payout"
        }
      }
    }
  ])

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cronjob-check-payout"
  })
}

# Note: scrape-events stays on x86 (default) due to Chromium/Playwright compatibility
resource "aws_ecs_task_definition" "cronjob_scrape_events" {
  family                   = "${var.name_prefix}-cronjob-scrape-events"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cronjob_scraping_cpu
  memory                   = var.cronjob_scraping_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name    = "cronjob"
      image   = "${var.backend_repository_url}:${var.backend_image_tag}"
      command = ["node", "dist/src/scripts/run-job.js", "scrape-events"]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
        },
        # Scraper configuration - configurable per environment
        # Lower concurrency in deployed env to avoid bot detection from AWS IPs
        {
          name  = "SCRAPER_MAX_CONCURRENCY"
          value = tostring(var.scraper_max_concurrency)
        },
        {
          name  = "SCRAPER_SAME_DOMAIN_DELAY_SECS"
          value = tostring(var.scraper_same_domain_delay_secs)
        },
        {
          name  = "SCRAPER_MAX_REQUESTS_PER_CRAWL"
          value = tostring(var.scraper_max_requests_per_crawl)
        },
        {
          name  = "SCRAPER_MAX_PAGES_PER_BROWSER"
          value = tostring(var.scraper_max_pages_per_browser)
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "scrape-events"
        }
      }
    }
  ])

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cronjob-scrape-events"
  })
}

resource "aws_ecs_task_definition" "cronjob_process_notifications" {
  family                   = "${var.name_prefix}-cronjob-process-notifications"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cronjob_cpu
  memory                   = var.cronjob_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  # Use ARM64 (Graviton) for ~20% cost savings
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name    = "cronjob"
      image   = "${var.backend_repository_url}:${var.backend_image_tag}"
      command = ["node", "dist/src/scripts/run-job.js", "process-pending-notifications"]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "process-notifications"
        }
      }
    }
  ])

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cronjob-process-notifications"
  })
}

resource "aws_ecs_task_definition" "cronjob_process_pending_jobs" {
  family                   = "${var.name_prefix}-cronjob-process-pending-jobs"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cronjob_cpu
  memory                   = var.cronjob_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name    = "cronjob"
      image   = "${var.backend_repository_url}:${var.backend_image_tag}"
      command = ["node", "dist/src/scripts/run-job.js", "process-pending-jobs"]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
        }
      ]

      secrets = local.backend_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cronjob.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "process-pending-jobs"
        }
      }
    }
  ])

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cronjob-process-pending-jobs"
  })
}

# Backend ECS Service
resource "aws_ecs_service" "backend" {
  name            = "${var.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = var.backend_target_group_arn
    container_name   = "backend"
    container_port   = var.backend_port
  }

  service_registries {
    registry_arn = var.backend_service_discovery_arn
  }

  enable_execute_command             = true
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-backend-service"
  })
}

# Frontend ECS Service
resource "aws_ecs_service" "frontend" {
  name            = "${var.name_prefix}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = var.frontend_target_group_arn
    container_name   = "frontend"
    container_port   = var.frontend_port
  }

  enable_execute_command             = true
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-frontend-service"
  })
}

# Backend Autoscaling
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.backend_max_capacity
  min_capacity       = var.backend_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${var.name_prefix}-backend-cpu-autoscaling"
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
  name               = "${var.name_prefix}-backend-memory-autoscaling"
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

# Frontend Autoscaling
resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = var.frontend_max_capacity
  min_capacity       = var.frontend_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "frontend_cpu" {
  name               = "${var.name_prefix}-frontend-cpu-autoscaling"
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
  name               = "${var.name_prefix}-frontend-memory-autoscaling"
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
