# Production Infrastructure

This directory contains Terraform configuration for the production infrastructure on AWS.

## Architecture Overview

- **ECS Fargate**: Containerized frontend and backend services with autoscaling
- **RDS Aurora Serverless v2**: PostgreSQL database with automatic scaling
- **Application Load Balancer (ALB)**: Routes traffic to frontend and backend services
- **EventBridge**: Scheduled cronjobs using ECS RunTask
- **VPC**: Multi-AZ setup with public/private/database subnets
- **CloudWatch**: Logging and monitoring

## Cost Optimization Features

1. **No NAT Gateways**: ECS tasks run in public subnets with public IPs, saving ~$64/month
2. **Aurora Serverless v2**: Auto-scales from 0.5 ACU (min) to 16 ACU (max) based on load
3. **ECS Autoscaling**: Scales services based on CPU and memory utilization
4. **EventBridge + ECS RunTask**: Cronjobs only run when scheduled, not continuously
5. **CloudWatch Logs Retention**: 7 days by default (configurable)
6. **Fargate Spot** (optional): Can be enabled for additional cost savings

## Resource Requirements

### Backend API Service (0.5 vCPU / 1.5GB RAM)

The backend API service is configured with **0.5 vCPU and 1.5GB RAM** because it handles:

- **HTTP requests/responses**: Standard Express.js API endpoints
- **Database queries**: PostgreSQL connection pooling
- **File uploads**: Handling file uploads to R2/S3 storage (no processing)
- **Webhook handling**: Payment webhooks and notifications

**Note**: Playwright, Crawlee, and Sharp image processing are **NOT** used in the main API service. They run in separate cronjob tasks.

### Cronjob Resources

**Lightweight jobs** (sync-payments, notifications, etc.):

- **0.25 vCPU / 0.5GB RAM** - Sufficient for database operations and simple processing

**Scraping jobs** (event scraping with Playwright/Crawlee):

- **1 vCPU / 2GB RAM** (minimum) - Each Playwright browser instance uses 300-500MB RAM
- Use `cronjob_scraping_cpu` and `cronjob_scraping_memory` variables when creating scraping task definitions
- For heavy scraping, consider 2 vCPU / 4GB RAM

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0
3. Terraform Cloud workspace configured (or remove cloud block)
4. Domain name configured in Cloudflare (for DNS and SSL)

## Setup Instructions

### 1. Configure Variables

Copy the example variables file and fill in your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your configuration:

- Domain name
- Database credentials
- Image tags
- Scaling parameters

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan and Apply

```bash
terraform plan
terraform apply
```

### 4. Configure DNS

After applying, you'll need to:

1. **Add ALB DNS to Cloudflare**:

   - Get the ALB DNS name from outputs: `terraform output alb_dns_name`
   - Create A record in Cloudflare pointing `api.${domain_name}` to the ALB DNS
   - Create A record for `${domain_name}` and `www.${domain_name}` to the ALB DNS

2. **Configure SSL Certificate**:
   - Get certificate validation records: `terraform output acm_certificate_validation_records`
   - Add DNS validation records to Cloudflare
   - Wait for certificate validation (can take a few minutes)

### 5. Deploy Docker Images

Push your Docker images to ECR:

```bash
# Get ECR repository URLs
terraform output backend_ecr_repository_url
terraform output frontend_ecr_repository_url

# Login to ECR
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin <ECR_URL>

# Build and push backend
cd ../../apps/backend
docker build -t <ECR_URL>:latest .
docker push <ECR_URL>:latest

# Build and push frontend
cd ../frontend
docker build -t <ECR_URL>:latest .
docker push <ECR_URL>:latest
```

### 6. Update ECS Services

After pushing images, update ECS services to use the new images:

```bash
# Update backend service
aws ecs update-service \
  --cluster revendiste-production-cluster \
  --service revendiste-production-backend \
  --force-new-deployment \
  --region sa-east-1

# Update frontend service
aws ecs update-service \
  --cluster revendiste-production-cluster \
  --service revendiste-production-frontend \
  --force-new-deployment \
  --region sa-east-1
```

## Important Notes

### Cronjobs

Cronjobs run via EventBridge + ECS RunTask using standalone scripts. Each job:

