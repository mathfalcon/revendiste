# IAM Roles and Policies

# ECS Service Linked Role (required for ECS services)
# This role is required for ECS services to function properly
# If the role already exists in your account, import it:
# terraform import aws_iam_service_linked_role.ecs arn:aws:iam::<account-id>:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS
resource "aws_iam_service_linked_role" "ecs" {
  aws_service_name = "ecs.amazonaws.com"

  lifecycle {
    ignore_changes = [description]
  }
}

# Application Auto Scaling Service Linked Role (required for ECS autoscaling)
# This role is required for Application Auto Scaling to function properly
# If the role already exists in your account, import it:
# terraform import aws_iam_service_linked_role.autoscaling arn:aws:iam::<account-id>:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService
resource "aws_iam_service_linked_role" "autoscaling" {
  aws_service_name = "autoscaling.amazonaws.com"

  lifecycle {
    ignore_changes = [description]
  }
}

# ECS Task Execution Role (for pulling images, CloudWatch logs, etc.)
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-ecs-task-execution-role"
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for ECR access
resource "aws_iam_role_policy" "ecs_task_execution_ecr" {
  name = "${local.name_prefix}-ecs-task-execution-ecr"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for Secrets Manager access (for database credentials)
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${local.name_prefix}-ecs-task-execution-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.backend_secrets.arn
        ]
      }
    ]
  })
}

# ECS Task Role (for application-level permissions)
resource "aws_iam_role" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-ecs-task-role"
  }
}

# CloudWatch Logs policy for ECS tasks
resource "aws_iam_role_policy" "ecs_task_logs" {
  name = "${local.name_prefix}-ecs-task-logs"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${local.name_prefix}*"
      }
    ]
  })
}

# ECS Exec policy for accessing running containers
resource "aws_iam_role_policy" "ecs_task_exec" {
  name = "${local.name_prefix}-ecs-task-exec"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for EventBridge to run ECS tasks (for cronjobs)
resource "aws_iam_role" "eventbridge_ecs" {
  name = "${local.name_prefix}-eventbridge-ecs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-eventbridge-ecs-role"
  }
}

# Policy for EventBridge to run ECS tasks
resource "aws_iam_role_policy" "eventbridge_ecs_run_task" {
  name = "${local.name_prefix}-eventbridge-ecs-run-task"
  role = aws_iam_role.eventbridge_ecs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask"
        ]
        Resource = [
          aws_ecs_task_definition.cronjob_sync_payments.arn,
          aws_ecs_task_definition.cronjob_notify_upload.arn,
          aws_ecs_task_definition.cronjob_check_payout.arn,
          aws_ecs_task_definition.cronjob_scrape_events.arn
        ]
        Condition = {
          ArnEquals = {
            "ecs:cluster" = aws_ecs_cluster.main.arn
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })
}

