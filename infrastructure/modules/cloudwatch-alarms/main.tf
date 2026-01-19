# CloudWatch Alarms Module
# Creates monitoring alarms for RDS (optional - typically prod only)

# SNS Topic for Alarm Notifications
resource "aws_sns_topic" "rds_alarms" {
  count = var.enabled ? 1 : 0
  name  = "${var.name_prefix}-rds-alarms"

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-alarms-topic"
  })
}

# Alarm: Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_database_connections" {
  count               = var.enabled ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-database-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 60
  alarm_description   = "Alert when database connections exceed 60 (80% of limit for db.t4g.micro)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  alarm_actions = [aws_sns_topic.rds_alarms[0].arn]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-database-connections-alarm"
  })
}

# Alarm: CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu_utilization" {
  count               = var.enabled ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Alert when CPU utilization exceeds 70% for 10 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  alarm_actions = [aws_sns_topic.rds_alarms[0].arn]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-cpu-utilization-alarm"
  })
}

# Alarm: Freeable Memory
resource "aws_cloudwatch_metric_alarm" "rds_freeable_memory" {
  count               = var.enabled ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-freeable-memory-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 209715200 # 200MB in bytes
  alarm_description   = "Alert when freeable memory drops below 200MB"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  alarm_actions = [aws_sns_topic.rds_alarms[0].arn]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-freeable-memory-alarm"
  })
}

# Alarm: Read Latency
resource "aws_cloudwatch_metric_alarm" "rds_read_latency" {
  count               = var.enabled ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-read-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 0.05 # 50ms
  alarm_description   = "Alert when read latency exceeds 50ms"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  alarm_actions = [aws_sns_topic.rds_alarms[0].arn]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-read-latency-alarm"
  })
}

# Alarm: Write Latency
resource "aws_cloudwatch_metric_alarm" "rds_write_latency" {
  count               = var.enabled ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-write-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 0.1 # 100ms
  alarm_description   = "Alert when write latency exceeds 100ms"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  alarm_actions = [aws_sns_topic.rds_alarms[0].arn]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-write-latency-alarm"
  })
}

# Alarm: Free Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_free_storage_space" {
  count               = var.enabled ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-free-storage-space-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 21474836480 # 20GB in bytes
  alarm_description   = "Alert when free storage space drops below 20GB"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  alarm_actions = [aws_sns_topic.rds_alarms[0].arn]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-free-storage-space-alarm"
  })
}
