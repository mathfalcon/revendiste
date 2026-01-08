# CloudWatch Alarms Setup Guide

## Cost

**CloudWatch Alarms are very cheap:**
- ✅ **First 10 alarms: FREE**
- 💰 **Additional alarms: $0.10/month per alarm**
- 📊 **Metric evaluations: First 1M evaluations/month FREE, then $0.10 per 1,000**

**Our setup: 6 alarms = FREE** (all under the 10 alarm limit)

## Alarms Created

### 1. Database Connections Alarm
- **Metric**: `DatabaseConnections`
- **Threshold**: >250 connections (80% of ~300 limit)
- **Action**: Alert when approaching connection limit
- **When to act**: Consider upgrading to larger instance or adding connection pooling

### 2. CPU Utilization Alarm
- **Metric**: `CPUUtilization`
- **Threshold**: >70% for 10 minutes
- **Action**: Alert when CPU is consistently high
- **When to act**: Consider upgrading instance (db.t3.large) or optimizing queries

### 3. Freeable Memory Alarm
- **Metric**: `FreeableMemory`
- **Threshold**: <1GB free (db.t3.medium has 4GB total)
- **Action**: Alert when memory is low
- **When to act**: Database may be under memory pressure - consider upgrading

### 4. Read Latency Alarm
- **Metric**: `ReadLatency`
- **Threshold**: >50ms average
- **Action**: Alert when read operations are slow
- **When to act**: Check for slow queries, missing indexes, or need for read replicas

### 5. Write Latency Alarm
- **Metric**: `WriteLatency`
- **Threshold**: >100ms average
- **Action**: Alert when write operations are slow
- **When to act**: Check for slow queries, missing indexes, or I/O bottlenecks

### 6. Free Storage Space Alarm
- **Metric**: `FreeStorageSpace`
- **Threshold**: <20GB free (80% of 100GB max)
- **Action**: Alert when approaching storage limit
- **When to act**: Increase `db_max_allocated_storage` in Terraform or clean up old data

## Setting Up Email Notifications

### Step 1: Get SNS Topic ARN

After deploying Terraform, get the SNS topic ARN:

```bash
terraform output rds_alarms_sns_topic_arn
```

Or find it in AWS Console: SNS → Topics → `revendiste-production-rds-alarms`

### Step 2: Subscribe Your Email

**Option A: AWS CLI**
```bash
aws sns subscribe \
  --topic-arn <SNS_TOPIC_ARN> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

**Option B: AWS Console**
1. Go to SNS → Topics
2. Select `revendiste-production-rds-alarms`
3. Click "Create subscription"
4. Protocol: Email
5. Endpoint: your-email@example.com
6. Click "Create subscription"

### Step 3: Confirm Subscription

Check your email and click the confirmation link in the subscription email.

## Viewing Alarms

### AWS Console
1. Go to CloudWatch → Alarms
2. Filter by: `revendiste-production-rds-*`
3. View alarm status and history

### AWS CLI
```bash
# List all RDS alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix revendiste-production-rds-

# Get alarm details
aws cloudwatch describe-alarms \
  --alarm-names revendiste-production-rds-database-connections-high
```

## Alarm States

- **OK**: Metric is within normal range
- **ALARM**: Metric has exceeded threshold
- **INSUFFICIENT_DATA**: Not enough data to evaluate (normal during startup)

## Customizing Thresholds

Edit `cloudwatch-alarms.tf` to adjust thresholds:

```hcl
# Example: Lower CPU threshold to 60%
resource "aws_cloudwatch_metric_alarm" "rds_cpu_utilization" {
  # ...
  threshold = 60  # Changed from 70
  # ...
}
```

Then apply:
```bash
terraform plan
terraform apply
```

## Adding More Alarms

You can add more alarms (still free up to 10 total). Example:

```hcl
# Alarm for high I/O
resource "aws_cloudwatch_metric_alarm" "rds_io_consumption" {
  alarm_name          = "${local.name_prefix}-rds-io-consumption-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "IOPS"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Sum"
  threshold           = 1000
  # ... rest of config
}
```

## Cost Monitoring

Monitor CloudWatch costs:
- **Alarms**: Free (under 10 alarms)
- **Metrics**: Free for standard RDS metrics
- **Custom metrics**: $0.30 per metric per month (if you add any)

**Total cost for these alarms: $0/month** ✅

## Troubleshooting

### Alarms not triggering
- Check that RDS instance is running
- Verify metric names match (case-sensitive)
- Check evaluation periods (alarm needs 2-3 periods to trigger)

### Too many false alarms
- Increase `evaluation_periods` (requires more consecutive breaches)
- Increase `threshold` (higher tolerance)
- Adjust `period` (longer time window)

### Not receiving emails
- Check spam folder
- Verify email subscription is confirmed
- Check SNS topic has subscribers
- Verify alarm is in ALARM state (not OK or INSUFFICIENT_DATA)

## Best Practices

1. **Start with conservative thresholds** - Adjust based on actual usage
2. **Monitor alarm history** - Review which alarms trigger most often
3. **Set up multiple notification channels** - Email + Slack/PagerDuty for critical alerts
4. **Review alarms weekly** - Tune thresholds based on patterns
5. **Document actions** - When alarms trigger, document what you did

## Integration with Other Services

### Slack Integration
1. Create Slack webhook
2. Subscribe SNS topic to HTTPS endpoint (use Lambda function)
3. Format messages for Slack

### PagerDuty Integration
1. Create PagerDuty integration
2. Subscribe SNS topic to PagerDuty endpoint
3. Configure escalation policies

### Lambda Function for Custom Actions
Create Lambda function that:
- Receives SNS notifications
- Performs automated remediation
- Sends to multiple channels
- Logs to CloudWatch
