# RDS Alarm Response Playbook

This document provides step-by-step actions to take when each CloudWatch alarm triggers.

## Quick Reference

| Alarm                | Severity    | Immediate Action             | Upgrade Threshold |
| -------------------- | ----------- | ---------------------------- | ----------------- |
| Database Connections | ⚠️ Warning  | Check connection pooling     | >250 sustained    |
| CPU Utilization      | ⚠️ Warning  | Check queries, optimize      | >70% sustained    |
| Freeable Memory      | 🔴 Critical | Check memory usage           | <1GB sustained    |
| Read Latency         | ⚠️ Warning  | Check slow queries           | >50ms sustained   |
| Write Latency        | ⚠️ Warning  | Check I/O, indexes           | >100ms sustained  |
| Free Storage Space   | ⚠️ Warning  | Clean up or increase storage | <20GB free        |

---

## 1. Database Connections Alarm

**Alarm**: `revendiste-production-rds-database-connections-high`  
**Trigger**: DatabaseConnections > 250 for 10 minutes  
**Severity**: ⚠️ Warning

### What It Means

- Your database is approaching its connection limit (~300 for db.t3.medium)
- Too many concurrent connections from your application
- May indicate connection pool misconfiguration

### Immediate Actions (First 5 minutes)

1. **Check Current Connections**

   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name DatabaseConnections \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Maximum,Average
   ```

2. **Check Application Connection Pools**

   - Review backend connection pool settings
   - Check for connection leaks (connections not being closed)
   - Verify connection pool size matches your needs

3. **Check Active Queries**

   ```sql
   -- Connect to database and run:
   SELECT count(*) as active_connections
   FROM pg_stat_activity
   WHERE state = 'active';

   SELECT pid, usename, application_name, state, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY query_start;
   ```

### Short-term Fixes (Next 30 minutes)

1. **Optimize Connection Pooling**

   - Reduce connection pool size if too large
   - Ensure connections are properly closed
   - Add connection timeout settings

2. **Kill Idle Connections** (if safe)

   ```sql
   -- Kill idle connections older than 5 minutes
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
     AND state_change < now() - interval '5 minutes';
   ```

3. **Check for Connection Leaks**
   - Review application code for unclosed connections
   - Check for long-running transactions
   - Verify connection pool configuration

### Long-term Solutions

1. **Upgrade Instance** (if consistently >250 connections)

   - Upgrade to `db.t3.large` (~$60/month, 4 vCPU, 8GB RAM)
   - Supports ~600 connections
   - Or switch to Aurora for better connection handling

2. **Add Read Replicas** (if read-heavy workload)

   - Distribute read queries to replicas
   - Reduces connections to primary database

3. **Optimize Application**
   - Implement connection pooling at application level
   - Use connection multiplexing
   - Cache frequently accessed data

### When to Escalate

- Connections consistently >280 (approaching hard limit)
- Application errors due to connection limits
- Cannot reduce connections through optimization

---

## 2. CPU Utilization Alarm

**Alarm**: `revendiste-production-rds-cpu-utilization-high`  
**Trigger**: CPUUtilization > 70% for 10 minutes  
**Severity**: ⚠️ Warning

### What It Means

- Database CPU is consistently high
- May indicate inefficient queries or high load
- Database may struggle to handle requests

### Immediate Actions (First 5 minutes)

1. **Check Current CPU Usage**

   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name CPUUtilization \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Maximum,Average
   ```

2. **Identify Top CPU-Consuming Queries**

   ```sql
   -- Find queries consuming most CPU
   SELECT
     pid,
     usename,
     application_name,
     state,
     query,
     query_start,
     now() - query_start as duration
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY query_start
   LIMIT 10;
   ```

3. **Check for Long-Running Queries**
   ```sql
   -- Find queries running longer than 1 minute
   SELECT
     pid,
     usename,
     query,
     state,
     now() - query_start as duration
   FROM pg_stat_activity
   WHERE state = 'active'
     AND now() - query_start > interval '1 minute'
   ORDER BY query_start;
   ```

### Short-term Fixes (Next 30 minutes)

1. **Kill Problematic Queries** (if safe)

   ```sql
   -- Identify problematic query PID first, then:
   SELECT pg_terminate_backend(<pid>);
   ```

2. **Check for Missing Indexes**

   ```sql
   -- Find tables with high sequential scans
   SELECT
     schemaname,
     tablename,
     seq_scan,
     seq_tup_read,
     idx_scan,
     seq_tup_read / seq_scan as avg_seq_read
   FROM pg_stat_user_tables
   WHERE seq_scan > 0
   ORDER BY seq_tup_read DESC
   LIMIT 10;
   ```

