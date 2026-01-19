# CloudWatch Alarms Module Outputs

output "sns_topic_arn" {
  description = "ARN of the SNS topic for RDS alarms"
  value       = var.enabled ? aws_sns_topic.rds_alarms[0].arn : null
}
