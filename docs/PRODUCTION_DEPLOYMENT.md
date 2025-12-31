# Production Deployment Guide

This guide covers deploying the Revendiste application to production infrastructure on AWS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Infrastructure Setup](#initial-infrastructure-setup)
3. [Configuration](#configuration)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to production, ensure you have:

- **AWS Account** with appropriate permissions
- **AWS CLI** configured with credentials
- **Terraform** >= 1.5.0 installed
- **Terraform Cloud** workspace configured (or remove cloud block from `main.tf`)
- **Cloudflare Account** with API token and account ID
- **Domain Name** configured in Cloudflare (for DNS and SSL)
- **GitHub Repository** with Actions enabled
- **GitHub Secrets** configured:
  - `AWS_ACCOUNT_ID`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`

## Initial Infrastructure Setup

### 1. Configure Terraform Variables

Navigate to the production infrastructure directory:

```bash
cd infrastructure/production
```

Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your production values:

```hcl
# AWS Configuration
aws_region = "sa-east-1"

# Domain Configuration
domain_name = "revendiste.com"

# Cloudflare Configuration
cloudflare_api_token = "your-cloudflare-api-token"
cloudflare_account_id = "your-cloudflare-account-id"
r2_bucket_location = "WEUR" # Western Europe

# Database Configuration
db_name = "revendiste"
db_username = "revendiste_admin"

# ... other configuration values
```

### 2. Initialize Terraform

```bash
terraform init
```

This will:

- Download required providers (AWS, Cloudflare, Random)
- Initialize Terraform Cloud backend (if configured)

### 3. Review and Apply Infrastructure

Review the planned changes:

```bash
terraform plan
```

Apply the infrastructure:

```bash
terraform apply
```

This will create:

- VPC with public/private/database subnets
- RDS Aurora Serverless v2 cluster
- ECS Fargate cluster
- Application Load Balancer (ALB)
- ECR repositories for Docker images
- CloudWatch log groups
- EventBridge rules for cronjobs
- Security groups and IAM roles
- Cloudflare R2 buckets and DNS records

**Note**: This process can take 15-30 minutes, especially for RDS cluster creation.

### 4. Configure DNS Records

After infrastructure is created, configure DNS:

#### Get ALB DNS Name

```bash
terraform output alb_dns_name
```

#### Configure Cloudflare DNS

The Terraform configuration automatically creates DNS records via Cloudflare provider, but you may need to verify:

1. **Main domain**: `revendiste.com` → ALB (CNAME)
2. **WWW subdomain**: `www.revendiste.com` → ALB (CNAME)
3. **API subdomain**: `api.revendiste.com` → ALB (CNAME)

#### Configure SSL Certificate

Get certificate validation records:

```bash
terraform output acm_certificate_validation_records
```

Add the DNS validation records to Cloudflare. The certificate will be validated automatically once DNS records propagate (usually 5-10 minutes).

### 5. Configure Secrets

#### Database Credentials

Database credentials are automatically generated and stored in AWS Secrets Manager. Get the secret ARN:

```bash
terraform output db_secret_arn
```

The secret contains:

- `username`: Database username
- `password`: Auto-generated password
- `host`: RDS cluster endpoint
- `port`: 5432
- `dbname`: Database name
- `database_url`: Complete connection string

#### Backend Secrets

Create backend environment variables secret:

```bash
aws secretsmanager put-secret-value \
  --secret-id revendiste-production-backend-secrets \
  --secret-string '{
    "NODE_ENV": "production",
    "PORT": "3001",
    "CLERK_SECRET_KEY": "your-clerk-secret-key",
    "DLOCAL_SECRET_KEY": "your-dlocal-secret-key",
    "R2_ACCOUNT_ID": "your-r2-account-id",
    "R2_ACCESS_KEY_ID": "your-r2-access-key",
    "R2_SECRET_ACCESS_KEY": "your-r2-secret-key",
    "R2_PUBLIC_BUCKET": "production-revendiste-public",
    "R2_PRIVATE_BUCKET": "production-revendiste-private",
    "R2_CDN_DOMAIN": "cdn.revendiste.com",
    "STORAGE_TYPE": "r2",
    "APP_BASE_URL": "https://revendiste.com"
  }' \
  --region sa-east-1
```

**Important**: Replace placeholder values with your actual secrets.

## Deployment Methods

### Automated Deployment (Recommended)

The production deployment workflow is triggered automatically on:

- **Push to `main` branch**: Builds and deploys `latest` tagged images
- **Version tags** (`v*.*.*`): Builds versioned images and creates GitHub Release

#### Workflow Overview

1. **Build Backend**: Builds Docker image and pushes to ECR
2. **Build Frontend**: Builds Docker image and pushes to ECR
3. **Deploy Backend**: Updates ECS service to use new image
4. **Deploy Frontend**: Updates ECS service to use new image
5. **Health Checks**: Verifies services are healthy

#### Triggering Deployment

**Automatic** (on push to main):

```bash
git push origin main
```

**Manual** (via GitHub Actions UI):

1. Go to Actions → "Deploy to Production"
2. Click "Run workflow"
3. Select branch and click "Run workflow"

**Version Release** (Fully Automated):

1. Run the **Bump Version** workflow (Actions → Bump Version)
2. Review and merge the created PR
3. **Automatically**: The `auto-tag-version.yml` workflow will:
   - Detect the version bump PR merge
   - Extract the new version from package.json
   - Create and push the git tag (e.g., `v1.2.3`)
4. **Automatically**: The tag push triggers `deploy-production.yml` which:
   - Builds images tagged with version (e.g., `v1.2.3`, `1.2`, `1`, `latest`)
   - Deploys to ECS
   - Creates GitHub Release with deployment information

**Manual Tag** (if needed):

```bash
# Only use if auto-tag workflow fails
git tag v1.2.3
git push origin v1.2.3
```

### Manual Deployment

If you need to deploy manually:

#### 1. Build and Push Docker Images

**Backend**:

```bash
# Login to ECR
aws ecr get-login-password --region sa-east-1 | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.sa-east-1.amazonaws.com

# Build and push
docker build -f deploy/backend.Dockerfile -t revendiste/backend:latest .
docker tag revendiste/backend:latest \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.sa-east-1.amazonaws.com/revendiste/backend-production:latest
docker push \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.sa-east-1.amazonaws.com/revendiste/backend-production:latest
```

**Frontend**:

```bash
docker build -f deploy/frontend.Dockerfile \
  --build-arg ENVIRONMENT=production \
  -t revendiste/frontend:latest .
docker tag revendiste/frontend:latest \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.sa-east-1.amazonaws.com/revendiste/frontend-production:latest
docker push \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.sa-east-1.amazonaws.com/revendiste/frontend-production:latest
```

#### 2. Update ECS Services

**Backend**:

```bash
aws ecs update-service \
  --cluster revendiste-production-cluster \
  --service revendiste-production-backend \
  --force-new-deployment \
  --region sa-east-1
```

**Frontend**:

```bash
aws ecs update-service \
  --cluster revendiste-production-cluster \
  --service revendiste-production-frontend \
  --force-new-deployment \
  --region sa-east-1
```

#### 3. Wait for Deployment

Monitor deployment status:

```bash
aws ecs wait services-stable \
  --cluster revendiste-production-cluster \
  --services revendiste-production-backend revendiste-production-frontend \
  --region sa-east-1
```

## Post-Deployment Verification

### 1. Check Service Health

**Backend Health Check**:

```bash
curl https://api.revendiste.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Frontend Health Check**:

```bash
curl https://revendiste.com
```

Should return HTML (status 200).

### 2. Verify ECS Services

```bash
aws ecs describe-services \
  --cluster revendiste-production-cluster \
  --services revendiste-production-backend revendiste-production-frontend \
  --region sa-east-1 \
  --query 'services[*].[serviceName,runningCount,desiredCount,status]' \
  --output table
```

All services should show:

- `runningCount` == `desiredCount`
- `status` == `ACTIVE`

### 3. Check CloudWatch Logs

**Backend Logs**:

```bash
aws logs tail /ecs/revendiste-production-backend --follow --region sa-east-1
```

**Frontend Logs**:

```bash
aws logs tail /ecs/revendiste-production-frontend --follow --region sa-east-1
```

**Cronjob Logs**:

```bash
aws logs tail /ecs/revendiste-production-cronjob --follow --region sa-east-1
```

### 4. Verify Cronjobs

Check EventBridge rules:

```bash
aws events list-rules --region sa-east-1 | grep revendiste-production
```

Verify cronjobs are running by checking CloudWatch Logs for each job:

- `sync-payments`: Every 5 minutes
- `notify-upload`: Hourly
- `check-payout`: Hourly
- `scrape-events`: Every 30 minutes

### 5. Test Application Features

- [ ] User authentication works
- [ ] API endpoints respond correctly
- [ ] File uploads work (R2 storage)
- [ ] Database connections are stable
- [ ] Frontend loads and displays correctly

## Monitoring and Maintenance

### CloudWatch Dashboards

Create a dashboard to monitor:

- ECS service metrics (CPU, memory, task count)
- ALB metrics (request count, response times, error rates)
- RDS metrics (CPU, connections, storage)
- Application logs

### Alarms

Set up CloudWatch alarms for:

- **High CPU/Memory**: Alert when utilization > 80%
- **Failed Health Checks**: Alert on consecutive failures
- **Task Failures**: Alert when tasks fail to start
- **Database Issues**: Alert on connection errors or high latency

### Regular Maintenance Tasks

#### Update Infrastructure

```bash
cd infrastructure/production
terraform plan
terraform apply
```

#### Rotate Secrets

Update secrets in AWS Secrets Manager:

```bash
aws secretsmanager put-secret-value \
  --secret-id <secret-arn> \
  --secret-string '{"key": "new-value"}' \
  --region sa-east-1
```

After updating secrets, restart ECS services to pick up new values.

#### Database Backups

RDS Aurora automatically creates daily backups with 7-day retention. To create a manual snapshot:

```bash
aws rds create-db-cluster-snapshot \
  --db-cluster-snapshot-identifier revendiste-production-snapshot-$(date +%Y%m%d) \
  --db-cluster-identifier revendiste-production-aurora-cluster \
  --region sa-east-1
```

#### Clean Up Old ECR Images

ECR lifecycle policies automatically keep the last 20 images. To manually clean up:

```bash
# List images
aws ecr list-images \
  --repository-name revendiste/backend-production \
  --region sa-east-1

# Delete old images (be careful!)
aws ecr batch-delete-image \
  --repository-name revendiste/backend-production \
  --image-ids imageTag=old-tag \
  --region sa-east-1
```

## Troubleshooting

### Service Won't Start

**Check ECS Service Events**:

```bash
aws ecs describe-services \
  --cluster revendiste-production-cluster \
  --services revendiste-production-backend \
  --region sa-east-1 \
  --query 'services[0].events[:5]'
```

**Common Issues**:

- **Task definition errors**: Check container definition JSON
- **Image pull errors**: Verify ECR image exists and IAM permissions
- **Secrets errors**: Verify secrets exist and IAM role has permissions
- **Health check failures**: Check application logs for startup errors

### Database Connection Issues

**Check RDS Status**:

```bash
aws rds describe-db-clusters \
  --db-cluster-identifier revendiste-production-aurora-cluster \
  --region sa-east-1
```

**Verify Security Groups**:

- ECS tasks security group must allow outbound to RDS security group
- RDS security group must allow inbound from ECS tasks security group on port 5432

**Test Connection**:

```bash
# Get database endpoint
terraform output rds_cluster_endpoint

# Test connection (requires psql)
psql -h <endpoint> -U revendiste_admin -d revendiste
```

### High Resource Usage

**Check ECS Metrics**:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=revendiste-production-backend \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region sa-east-1
```

**Solutions**:

- Increase task CPU/memory allocation
- Scale up desired task count
- Optimize application code
- Check for memory leaks

### Cronjobs Not Running

**Check EventBridge Rules**:

```bash
aws events describe-rule \
  --name revendiste-production-scrape-events \
  --region sa-east-1
```

**Check Recent Invocations**:

```bash
aws events list-targets-by-rule \
  --rule revendiste-production-scrape-events \
  --region sa-east-1
```

**View Cronjob Logs**:

```bash
aws logs tail /ecs/revendiste-production-cronjob \
  --filter-pattern "scrape-events" \
  --follow \
  --region sa-east-1
```

### SSL Certificate Issues

**Check Certificate Status**:

```bash
aws acm describe-certificate \
  --certificate-arn $(terraform output -raw acm_certificate_arn) \
  --region sa-east-1
```

**Common Issues**:

- DNS validation records not added to Cloudflare
- Certificate not attached to ALB listener
- Domain mismatch

### Rollback Deployment

If a deployment causes issues, rollback to previous task definition:

```bash
# List task definitions
aws ecs list-task-definitions \
  --family-prefix revendiste-production-backend \
  --region sa-east-1 \
  --sort DESC

# Update service to use previous revision
aws ecs update-service \
  --cluster revendiste-production-cluster \
  --service revendiste-production-backend \
  --task-definition revendiste-production-backend:<previous-revision> \
  --region sa-east-1
```

## Version Release Process

For versioned releases, use the automated workflow:

1. **Bump Version**: Go to Actions → "Bump Version" → Run workflow
2. **Select Version Type**: Choose patch, minor, or major
3. **Review PR**: The workflow creates a PR with version updates
4. **Merge PR**: After review, merge the PR
5. **Automatic Tag**: `auto-tag-version.yml` creates and pushes the tag
6. **Automatic Deployment**: `deploy-production.yml` builds and deploys

See [Version Management Guide](./VERSION_MANAGEMENT.md) for detailed information.

## Additional Resources

- [Infrastructure README](../infrastructure/production/README.md)
- [Deployment Notes](../infrastructure/production/DEPLOYMENT_NOTES.md)
- [Version Management](./VERSION_MANAGEMENT.md)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## Support

For issues or questions:

1. Check CloudWatch Logs for error messages
2. Review this troubleshooting guide
3. Check infrastructure documentation
4. Review GitHub Actions workflow logs
