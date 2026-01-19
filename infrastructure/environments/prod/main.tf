# Revendiste Production Environment
# Full resources for production deployment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.14"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  cloud {
    organization = "revendiste"
    workspaces {
      name = "revendiste-prod"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  environment = "prod"
  name_prefix = "revendiste-prod"

  common_tags = {
    Environment = "production"
    ManagedBy   = "terraform"
    Application = "revendiste"
  }
}

# ============================================================================
# Core Infrastructure Modules
# ============================================================================

module "vpc" {
  source = "../../modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  common_tags        = local.common_tags
}

module "security_groups" {
  source = "../../modules/security-groups"

  name_prefix            = local.name_prefix
  vpc_id                 = module.vpc.vpc_id
  backend_port           = var.backend_port
  cloudflare_ip_ranges   = var.cloudflare_ip_ranges
  cloudflare_ipv6_ranges = var.cloudflare_ipv6_ranges
  common_tags            = local.common_tags
}

module "rds" {
  source = "../../modules/rds"

  name_prefix              = local.name_prefix
  environment              = local.environment
  db_subnet_group_name     = module.vpc.db_subnet_group_name
  rds_security_group_id    = module.security_groups.rds_security_group_id
  db_name                  = var.db_name
  db_username              = var.db_username
  db_engine_version        = var.db_engine_version
  db_instance_class        = var.db_instance_class
  db_allocated_storage     = var.db_allocated_storage
  db_max_allocated_storage = var.db_max_allocated_storage
  db_backup_retention_days = var.db_backup_retention_days
  deletion_protection      = true  # Protect in production
  skip_final_snapshot      = false # Always snapshot in production
  common_tags              = local.common_tags
}

module "ecr" {
  source = "../../modules/ecr"

  name_prefix           = local.name_prefix
  environment           = local.environment
  image_retention_count = 20 # Keep more images in production
  common_tags           = local.common_tags
}

module "secrets" {
  source = "../../modules/secrets"

  name_prefix = local.name_prefix
  environment = local.environment
  common_tags = local.common_tags
}

module "service_discovery" {
  source = "../../modules/service-discovery"

  name_prefix    = local.name_prefix
  vpc_id         = module.vpc.vpc_id
  namespace_name = "revendiste.local"
  common_tags    = local.common_tags
}

module "alb" {
  source = "../../modules/alb"

  name_prefix           = local.name_prefix
  environment           = local.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id
  domain_name           = var.domain_name
  backend_port          = var.backend_port
  frontend_port         = var.frontend_port
  deletion_protection   = true # Protect in production
  common_tags           = local.common_tags
}

# IAM module
module "iam" {
  source = "../../modules/iam"

  name_prefix               = local.name_prefix
  aws_region                = var.aws_region
  aws_account_id            = data.aws_caller_identity.current.account_id
  db_credentials_secret_arn = module.rds.db_credentials_secret_arn
  backend_secrets_arn       = module.secrets.backend_secrets_arn
  common_tags               = local.common_tags
  # Cronjob permissions will be added after ECS module creates task definitions
}

module "ecs" {
  source = "../../modules/ecs"

  name_prefix = local.name_prefix
  environment = local.environment
  aws_region  = var.aws_region
  domain_name = var.domain_name

  # Networking
  public_subnet_ids     = module.vpc.public_subnet_ids
  ecs_security_group_id = module.security_groups.ecs_tasks_security_group_id

  # IAM
  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.iam.ecs_task_role_arn

  # ALB
  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn
  https_listener_arn        = module.alb.https_listener_arn

  # Service Discovery
  service_discovery_namespace_name = module.service_discovery.namespace_name
  backend_service_discovery_arn    = module.service_discovery.backend_service_arn

  # ECR
  backend_repository_url  = module.ecr.backend_repository_url
  frontend_repository_url = module.ecr.frontend_repository_url

  # Secrets
  db_credentials_secret_arn = module.rds.db_credentials_secret_arn
  backend_secrets_arn       = module.secrets.backend_secrets_arn

  # Backend Configuration - PRODUCTION RESOURCES
  backend_cpu           = var.backend_cpu
  backend_memory        = var.backend_memory
  backend_port          = var.backend_port
  backend_image_tag     = var.backend_image_tag
  backend_desired_count = var.backend_desired_count
  backend_max_capacity  = var.backend_max_capacity
  backend_cpu_target    = var.backend_cpu_target
  backend_memory_target = var.backend_memory_target

