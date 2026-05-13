# Revendiste Dev Environment
#
# Single-EC2 "VPS" architecture: one always-on Graviton EC2 runs the
# backend, frontend, in-VM Postgres, and Caddy via Docker Compose. Cronjobs run
# in-process on the backend (ENABLE_INPROCESS_CRONJOBS=true). Migrated from the
# previous ECS Fargate + ALB + EventBridge + RDS + Bastion stack — see
# .cursor/plans/single_ec2_vps_migration_*.plan.md for the rationale.
#
# Removed (formerly in this file): module "alb", "ecs", "cronjobs",
# "service_discovery", "bastion", "rds", "iam"; aws_iam_role_policy
# "eventbridge_ecs_run_task". The module/source files still exist under
# infrastructure/modules/ for prod and for rollback per docs/ROLLBACK_TO_ECS.md.

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
      name = "revendiste-development"
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
  environment = "dev"
  name_prefix = "revendiste-dev"

  common_tags = {
    Environment = local.environment
    ManagedBy   = "terraform"
    Application = "revendiste"
  }
}

# ============================================================================
# Kept (cheap and needed)
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

module "ecr" {
  source = "../../modules/ecr"

  name_prefix           = local.name_prefix
  environment           = local.environment
  image_retention_count = 10 # Keep fewer images in dev
  common_tags           = local.common_tags
}

module "secrets" {
  source = "../../modules/secrets"

  name_prefix = local.name_prefix
  environment = local.environment
  common_tags = local.common_tags
}

# ============================================================================
# Single-EC2 app host (replaces ECS Fargate + ALB + Bastion + RDS for dev)
# ============================================================================

module "ec2_app" {
  source = "../../modules/ec2-app"

  name_prefix    = local.name_prefix
  environment    = local.environment
  aws_region     = var.aws_region
  aws_account_id = data.aws_caller_identity.current.account_id

  vpc_id    = module.vpc.vpc_id
  subnet_id = module.vpc.public_subnet_ids[0]

  instance_type        = "t4g.small" # Bump to t4g.medium if Postgres + Chromium pressure shows up.
  data_volume_size_gb  = 50
  root_volume_size_gb  = 20

  cloudflare_ip_ranges   = var.cloudflare_ip_ranges
  cloudflare_ipv6_ranges = var.cloudflare_ipv6_ranges

  ecr_backend_repository_arn  = module.ecr.backend_repository_arn
  ecr_frontend_repository_arn = module.ecr.frontend_repository_arn
  backend_secrets_arn         = module.secrets.backend_secrets_arn

  # Dev: the module mints a Postgres password into a fresh Secrets Manager
  # secret and exports its ARN. Backend-entrypoint.sh reads it via
  # bootstrap-env.sh on every boot.
  create_db_credentials_secret = true
  db_username                  = var.db_username
  db_name                      = var.db_name
  db_host                      = "postgres" # docker-compose service name
  db_port                      = 5432

  app_hostname = var.domain_name
  image_tag    = var.backend_image_tag

  common_tags = local.common_tags
}

# Cloudflare DNS now points the dev hostname at the EC2 EIP. The cloudflare_dns
# module supports either an ALB CNAME target (prod today) or an EIP A-record
# target (this dev env).
module "cloudflare_dns" {
  source = "../../modules/cloudflare-dns"

  zone_name         = "revendiste.com"
  domain_name       = var.domain_name
  origin_ip         = module.ec2_app.instance_public_ip
  create_www_record = false # Skip www.dev.revendiste.com (nested subdomain SSL).
  common_tags       = local.common_tags
  # alb_dns_name and acm_certificate_domain_validation_options intentionally
  # left at their defaults (empty) — there is no ALB or ACM cert in dev.
}

module "r2" {
  source = "../../modules/r2"

  name_prefix           = local.name_prefix
  environment           = local.environment
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = module.cloudflare_dns.zone_id
  zone_name             = "revendiste.com"
  domain_name           = var.domain_name
  cdn_subdomain         = "dev-cdn"
  r2_bucket_location    = var.r2_bucket_location
}

module "identity_verification" {
  source = "../../modules/identity-verification"

  name_prefix = local.name_prefix
  # Face Liveness IAM is now attached to the EC2 instance role (was the ECS
  # task role under the ECS architecture). The module's variables are still
  # named `ecs_task_role_*` for prod compat — that's fine, the policy just
  # binds to whichever IAM role we pass in.
  ecs_task_role_id  = module.ec2_app.instance_role_name
  ecs_task_role_arn = module.ec2_app.instance_role_arn
  common_tags       = local.common_tags

  additional_face_liveness_principals = [
    "arn:aws:iam::521402383324:user/revendiste-local-dev"
  ]
}

# NO CloudWatch alarms in dev (disabled to save costs and reduce noise)
