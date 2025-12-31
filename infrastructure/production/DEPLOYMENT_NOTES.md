# Production Deployment Notes

## Quick Start Checklist

- [ ] Copy `terraform.tfvars.example` to `terraform.tfvars` and configure
- [ ] Run `terraform init` and `terraform plan`
- [ ] Review the plan and apply with `terraform apply`
- [ ] Configure DNS records in Cloudflare (ALB DNS from outputs)
- [ ] Add ACM certificate validation records to Cloudflare
- [ ] Build and push Docker images to ECR
- [ ] Update ECS services to use new images
- [ ] Verify health checks are passing
- [ ] Test cronjobs are running (check CloudWatch Logs)

## Key Differences from Dev

1. **Separate Services**: Frontend and backend run as separate ECS services (not combined with nginx)
2. **ALB Routing**: ALB routes based on hostname:
   - `api.${domain}` → Backend service
   - `${domain}` and `www.${domain}` → Frontend service
3. **Autoscaling**: Both ECS and RDS autoscale based on usage
4. **Cronjobs**: Run via EventBridge + ECS RunTask (not in main backend service)
5. **High Availability**: Multi-AZ deployment with load balancing

## Cronjobs Implementation

**Current Status**: Cronjobs use EventBridge to trigger ECS tasks that start the job cron schedulers and run for 5 minutes.

**Recommended Improvement**: Create a `run-job.ts` script in the backend that can execute job logic once:

```typescript
// apps/backend/src/scripts/run-job.ts
import {db} from './db';
// ... imports for jobs

const jobName = process.argv[2];

async function runJob() {
  switch (jobName) {
    case 'sync-payments':
      // Execute sync-payments logic once
      break;
    case 'notify-upload':
      // Execute notify-upload logic once
      break;
    // ... other jobs
  }
  process.exit(0);
}

runJob();
```

Then update cronjob task definitions to use:
```bash
command = ["node", "dist/scripts/run-job.js", "sync-payments"]
```

## Database Connection

The backend should construct `DATABASE_URL` from Secrets Manager fields:

```typescript
const secret = await secretsManager.getSecretValue({...});
const {username, password, host, port, dbname} = JSON.parse(secret.SecretString);
const databaseUrl = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${dbname}`;
```

Or use individual fields if your database client supports it.

## Cost Optimization Tips

1. **NAT Gateways Removed**: ECS tasks run in public subnets with public IPs, saving ~$64/month
2. **Start Small**: Begin with minimum capacity and scale up as needed
3. **Monitor Usage**: Use CloudWatch to track actual resource usage
4. **Reserved Capacity**: Consider Reserved Instances for predictable workloads
5. **Spot Instances**: Can use Fargate Spot for additional savings (add to task definitions)

**Note**: While ECS tasks have public IPs, they remain secure because security groups only allow inbound traffic from the ALB. RDS stays in isolated database subnets without internet access.

## Security Checklist

- [ ] Cloudflare IP ranges are correctly configured
- [ ] RDS is in private subnets only
- [ ] ECS tasks run in private subnets
- [ ] Security groups follow least-privilege principle
- [ ] Secrets are stored in Secrets Manager (not environment variables)
- [ ] SSL/TLS is enforced (HTTP redirects to HTTPS)
- [ ] Database encryption is enabled
- [ ] CloudWatch logs retention is configured

## Monitoring Setup

1. **CloudWatch Dashboard**: Create a dashboard for key metrics
2. **Alarms**: Set up alarms for:
   - High CPU/Memory utilization
   - Failed health checks
   - Database connection errors
   - Task failures
3. **Log Insights**: Use CloudWatch Logs Insights for querying logs
4. **X-Ray** (optional): Enable AWS X-Ray for distributed tracing

## Backup and Recovery

- **RDS Backups**: Automated daily backups with 7-day retention (configurable)
- **Final Snapshots**: Created before cluster deletion
- **ECR Images**: Keep last 20 images (configurable in lifecycle policies)
- **Terraform State**: Managed by Terraform Cloud (backed up automatically)

## Troubleshooting Commands

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster revendiste-production-cluster \
  --services revendiste-production-backend \
  --region sa-east-1

# View recent CloudWatch logs
aws logs tail /ecs/revendiste-production-backend --follow --region sa-east-1

# Check RDS cluster status
aws rds describe-db-clusters \
  --db-cluster-identifier revendiste-production-aurora-cluster \
  --region sa-east-1

# List EventBridge rules
aws events list-rules --region sa-east-1 | grep revendiste-production

# Check recent EventBridge invocations
aws events list-rule-names-by-target \
  --target-arn <ecs-cluster-arn> \
  --region sa-east-1
```