- Exports a `runXxx()` function that executes the job logic once
- Exports a `startXxx()` function that starts a cron scheduler (dev/local only)
- Is registered in `scripts/run-job.ts` for production execution
- Has an EventBridge rule and ECS task definition in Terraform

**To add a new cronjob or change schedules**, see:

- `apps/backend/docs/ADDING_CRONJOBS.md` - Complete guide
- Update the cron expression in both the job file and Terraform EventBridge rule

### Database Credentials

Database credentials are stored in AWS Secrets Manager. The secret ARN is available in outputs:

```bash
terraform output db_secret_arn
```

To retrieve credentials:

```bash
aws secretsmanager get-secret-value \
  --secret-id <secret-arn> \
  --region sa-east-1
```

### Environment Variables

Backend services need access to:

- `DATABASE_URL`: Retrieved from Secrets Manager automatically
- Other environment variables: Add to ECS task definitions or use Secrets Manager

### Monitoring

- **CloudWatch Container Insights**: Enabled on ECS cluster
- **CloudWatch Logs**: Available in `/ecs/revendiste-production-*` log groups
- **RDS Performance Insights**: Enabled with 7-day retention
- **ALB Access Logs**: Can be enabled (commented out in `alb.tf`)

### Scaling

Autoscaling is configured for:

- **Backend**: 1-10 tasks based on CPU (70%) and memory (80%)
- **Frontend**: 1-10 tasks based on CPU (70%) and memory (80%)
- **RDS**: 0.5-16 ACUs based on load (Aurora Serverless v2)

Adjust targets in `terraform.tfvars` based on your needs.

### Security

- All traffic goes through Cloudflare (IP ranges restricted in security groups)
- RDS is in isolated database subnets, only accessible from ECS tasks
- ECS tasks run in public subnets with public IPs (protected by security groups)
- Security groups restrict ECS task ingress to ALB only
- ALB is in public subnets
- All data encrypted at rest (RDS, ECR, Secrets Manager)
- HTTPS enforced (HTTP redirects to HTTPS)

**Note**: ECS tasks have public IPs but are still secure because:

- Security groups only allow inbound traffic from the ALB
- No direct internet access to containers (all traffic goes through ALB)
- RDS remains in isolated subnets without internet access

### Cost Estimation

Approximate monthly costs (varies by usage):

- **ECS Fargate**: ~$30-100 (2 tasks × 0.5 vCPU × 1GB × 730 hours)
- **RDS Aurora Serverless v2**: ~$50-200 (scales with usage, 0.5-16 ACUs)
- **ALB**: ~$20-30 (fixed cost)
- **NAT Gateway**: $0 (removed - ECS tasks use public IPs instead)
- **Data Transfer**: Variable
- **CloudWatch Logs**: ~$5-10 (7-day retention)

**Total**: ~$105-340/month (varies significantly with traffic and usage)

**Cost Savings**: ~$64/month by removing NAT Gateways (ECS tasks run in public subnets with public IPs)

To reduce costs further:

- Reduce RDS max capacity
- Reduce ECS task counts
- Use Fargate Spot (add to task definitions)
- Reduce CloudWatch logs retention period

## Troubleshooting

### ECS Tasks Not Starting

1. Check CloudWatch Logs for errors
2. Verify task definition has correct image tag
3. Check security groups allow traffic
4. Verify Secrets Manager permissions

### Database Connection Issues

1. Verify `DATABASE_URL` secret is correctly formatted
2. Check RDS security group allows traffic from ECS tasks
3. Verify RDS cluster is in correct subnets

### ALB Health Checks Failing

1. Verify health check path is correct (`/api/health` for backend, `/` for frontend)
2. Check security groups allow ALB → ECS traffic
3. Verify containers are listening on correct ports

### Cronjobs Not Running

1. Check EventBridge rules are enabled
2. Verify IAM roles have correct permissions
3. Check CloudWatch Logs for cronjob tasks
4. Verify task definitions use correct image and command

## Outputs

Key outputs available:

- `alb_dns_name`: DNS name for the load balancer
- `rds_cluster_endpoint`: Database endpoint (sensitive)
- `db_secret_arn`: Secrets Manager ARN for database credentials
- `ecs_cluster_name`: ECS cluster name
- `backend_ecr_repository_url`: Backend ECR repository URL
- `frontend_ecr_repository_url`: Frontend ECR repository URL

View all outputs:

```bash
terraform output
```
