# Revendiste Dev Infrastructure

Terraform configuration for deploying the Revendiste backend and frontend to AWS EC2 with Docker, using Cloudflare R2 for storage and AWS Secrets Manager for secrets.

## Architecture

- **Single EC2 Instance** (cost-optimized for dev):
  - Runs both frontend and backend Docker containers
  - Frontend: TanStack Start SSR server on port 3000
  - Backend: Express API on port 3001
  - Nginx reverse proxy routes traffic based on path:
    - `dev.revendiste.com/api` → backend container (port 3001)
    - `dev.revendiste.com` → frontend container (port 3000)
  - SSL/TLS and HTTP to HTTPS redirection via Cloudflare proxy
- **Cloudflare R2**: Object storage (S3-compatible)
- **AWS Secrets Manager**: Secrets management (single JSON secret, $0.40/month)
- **Cloudflare DNS**: DNS for `dev.revendiste.com` (serves both frontend and API at `/api`)
- **GitHub Actions**: Automated deployment on merge to `development` branch

## Prerequisites

1. **AWS Account** with:

   - Cloudflare zone for `revendiste.com`
   - AWS Key Pair for SSH access
   - Terraform Cloud workspace (or local backend)

2. **Cloudflare Account** with:

   - API token with R2 permissions
   - Account ID

3. **AWS ECR** (Container Registry):

   - ECR repositories created automatically by Terraform
   - IAM-based authentication (no credentials needed)

4. **GitHub Secrets** configured:
   - `AWS_ACCOUNT_ID`: Your AWS account ID (12 digits)
   - `AWS_ACCESS_KEY_ID`: AWS access key for GitHub Actions
   - `AWS_SECRET_ACCESS_KEY`: AWS secret key for GitHub Actions
   - `DEV_APP_HOST`: App EC2 public IP (set after Terraform apply)
   - `DEV_EC2_SSH_KEY`: Private SSH key for EC2 access
   - `VITE_APP_API_URL`: Frontend API URL (e.g., `https://dev.revendiste.com/api`)
   - `VITE_PLATFORM_COMMISSION_RATE`: Platform commission rate (default: `0.06`)
   - `VITE_VAT_RATE`: VAT rate (default: `0.22`)

## Setup

### 1. Create AWS Key Pair

```bash
aws ec2 create-key-pair --key-name revendiste-dev-keypair --query 'KeyMaterial' --output text > ~/.ssh/revendiste-dev-keypair.pem
chmod 400 ~/.ssh/revendiste-dev-keypair.pem
```

### 2. Generate GitHub Actions SSH Key

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions
# Add public key to terraform.tfvars
cat ~/.ssh/github-actions.pub
```

### 3. Create Cloudflare R2 API Token

1. Go to Cloudflare Dashboard → R2
2. Create API token with R2 permissions
3. Note your Account ID

### 4. Create R2 Access Key

1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create R2 Access Key
3. Save Access Key ID and Secret Access Key

### 5. Configure Terraform Variables

Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in all values:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 6. Initialize and Apply Terraform

```bash
cd infrastructure/dev
terraform init
terraform plan
terraform apply
```

**Important:** After `terraform apply`, you must manually populate the Secrets Manager secret (see step 7).

### 7. Populate Secrets Manager Secret

After Terraform creates the secret resource, manually populate it via AWS Console:

1. **Go to AWS Secrets Manager Console:**

   - Navigate to: https://console.aws.amazon.com/secretsmanager/
   - Find secret: `revendiste/dev/backend-secrets`

2. **Edit the secret:**
   - Click on the secret
   - Click "Retrieve secret value" → "Edit"
   - Select "Plaintext" tab
   - Paste the following JSON structure with your actual values:

```json
{
  "NODE_ENV": "development",
  "LOG_LEVEL": "info",
  "PORT": "3001",
  "POSTGRES_USER": "your-neon-user",
  "POSTGRES_PASSWORD": "your-neon-password",
  "POSTGRES_DB": "your-neon-database",
  "POSTGRES_HOST": "your-neon-host.neon.tech",
  "POSTGRES_PORT": "5432",
  "CLERK_PUBLISHABLE_KEY": "pk_test_...",
  "CLERK_SECRET_KEY": "sk_test_...",
  "DLOCAL_API_KEY": "your-dlocal-api-key",
  "DLOCAL_SECRET_KEY": "your-dlocal-secret-key",
  "DLOCAL_BASE_URL": "https://api.dlocal.com",
  "APP_BASE_URL": "https://dev.revendiste.com",
  "API_BASE_URL": "https://dev.revendiste.com/api",
  "STORAGE_TYPE": "s3",
  "AWS_S3_BUCKET": "revendiste-dev-storage",
  "AWS_S3_REGION": "auto",
  "AWS_ACCESS_KEY_ID": "your-r2-access-key-id",
  "AWS_SECRET_ACCESS_KEY": "your-r2-secret-access-key",
  "EMAIL_PROVIDER": "resend",
  "RESEND_API_KEY": "re_..."
}
```

3. **Save the secret**

**Why manual?** This ensures secrets never touch Terraform state, variables, or GitHub Actions, providing maximum security.

### 8. Create AWS IAM User for GitHub Actions

Create an IAM user with permissions to push to ECR:

```bash
# Create IAM user
aws iam create-user --user-name github-actions-ecr

