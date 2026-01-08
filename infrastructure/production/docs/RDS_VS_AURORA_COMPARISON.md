# RDS vs Aurora: Cost & Capacity Comparison

## Cost Savings: RDS vs Aurora

### Current Configuration (sa-east-1 region)

#### Standard RDS PostgreSQL (db.t3.medium)
- **Instance**: db.t3.medium (2 vCPU, 4GB RAM)
- **Monthly Cost Breakdown**:
  - Compute: ~$25/month (730 hours × $0.034/hour)
  - Storage (20GB): ~$2.30/month ($0.115/GB-month)
  - Backup Storage: ~$1-2/month (varies)
  - I/O Requests: ~$1-2/month (first 20M free)
  - **Total: ~$30-32/month**

#### Aurora Serverless v2 (Minimum Capacity)
- **Configuration**: 0.5-16 ACUs (scaling)
- **Monthly Cost Breakdown**:
  - Compute (0.5 ACU average): ~$45/month (730 hours × $0.062/hour per ACU)
  - Storage (20GB): ~$2.30/month ($0.115/GB-month)
  - Backup Storage: ~$1-2/month
  - I/O Requests: ~$2-3/month
  - Performance Insights: ~$3-5/month (if enabled)
  - **Total: ~$55-60/month** (at minimum capacity)

#### Aurora Serverless v2 (Scaling to 2 ACU average)
- **Configuration**: 0.5-16 ACUs (scaling to 2 ACU average)
- **Monthly Cost**: ~$90-100/month
- **When this happens**: During traffic spikes, heavy queries, or sustained load

### Cost Savings Summary

| Scenario | RDS Cost | Aurora Cost | Monthly Savings | Annual Savings |
|---------|----------|------------|----------------|----------------|
| **Minimum Load** (0.5 ACU avg) | $30 | $60 | **$30/month** | **$360/year** |
| **Moderate Load** (1 ACU avg) | $30 | $75 | **$45/month** | **$540/year** |
| **Heavy Load** (2 ACU avg) | $30 | $100 | **$70/month** | **$840/year** |
| **Peak Load** (4 ACU avg) | $30 | $180 | **$150/month** | **$1,800/year** |

**Note**: RDS cost stays fixed at ~$30/month regardless of load (until you upgrade instance size).

## Capacity Limits: When to Switch to Aurora

### RDS db.t3.medium Capacity

**Specifications:**
- **vCPU**: 2 cores
- **RAM**: 4GB
- **Network**: Up to 5 Gbps
- **Max Connections**: ~200-300 (PostgreSQL default formula: `(RAM in MB / 10) + connections`)

**Real-World Capacity:**

| Metric | Capacity | When to Upgrade |
|--------|----------|-----------------|
| **Concurrent Users** | 200-500 users | >500 concurrent users |
| **Concurrent DB Connections** | 200-300 connections | >300 active connections |
| **Queries per Second (QPS)** | 500-1,000 QPS | >1,000 QPS sustained |
| **Read-Heavy Workload** | Good | Need read replicas |
| **Write-Heavy Workload** | Good | Need higher I/O |
| **Storage** | Auto-scales 20GB→100GB | >100GB |

### When to Switch to Aurora

#### Switch to Aurora When:

1. **Connection Limits**:
   - ✅ **Current**: <300 concurrent connections
   - ⚠️ **Upgrade**: >300 concurrent connections
   - **Aurora Benefit**: Better connection pooling, higher limits

2. **Read Replicas Needed**:
   - ✅ **Current**: Single database sufficient
   - ⚠️ **Upgrade**: Need read replicas for read-heavy workloads
   - **Aurora Benefit**: Up to 15 read replicas (vs 5 for RDS)

3. **High Availability Required**:
   - ✅ **Current**: Can tolerate brief downtime
   - ⚠️ **Upgrade**: Need <30 second failover
   - **Aurora Benefit**: Multi-AZ with automatic failover

4. **Variable/Unpredictable Traffic**:
   - ✅ **Current**: Predictable traffic patterns
   - ⚠️ **Upgrade**: Highly variable traffic (10x spikes)
   - **Aurora Benefit**: Auto-scaling ACUs (0.5-16)