3. **Review Slow Query Log**
   - Enable `log_min_duration_statement` if not enabled
   - Review CloudWatch Logs for slow queries
   - Identify queries taking >1 second

### Long-term Solutions

1. **Add Indexes**

   - Add indexes on frequently queried columns
   - Review query execution plans
   - Use `EXPLAIN ANALYZE` to optimize queries

2. **Optimize Queries**

   - Rewrite inefficient queries
   - Add query result caching
   - Use pagination for large result sets

3. **Upgrade Instance** (if CPU consistently >70%)

   - Upgrade to `db.t3.large` (~$60/month, 4 vCPU)
   - Or switch to Aurora for better performance

4. **Add Read Replicas** (if read-heavy)
   - Distribute read queries
   - Reduces CPU load on primary

### When to Escalate

- CPU consistently >85% (approaching 100%)
- Application experiencing slowdowns
- Cannot optimize queries further

---

## 3. Freeable Memory Alarm

**Alarm**: `revendiste-production-rds-freeable-memory-low`  
**Trigger**: FreeableMemory < 1GB for 10 minutes  
**Severity**: 🔴 Critical

### What It Means

- Database is running low on memory (db.t3.medium has 4GB total)
- May cause performance degradation or OOM errors
- Database may start swapping to disk (very slow)

### Immediate Actions (First 5 minutes)

1. **Check Current Memory Usage**

   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name FreeableMemory \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Minimum,Average
   ```

2. **Check Memory-Related Metrics**

   ```bash
   # Check swap usage (if available)
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name SwapUsage \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Maximum
   ```

3. **Check Database Cache Usage**

   ```sql
   -- Check shared buffer usage
   SHOW shared_buffers;

   -- Check cache hit ratio (should be >95%)
   SELECT
     sum(heap_blks_read) as heap_read,
     sum(heap_blks_hit) as heap_hit,
     (sum(heap_blks_hit) - sum(heap_blks_read)) / sum(heap_blks_hit) as ratio
   FROM pg_statio_user_tables;
   ```

### Short-term Fixes (Next 30 minutes)

1. **Check for Memory Leaks**

   - Review long-running queries
   - Check for large result sets in memory
   - Review connection pool settings

2. **Optimize Shared Buffers** (if possible)

   - PostgreSQL uses shared_buffers for caching
   - Default is usually 25% of total memory
   - May need to adjust (requires parameter group)

3. **Kill Memory-Intensive Queries** (if safe)
   ```sql
   -- Find queries using most memory
   SELECT
     pid,
     usename,
     query,
     state,
     now() - query_start as duration
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY query_start
   LIMIT 10;
   ```

### Long-term Solutions

1. **Upgrade Instance** (if memory consistently low)

   - Upgrade to `db.t3.large` (~$60/month, 8GB RAM)
   - Or `db.t3.xlarge` (~$120/month, 16GB RAM)
   - Or switch to Aurora for better memory management

2. **Optimize Database Configuration**

   - Adjust `shared_buffers` (requires parameter group)
   - Optimize `work_mem` per query
   - Review `maintenance_work_mem` settings

3. **Optimize Queries**

   - Reduce result set sizes
   - Use pagination
   - Add query result caching

4. **Add Read Replicas** (if read-heavy)
   - Distribute read load
   - Reduces memory pressure on primary

### When to Escalate

- Memory <500MB free (critical)
- Database experiencing OOM errors
- Performance severely degraded
- Cannot optimize further

---

## 4. Read Latency Alarm

**Alarm**: `revendiste-production-rds-read-latency-high`  
**Trigger**: ReadLatency > 50ms for 15 minutes  
**Severity**: ⚠️ Warning

### What It Means

- Read operations are taking longer than expected
- May indicate slow queries, missing indexes, or I/O issues
- Users may experience slow page loads

### Immediate Actions (First 5 minutes)

1. **Check Current Read Latency**

   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name ReadLatency \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Maximum,Average
   ```

2. **Identify Slow Read Queries**

   ```sql
   -- Find slow SELECT queries
   SELECT
     pid,
     usename,
     query,
     state,
     now() - query_start as duration
   FROM pg_stat_activity
   WHERE state = 'active'
     AND query ILIKE 'SELECT%'
   ORDER BY query_start
   LIMIT 10;
   ```