# Attach ECR push/pull policy
aws iam attach-user-policy \
  --user-name github-actions-ecr \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

# Create access keys
aws iam create-access-key --user-name github-actions-ecr
```

### 9. Configure GitHub Secrets

After Terraform apply, note the EC2 public IPs from outputs, then set GitHub secrets:

- `AWS_ACCOUNT_ID`: Your AWS account ID (12 digits, e.g., `123456789012`)
- `AWS_ACCESS_KEY_ID`: Access key from IAM user created above
- `AWS_SECRET_ACCESS_KEY`: Secret key from IAM user created above
- `DEV_BACKEND_HOST`: Backend EC2 public IP (from Terraform output `backend_instance_public_ip`)
- `DEV_FRONTEND_HOST`: Frontend EC2 public IP (from Terraform output `frontend_instance_public_ip`)
- `DEV_EC2_SSH_KEY`: Contents of `~/.ssh/revendiste-dev-keypair.pem`
- `VITE_APP_API_URL`: `https://dev.revendiste.com/api`
- `VITE_PLATFORM_COMMISSION_RATE`: `0.06` (optional, has default)
- `VITE_VAT_RATE`: `0.22` (optional, has default)

### 10. Deploy

Merge to `development` branch to trigger automatic deployment!

The workflow will:

1. Build backend Docker image and push to ECR
2. Build frontend Docker image (SSR) and push to ECR
3. Deploy backend container to backend EC2 instance (loads secrets from Secrets Manager)
4. Deploy frontend container to frontend EC2 instance
5. Run health checks on both services

## Manual Deployment

If you need to deploy manually:

```bash
# Backend: SSH into backend EC2
ssh -i ~/.ssh/revendiste-dev-keypair.pem ec2-user@<BACKEND_EC2_IP>

# Load secrets
source /opt/revendiste/load-secrets.sh

# Pull and run backend Docker image
docker pull <your-backend-image>
docker run -d --name revendiste-backend \
  -p 3001:3001 \
  -e NODE_ENV=$NODE_ENV \
  # ... (all environment variables)
  <your-backend-image>

# Frontend: SSH into frontend EC2
ssh -i ~/.ssh/revendiste-dev-keypair.pem ec2-user@<FRONTEND_EC2_IP>

# Pull and run frontend Docker image
docker pull <your-frontend-image>
docker run -d --name revendiste-frontend \
  -p 3000:3000 \
  -e VITE_APP_API_URL=https://dev.revendiste.com/api \
  <your-frontend-image>
```

## Cost Estimate