  # Frontend Configuration - PRODUCTION RESOURCES
  frontend_cpu           = var.frontend_cpu
  frontend_memory        = var.frontend_memory
  frontend_port          = var.frontend_port
  frontend_image_tag     = var.frontend_image_tag
  frontend_desired_count = var.frontend_desired_count
  frontend_max_capacity  = var.frontend_max_capacity
  frontend_cpu_target    = var.frontend_cpu_target
  frontend_memory_target = var.frontend_memory_target

  # Cronjob Configuration
  cronjob_cpu             = var.cronjob_cpu
  cronjob_memory          = var.cronjob_memory
  cronjob_scraping_cpu    = var.cronjob_scraping_cpu
  cronjob_scraping_memory = var.cronjob_scraping_memory

  log_retention_days = var.log_retention_days
  common_tags        = local.common_tags
}


# EventBridge policy for cronjobs (must be after ECS module creates task definitions)
resource "aws_iam_role_policy" "eventbridge_ecs_run_task" {
  name = "${local.name_prefix}-eventbridge-ecs-run-task"
  role = module.iam.eventbridge_ecs_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecs:RunTask"]
        Resource = module.ecs.cronjob_task_definition_arns
        Condition = {
          ArnEquals = {
            "ecs:cluster" = module.ecs.cluster_arn
          }
        }
      },
      {
        Effect = "Allow"
        Action = ["iam:PassRole"]
        Resource = [
          module.iam.ecs_task_execution_role_arn,
          module.iam.ecs_task_role_arn
        ]
      }
    ]
  })
}

module "cronjobs" {
  source = "../../modules/cronjobs"

  name_prefix           = local.name_prefix
  ecs_cluster_arn       = module.ecs.cluster_arn
  eventbridge_role_arn  = module.iam.eventbridge_ecs_role_arn
  public_subnet_ids     = module.vpc.public_subnet_ids
  ecs_security_group_id = module.security_groups.ecs_tasks_security_group_id

  # Task definition ARNs
  sync_payments_task_arn         = module.ecs.cronjob_sync_payments_task_arn
  notify_upload_task_arn         = module.ecs.cronjob_notify_upload_task_arn
  check_payout_task_arn          = module.ecs.cronjob_check_payout_task_arn
  scrape_events_task_arn         = module.ecs.cronjob_scrape_events_task_arn
  process_notifications_task_arn = module.ecs.cronjob_process_notifications_task_arn

  # PRODUCTION SCHEDULES
  sync_payments_schedule         = "cron(*/5 * * * ? *)"  # Every 5 minutes
  notify_upload_schedule         = "cron(0 * * * ? *)"    # Every hour
  check_payout_schedule          = "cron(0 * * * ? *)"    # Every hour
  scrape_events_schedule         = "cron(*/30 * * * ? *)" # Every 30 minutes
  process_notifications_schedule = "cron(*/5 * * * ? *)"  # Every 5 minutes

  common_tags = local.common_tags
}

module "cloudflare_dns" {
  source = "../../modules/cloudflare-dns"

  domain_name                               = var.domain_name
  alb_dns_name                              = module.alb.alb_dns_name
  acm_certificate_domain_validation_options = module.alb.acm_certificate_domain_validation_options
  common_tags                               = local.common_tags
}

module "r2" {
  source = "../../modules/r2"

  name_prefix           = local.name_prefix
  environment           = local.environment
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = module.cloudflare_dns.zone_id
  domain_name           = var.domain_name
  r2_bucket_location    = var.r2_bucket_location
}

module "identity_verification" {
  source = "../../modules/identity-verification"

  name_prefix       = local.name_prefix
  ecs_task_role_id  = module.iam.ecs_task_role_id
  ecs_task_role_arn = module.iam.ecs_task_role_arn
  common_tags       = local.common_tags
}

# CloudWatch Alarms - ENABLED IN PRODUCTION
module "cloudwatch_alarms" {
  source = "../../modules/cloudwatch-alarms"

  name_prefix            = local.name_prefix
  enabled                = true
  db_instance_identifier = module.rds.db_instance_identifier
  common_tags            = local.common_tags
}