3. **Check I/O Metrics**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name ReadIOPS \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Maximum,Average
   ```

### Short-term Fixes (Next 30 minutes)

1. **Check for Missing Indexes**

   ```sql
   -- Find tables with high sequential scans
   SELECT
     schemaname,
     tablename,
     seq_scan,
     seq_tup_read,
     idx_scan,
     seq_tup_read / seq_scan as avg_seq_read
   FROM pg_stat_user_tables
   WHERE seq_scan > 0
   ORDER BY seq_tup_read DESC
   LIMIT 10;
   ```

2. **Review Query Execution Plans**

   ```sql
   -- Use EXPLAIN ANALYZE on slow queries
   EXPLAIN ANALYZE SELECT ...;
   ```

3. **Check Cache Hit Ratio**
   ```sql
   -- Should be >95% for good performance
   SELECT
     sum(heap_blks_read) as heap_read,
     sum(heap_blks_hit) as heap_hit,
     CASE
       WHEN sum(heap_blks_hit) = 0 THEN 0
       ELSE (sum(heap_blks_hit)::float / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100
     END as cache_hit_ratio
   FROM pg_statio_user_tables;
   ```

### Long-term Solutions

1. **Add Indexes**

   - Add indexes on frequently queried columns
   - Review query patterns
   - Use composite indexes for multi-column queries

2. **Optimize Queries**

   - Rewrite inefficient queries
   - Use appropriate JOIN types
   - Add query result caching

3. **Add Read Replicas** (if read-heavy)

   - Distribute read queries to replicas
   - Reduces load on primary database
   - Improves read performance

4. **Upgrade Storage** (if I/O bound)
   - Upgrade to Provisioned IOPS (io1/io2)
   - Or upgrade instance for better I/O performance

### When to Escalate

- Read latency >200ms (severe)
- Users reporting slow page loads
- Cannot optimize queries further

---

## 5. Write Latency Alarm

**Alarm**: `revendiste-production-rds-write-latency-high`  
**Trigger**: WriteLatency > 100ms for 15 minutes  
**Severity**: ⚠️ Warning

### What It Means

- Write operations (INSERT, UPDATE, DELETE) are slow
- May indicate I/O bottlenecks, missing indexes, or high write load
- Users may experience slow form submissions or updates

### Immediate Actions (First 5 minutes)

1. **Check Current Write Latency**

   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name WriteLatency \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Maximum,Average
   ```

2. **Identify Slow Write Queries**

   ```sql
   -- Find slow INSERT/UPDATE/DELETE queries
   SELECT
     pid,
     usename,
     query,
     state,
     now() - query_start as duration
   FROM pg_stat_activity
   WHERE state = 'active'
     AND (query ILIKE 'INSERT%' OR query ILIKE 'UPDATE%' OR query ILIKE 'DELETE%')
   ORDER BY query_start
   LIMIT 10;
   ```

3. **Check I/O Metrics**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name WriteIOPS \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Maximum,Average
   ```

### Short-term Fixes (Next 30 minutes)

1. **Check for Lock Contention**

   ```sql
   -- Find blocked queries
   SELECT
     blocked_locks.pid AS blocked_pid,
     blocked_activity.usename AS blocked_user,
     blocking_locks.pid AS blocking_pid,
     blocking_activity.usename AS blocking_user,
     blocked_activity.query AS blocked_statement,
     blocking_activity.query AS blocking_statement
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;
   ```

2. **Check for Missing Indexes on Foreign Keys**

   ```sql
   -- Foreign keys without indexes can slow down writes
   SELECT
     tc.table_name,
     kcu.column_name,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY';
   ```

3. **Review Write Query Patterns**
   - Check for bulk inserts/updates
   - Review transaction sizes
   - Check for unnecessary indexes on write-heavy tables

### Long-term Solutions

1. **Optimize Write Queries**

   - Use batch inserts instead of individual inserts
   - Reduce transaction sizes
   - Use appropriate indexes (not too many on write-heavy tables)

2. **Add Indexes Strategically**

   - Add indexes only where needed
   - Remove unused indexes (they slow down writes)
   - Use partial indexes for filtered queries

3. **Upgrade Storage** (if I/O bound)

   - Upgrade to Provisioned IOPS (io1/io2)
   - Or upgrade instance for better I/O performance

4. **Optimize Database Configuration**
   - Adjust `checkpoint_segments` (if using older PostgreSQL)
   - Optimize `wal_buffers`
   - Review `shared_buffers` settings

### When to Escalate

- Write latency >500ms (severe)
- Users reporting slow form submissions
- Cannot optimize queries further

---

## 6. Free Storage Space Alarm

**Alarm**: `revendiste-production-rds-free-storage-space-low`  
**Trigger**: FreeStorageSpace < 20GB for 10 minutes  
**Severity**: ⚠️ Warning

### What It Means

- Database storage is approaching the limit (100GB max_allocated_storage)
- May cause database to stop accepting writes if storage fills up
- Need to either clean up data or increase storage limit

### Immediate Actions (First 5 minutes)

1. **Check Current Storage Usage**

   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name FreeStorageSpace \
     --dimensions Name=DBInstanceIdentifier,Value=revendiste-production-postgres \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Minimum,Average
   ```

2. **Check Database Size**

   ```sql
   -- Check total database size
   SELECT pg_size_pretty(pg_database_size(current_database()));

   -- Check size by table
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
   LIMIT 10;
   ```

3. **Check for Large Tables**
   ```sql
   -- Find largest tables
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
     pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
   FROM pg_tables
   WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
   LIMIT 10;
   ```

### Short-term Fixes (Next 30 minutes)

1. **Clean Up Old Data** (if applicable)

   ```sql
   -- Example: Delete old records (adjust based on your schema)
   -- DELETE FROM old_table WHERE created_at < NOW() - INTERVAL '90 days';
   ```

2. **Vacuum Database**

   ```sql
   -- Vacuum to reclaim space from deleted rows
   VACUUM FULL;

   -- Or vacuum specific table
   VACUUM FULL table_name;
   ```

3. **Check for Unused Indexes**
   ```sql
   -- Find unused indexes (can be dropped to free space)
   SELECT
     schemaname,
     tablename,
     indexname,
     pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0
   ORDER BY pg_relation_size(indexrelid) DESC;
   ```

### Long-term Solutions

1. **Increase Storage Limit** (in Terraform)

   ```hcl
   # In terraform.tfvars
   db_max_allocated_storage = 200  # Increase from 100 to 200GB
   ```

   Then apply:

   ```bash
   terraform plan
   terraform apply
   ```

2. **Implement Data Archival**

   - Archive old data to S3 or R2
   - Keep only recent data in database
   - Use partitioning for time-series data

3. **Optimize Data Storage**

   - Use appropriate data types (avoid TEXT for small strings)
   - Compress large text fields
   - Use JSONB efficiently

4. **Regular Maintenance**
   - Schedule regular VACUUM jobs
   - Monitor storage growth trends
   - Set up automated cleanup jobs

### When to Escalate

- Storage <10GB free (critical - database may stop accepting writes)
- Cannot clean up data
- Storage growing faster than expected

---

## General Troubleshooting

### If Multiple Alarms Trigger Simultaneously

1. **Check for Correlated Issues**

   - High CPU + High Memory = May need instance upgrade
   - High Connections + High CPU = May need connection pooling
   - High Latency + High I/O = May need storage upgrade

2. **Check Application Load**

   - Review application logs
   - Check for traffic spikes
   - Review recent deployments

3. **Check Database Health**
   ```sql
   -- Overall database health check
   SELECT
     count(*) as total_connections,
     count(*) FILTER (WHERE state = 'active') as active_connections,
     count(*) FILTER (WHERE state = 'idle') as idle_connections
   FROM pg_stat_activity;
   ```

### Emergency Procedures

If database becomes unresponsive:

1. **Check RDS Console**

   - Verify instance is running
   - Check for maintenance windows
   - Review recent events

2. **Check CloudWatch Logs**

   - Review PostgreSQL logs
   - Look for errors or warnings
   - Check for OOM errors

3. **Contact AWS Support** (if needed)
   - Use AWS Support Console
   - Provide alarm details and metrics
   - Request urgent assistance

### Preventive Measures

1. **Regular Monitoring**

   - Review alarms weekly
   - Check trends in CloudWatch
   - Document patterns

2. **Proactive Optimization**

   - Review slow queries regularly
   - Add indexes before they're needed
   - Clean up old data proactively

3. **Capacity Planning**
   - Monitor growth trends
   - Plan upgrades before limits are reached
   - Set up budget alerts

---

## Contact & Escalation

- **On-Call Engineer**: [Your contact info]
- **AWS Support**: [Support plan details]
- **Emergency**: [Escalation procedure]

---

## Document Maintenance

- **Last Updated**: [Date]
- **Review Frequency**: Monthly
- **Owner**: DevOps Team
