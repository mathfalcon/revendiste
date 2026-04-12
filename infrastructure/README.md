# Revendiste Infrastructure

Module-based Terraform infrastructure for deploying Revendiste to AWS with Cloudflare.

## Directory Structure

```
infrastructure/
├── modules/                    # Reusable Terraform modules
│   ├── vpc/                    # VPC, subnets, route tables
│   ├── security-groups/        # ALB, ECS, RDS security groups
│   ├── rds/                    # RDS PostgreSQL instance
│   ├── ecr/                    # ECR repositories
│   ├── secrets/                # Secrets Manager
│   ├── iam/                    # IAM roles and policies
│   ├── alb/                    # Application Load Balancer
│   ├── ecs/                    # ECS cluster, services, task definitions
│   ├── service-discovery/      # AWS Cloud Map
│   ├── cronjobs/               # EventBridge scheduled tasks
│   ├── cloudflare-dns/         # DNS records and page rules
│   ├── r2/                     # Cloudflare R2 buckets
│   ├── cloudwatch-alarms/      # RDS monitoring (optional)
│   └── identity-verification/  # AWS Rekognition IAM
│
├── environments/
│   ├── dev/                    # Development environment
│   │   ├── main.tf             # Module wiring with minimum resources
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars.example
│   │
│   └── prod/                   # Production environment
│       ├── main.tf             # Module wiring with full resources
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars.example
│
├── dev/                        # [LEGACY] Old EC2-based dev - TO BE REMOVED
└── production/                 # [LEGACY] Old production - TO BE REMOVED
```

## Environment Differences

| Resource | Dev | Prod |
|----------|-----|------|
| **RDS** | db.t4g.micro (1GB) | db.t4g.micro → db.t4g.small |
| **ECS Backend** | 256 CPU / 512 MB | 512 CPU / 1024 MB |
| **ECS Frontend** | 256 CPU / 512 MB | 256 CPU / 512 MB |
| **Desired Tasks** | 1 each | 1+ each |
| **CloudWatch Alarms** | Disabled | Enabled |
| **Cronjob: sync-payments** | Every 15 min | Every 5 min |
| **Cronjob: scrape-events** | Every 2 hours | Every 30 min |
| **Cronjob: notifications** | Every 15 min | Every 5 min |
| **Cronjob: others** | Every 4 hours | Every hour |
| **Log Retention** | 3 days | 7 days |
| **Deletion Protection** | Disabled | Enabled |
| **Final Snapshot** | Skipped | Required |

## Getting Started

### Prerequisites

1. [Terraform](https://www.terraform.io/downloads) >= 1.5.0
2. [Terraform Cloud](https://app.terraform.io/) account
3. AWS credentials configured
4. Cloudflare API token

### Setup Terraform Cloud Workspaces

1. Create workspace `revendiste-dev` in Terraform Cloud
2. Create workspace `revendiste-prod` in Terraform Cloud
3. Configure variables in each workspace:
   - `cloudflare_api_token` (sensitive)
   - `cloudflare_account_id` (sensitive)

### Deploy Dev Environment

```bash
cd infrastructure/environments/dev

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

### Deploy Production Environment

```bash
cd infrastructure/environments/prod

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

### Connect to RDS from your laptop (Session Manager)

RDS is private; use the SSM bastion and port forwarding. See **[Connect to the deployed database](../docs/connect_to_deployed_db.md)** for prerequisites, verifying the plugin, and the `terraform output -raw db_tunnel_command` workflow.

## Estimated Monthly Costs

| Environment | Monthly Cost |
|-------------|--------------|
| **Dev** | ~$35-40 |
| **Prod** | ~$50-60 |

Cost breakdown:
- RDS db.t4g.micro: ~$10/month
- ECS Fargate (2 services): ~$10-20/month
- ALB: ~$16/month
- Other (logs, secrets, etc.): ~$5/month

## Migrating from Legacy Infrastructure

The legacy `infrastructure/dev/` (EC2-based) and `infrastructure/production/` directories will be removed after migration.

### Migration Steps

1. Deploy new dev environment using `environments/dev/`
2. Verify everything works
3. Update CI/CD pipelines to use new ECR repositories
4. Destroy old dev EC2 instance:
   ```bash
   cd infrastructure/dev
   terraform destroy
   ```
5. Remove legacy directories

## Module Reference

### VPC Module

Creates VPC with public, private, and database subnets.

```hcl
module "vpc" {
  source = "../../modules/vpc"
  
  name_prefix        = "revendiste-dev"
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["sa-east-1a", "sa-east-1b"]
}
```

### RDS Module

Creates PostgreSQL database with encryption and credentials in Secrets Manager.

```hcl
module "rds" {
  source = "../../modules/rds"
  
  name_prefix           = "revendiste-dev"
  environment           = "dev"
  db_instance_class     = "db.t4g.micro"
  deletion_protection   = false  # true for prod
  skip_final_snapshot   = true   # false for prod
}
```

### ECS Module

Creates ECS cluster, task definitions (backend, frontend, cronjobs), and services.

```hcl
module "ecs" {
  source = "../../modules/ecs"
  
  name_prefix           = "revendiste-dev"
  backend_cpu           = 256   # 512 for prod
  backend_memory        = 512   # 1024 for prod
  backend_desired_count = 1
}
```

### Cronjobs Module

Creates EventBridge rules for scheduled tasks with configurable frequencies.

```hcl
module "cronjobs" {
  source = "../../modules/cronjobs"
  
  # Less frequent schedules for dev
  sync_payments_schedule = "cron(*/15 * * * ? *)"  # Every 15 min
  scrape_events_schedule = "cron(0 */2 * * ? *)"   # Every 2 hours
}
```
