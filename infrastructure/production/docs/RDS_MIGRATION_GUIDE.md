# RDS Migration Guide: Standard PostgreSQL ↔ Aurora

This guide explains how to migrate between standard RDS PostgreSQL and Aurora PostgreSQL.

## Current Setup: Standard RDS PostgreSQL

- **Instance**: `db.t3.medium` (2 vCPU, 4GB RAM)
- **Cost**: ~$30/month
- **Engine**: PostgreSQL 15.15 (latest available in sa-east-1)
- **Storage**: Auto-scaling 20GB → 100GB

## Why Standard RDS Instead of Aurora?

1. **Cost Savings**: ~$35/month cheaper than Aurora Serverless v2 at minimum capacity
2. **Predictable Costs**: Fixed pricing vs variable ACU costs
3. **Same PostgreSQL Engine**: Easy migration path
4. **Sufficient for Scale**: db.t3.medium handles hundreds of concurrent users easily

## When to Migrate to Aurora?

Consider migrating to Aurora when:

- **High Availability Required**: Need multi-AZ failover
- **Read Replicas Needed**: Heavy read workloads
- **Auto-Scaling Critical**: Highly variable traffic patterns
- **Performance at Scale**: Need >4GB RAM or >2 vCPU consistently

## Migration Path: Standard RDS → Aurora

### Option 1: AWS Database Migration Service (DMS) - Recommended

**Pros:**

- Zero downtime migration
- Continuous replication during migration
- Automatic schema migration

**Steps:**

1. **Create Aurora Cluster** (using Terraform or AWS Console):

   ```hcl
   # In rds.tf, replace aws_db_instance with:
   resource "aws_rds_cluster" "main" {
     cluster_identifier = "${local.name_prefix}-aurora-cluster"
     engine             = "aurora-postgresql"
     engine_version     = var.db_engine_version
     # ... other config
   }
   ```

2. **Set up DMS Replication Instance**:

   ```bash
   aws dms create-replication-instance \
     --replication-instance-identifier revendiste-dms \
     --replication-instance-class dms.t3.medium \
     --allocated-storage 50
   ```

3. **Create Source and Target Endpoints**:

   - Source: Standard RDS PostgreSQL
   - Target: Aurora Cluster

4. **Create and Start Migration Task**:

   - Full load + CDC (Change Data Capture) for zero downtime
   - Monitor replication lag

5. **Switch Application**:

   - Update Secrets Manager with Aurora endpoint
   - Redeploy ECS tasks

6. **Verify and Cleanup**:
   - Verify data integrity
   - Stop DMS task
   - Decommission old RDS instance

### Option 2: pg_dump/pg_restore - Simpler but Requires Downtime

**Pros:**

- Simple, well-tested method
- No additional AWS services needed

**Cons:**

- Requires maintenance window (downtime)
- No continuous replication

**Steps:**

1. **Create Aurora Cluster** (same as Option 1)

2. **Take Final Backup**:

   ```bash
   pg_dump -h <rds-endpoint> -U <username> -d <database> \
     --format=custom --file=backup.dump
   ```

3. **Restore to Aurora**:

   ```bash
   pg_restore -h <aurora-endpoint> -U <username> -d <database> \
     --no-owner --no-acl backup.dump
   ```

4. **Update Application**:

   - Update Secrets Manager
   - Redeploy ECS tasks

5. **Verify and Cleanup**:
   - Verify data integrity
   - Delete old RDS instance

## Migration Path: Aurora → Standard RDS

Same process in reverse:

- Use DMS or pg_dump/pg_restore
- Update Terraform to use `aws_db_instance` instead of `aws_rds_cluster`
- Update Secrets Manager endpoints
- Redeploy ECS tasks

## Application Code Changes

**No code changes needed!** Both use the same PostgreSQL protocol:

- Same connection string format
- Same SQL syntax
- Same Kysely queries work identically

Only the endpoint URL changes (in Secrets Manager).

## Cost Comparison

| Setup                             | Monthly Cost | Best For                         |
| --------------------------------- | ------------ | -------------------------------- |
| Standard RDS (db.t3.medium)       | ~$30         | Pre-launch, low-medium traffic   |
| Aurora Serverless v2 (0.5-16 ACU) | ~$65-150     | Variable traffic, auto-scaling   |
| Aurora Provisioned (db.t3.medium) | ~$60         | High availability, read replicas |

## Terraform State Migration

When switching between RDS types:

1. **Backup Terraform State**:

   ```bash
   terraform state pull > state-backup.json
   ```

2. **Remove Old Resource**:

   ```bash
   terraform state rm aws_db_instance.main  # or aws_rds_cluster.main
   ```

3. **Import New Resource** (if created manually):

   ```bash
   terraform import aws_rds_cluster.main <cluster-id>
   ```

4. **Apply Changes**:
   ```bash
   terraform plan  # Review changes
   terraform apply
   ```

## Monitoring During Migration

- **CloudWatch Metrics**: Monitor CPU, memory, connections
- **DMS Replication Lag**: Should be <1 second
- **Application Errors**: Watch for connection issues
- **Performance**: Compare query times before/after

## Rollback Plan

If migration fails:

1. Keep old RDS instance running
2. Revert Secrets Manager to old endpoint
3. Redeploy ECS tasks
4. Investigate issues
5. Retry migration