- **EC2 t3.micro (Backend)**: ~$7-10/month
- **EC2 t3.micro (Frontend)**: ~$7-10/month
- **Elastic IPs (2x)**: Free (when attached to instances)
- **ECR Storage**: ~$0.10-0.20/month (1-2GB images, $0.10/GB)
- **ECR Data Transfer**: Free (within same region)
- **Cloudflare R2**: Free tier (10GB storage, 1M operations)
- **AWS Secrets Manager**: $0.40/month (single JSON secret)
- **Cloudflare DNS**: Free (included with Cloudflare account)

**Total: ~$15.40-21.40/month** for dev environment (two instances for SSR + Secrets Manager)

**ECR vs Docker Hub:**

- ✅ **ECR**: ~$0.10-0.20/month (much cheaper!)
- ❌ **Docker Hub**: $5/month for private repos
- ✅ **ECR**: Faster pulls (same region)
- ✅ **ECR**: IAM-based auth (more secure)
- ✅ **ECR**: No rate limits

## Files

- `main.tf`: Provider configuration and data sources
- `variables.tf`: Input variables
- `outputs.tf`: Output values
- `ec2.tf`: Single EC2 instance (frontend + backend), IAM role, Elastic IP
- `security-groups.tf`: Security group rules for the app instance
- `cloudflare_dns.tf`: DNS records (frontend and API)
- `r2.tf`: Cloudflare R2 bucket
- `ecr.tf`: ECR repositories for Docker images
- `secrets.tf`: AWS Secrets Manager secret (single JSON secret)
- `user-data-app.sh`: Combined app EC2 bootstrap script (installs Docker, nginx for both frontend and backend)

**Dockerfiles** are located in `/deploy` at the root of the repository:

- `deploy/backend.Dockerfile`: Backend Docker image
- `deploy/frontend.Dockerfile`: Frontend SSR Docker image

## Frontend Hosting (SSR)

The frontend runs as a **Server-Side Rendering (SSR) server** using TanStack Start:

- **Frontend instance**: Separate EC2 instance running Docker container
- **SSR server**: TanStack Start SSR server on port 3000
- **Frontend domain**: `dev.revendiste.com` → Frontend EC2 instance
- **Backend API**: `dev.revendiste.com/api` → Backend container (port 3001)
- **Benefits**:
  - ✅ Server-side rendering for SEO
  - ✅ Server functions work correctly
  - ✅ Production-like behavior
  - ✅ Better performance with SSR

The frontend container runs the TanStack Start SSR server, which handles:

- Server-side rendering of React components
- API routes and server functions
- SEO-friendly HTML output
- Streaming SSR support

## Troubleshooting

### Cannot SSH to EC2

- Check security group allows SSH from your IP
- Verify key pair name matches
- Check EC2 instance is running

### Docker image not pulling

- Verify AWS credentials in GitHub secrets
- Check EC2 IAM role has ECR pull permissions
- Verify ECR repository exists
- Check image tags are correct
- Verify ECR login: `aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.sa-east-1.amazonaws.com`

### Frontend not loading

- Check frontend container is running: `docker ps`
- View frontend container logs: `docker logs revendiste-frontend`
- Verify frontend container is accessible: `curl http://localhost:3000`
- Check security group allows port 3000
- Verify DNS points to frontend instance IP

### Secrets not loading

- **Verify secret is populated**: Secret must be manually created in AWS Console (see step 7 in Setup)
- Verify IAM role has Secrets Manager read permissions
- Check secret name matches: `revendiste/dev/backend-secrets`
- Verify secret exists in AWS Secrets Manager
- Test secret retrieval: `aws secretsmanager get-secret-value --secret-id revendiste/dev/backend-secrets`
- Verify JSON format is valid (all required fields present)

### Health check failing

- Check container logs: `docker logs revendiste-backend`
- Verify all environment variables are set
- Check database connectivity

### API not accessible

- Verify backend container is running: `docker ps`
- Check backend container logs: `docker logs revendiste-backend`
- Verify backend is accessible: `curl http://localhost:3001/health`
- Check security group allows port 3001
- Verify DNS points to backend instance IP
- Check frontend can reach backend (security group rules)