5. **Performance at Scale**:
   - ✅ **Current**: <1,000 QPS, <500 concurrent users
   - ⚠️ **Upgrade**: >1,000 QPS, >500 concurrent users
   - **Aurora Benefit**: 5x throughput, better performance

6. **Storage Growth**:
   - ✅ **Current**: <100GB storage
   - ⚠️ **Upgrade**: >100GB storage
   - **Aurora Benefit**: Auto-scaling storage, better I/O

### Migration Thresholds

**Stay on RDS if:**
- <500 concurrent users
- <300 concurrent DB connections
- <1,000 QPS sustained
- Predictable traffic patterns
- Single database sufficient (no read replicas needed)
- Can tolerate brief maintenance windows

**Switch to Aurora if:**
- >500 concurrent users
- >300 concurrent DB connections
- >1,000 QPS sustained
- Need read replicas (read-heavy workload)
- Need <30 second failover (high availability)
- Highly variable traffic (10x spikes)
- >100GB storage with high I/O

### Cost-Effective Upgrade Path

Instead of switching to Aurora immediately, consider:

1. **Upgrade RDS Instance** (cheaper than Aurora):
   - db.t3.medium → db.t3.large: ~$60/month (2x capacity)
   - db.t3.large → db.t3.xlarge: ~$120/month (4x capacity)
   - Still cheaper than Aurora Serverless v2 at similar capacity

2. **Add Read Replicas** (if read-heavy):
   - RDS: Up to 5 read replicas
   - Cost: ~$30/month per replica
   - Still cheaper than Aurora for read scaling

3. **Switch to Aurora** (when you need):
   - Multi-AZ high availability
   - >5 read replicas
   - Auto-scaling for unpredictable traffic
   - Maximum performance

## Monitoring & Decision Making

### Key Metrics to Monitor

1. **DatabaseConnections**: Should stay <250 (80% of 300 limit)
2. **CPUUtilization**: Should stay <70% average
3. **FreeableMemory**: Should stay >1GB free
4. **ReadLatency**: Should stay <10ms average
5. **WriteLatency**: Should stay <20ms average

### CloudWatch Alarms to Set

```hcl
# Alert when approaching connection limit
- DatabaseConnections > 250 (80% of limit)

# Alert when CPU is consistently high
- CPUUtilization > 70% for 5 minutes

# Alert when memory is low
- FreeableMemory < 1GB

# Alert when latency is high
- ReadLatency > 50ms
- WriteLatency > 100ms
```

## Recommendation for Your Use Case

**Current Stage (Pre-launch, 0 users):**
- ✅ **Use RDS db.t3.medium** (~$30/month)
- ✅ Handles hundreds of concurrent users
- ✅ 35% cost savings vs Aurora
- ✅ Easy migration path when needed

**Early Growth (100-500 users):**
- ✅ **Stay on RDS db.t3.medium**
- ✅ Monitor connection count and CPU
- ✅ Upgrade to db.t3.large if needed (~$60/month)

**Scale Stage (500-2,000 users):**
- ⚠️ **Consider Aurora** if:
  - Need read replicas
  - Need high availability
  - Highly variable traffic
- ✅ **Or upgrade RDS** to db.t3.large/xlarge first

**Enterprise Stage (2,000+ users):**
- ✅ **Use Aurora** for:
  - High availability
  - Read replicas
  - Auto-scaling
  - Maximum performance

## Summary

**Cost Savings:**
- **Minimum**: $30/month (54% savings)
- **Moderate**: $45/month (60% savings)
- **Heavy**: $70/month (70% savings)

**Capacity:**
- **RDS db.t3.medium**: Handles 200-500 concurrent users easily
- **Switch to Aurora**: When >500 users, need HA, or need read replicas

**Best Strategy:**
1. Start with RDS db.t3.medium (~$30/month)
2. Monitor metrics closely
3. Upgrade RDS instance size if needed (cheaper than Aurora)
4. Switch to Aurora when you need HA, read replicas, or auto-scaling
