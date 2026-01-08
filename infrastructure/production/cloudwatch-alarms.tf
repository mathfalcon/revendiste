# CloudWatch Alarms for RDS Monitoring
# Cost: First 10 alarms are FREE, then $0.10/month per alarm
# These 6 alarms are all FREE
# SNS email subscriptions are FREE (SMS/phone calls cost money)

# SNS Topic for Alarm Notifications
resource "aws_sns_topic" "rds_alarms" {
  name = "${local.name_prefix}-rds-alarms"

  tags = {
    Name = "${local.name_prefix}-rds-alarms-topic"
  }
}

# Alarm: Database Connections (Warning when approaching limit)
# Alert when >250 connections (80% of ~300 limit for db.t3.medium)
resource "aws_cloudwatch_metric_alarm" "rds_database_connections" {
  alarm_name          = "${local.name_prefix}-rds-database-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 250
  alarm_description   = "Alert when database connections exceed 250 (80% of limit)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.rds_alarms.arn]

  tags = {
    Name = "${local.name_prefix}-rds-database-connections-alarm"
  }
}

# Alarm: CPU Utilization (Warning when consistently high)
# Alert when CPU >70% for 5 minutes (indicates need to scale up)
resource "aws_cloudwatch_metric_alarm" "rds_cpu_utilization" {
  alarm_name          = "${local.name_prefix}-rds-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Alert when CPU utilization exceeds 70% for 10 minutes - consider upgrading instance"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.rds_alarms.arn]

  tags = {
    Name = "${local.name_prefix}-rds-cpu-utilization-alarm"
  }
}

# Alarm: Freeable Memory (Critical when low)
# Alert when free memory <1GB (db.t3.medium has 4GB total)
resource "aws_cloudwatch_metric_alarm" "rds_freeable_memory" {
  alarm_name          = "${local.name_prefix}-rds-freeable-memory-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 1073741824 # 1GB in bytes
  alarm_description   = "Alert when freeable memory drops below 1GB - database may be under memory pressure"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.rds_alarms.arn]

  tags = {
    Name = "${local.name_prefix}-rds-freeable-memory-alarm"
  }
}

# Alarm: Read Latency (Warning when slow)
# Alert when read latency >50ms (indicates performance issues)
resource "aws_cloudwatch_metric_alarm" "rds_read_latency" {
  alarm_name          = "${local.name_prefix}-rds-read-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 0.05 # 50ms in seconds
  alarm_description   = "Alert when read latency exceeds 50ms - may indicate performance issues"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.rds_alarms.arn]

  tags = {
    Name = "${local.name_prefix}-rds-read-latency-alarm"
  }
}

# Alarm: Write Latency (Warning when slow)
# Alert when write latency >100ms (indicates performance issues)
resource "aws_cloudwatch_metric_alarm" "rds_write_latency" {
  alarm_name          = "${local.name_prefix}-rds-write-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 0.1 # 100ms in seconds
  alarm_description   = "Alert when write latency exceeds 100ms - may indicate performance issues"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.rds_alarms.arn]

  tags = {
    Name = "${local.name_prefix}-rds-write-latency-alarm"
  }
}

# Alarm: Storage Space (Warning when approaching limit)
# Alert when storage >80GB (80% of 100GB max_allocated_storage)
resource "aws_cloudwatch_metric_alarm" "rds_free_storage_space" {
  alarm_name          = "${local.name_prefix}-rds-free-storage-space-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 21474836480 # 20GB in bytes (100GB max - 80GB used)
  alarm_description   = "Alert when free storage space drops below 20GB - approaching storage limit"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.rds_alarms.arn]

  tags = {
    Name = "${local.name_prefix}-rds-free-storage-space-alarm"
  }
}
