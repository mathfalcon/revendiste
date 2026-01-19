# ECS Module Outputs

output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = aws_ecs_service.frontend.name
}

output "cronjob_task_definition_arns" {
  description = "List of cronjob task definition ARNs"
  value = [
    aws_ecs_task_definition.cronjob_sync_payments.arn,
    aws_ecs_task_definition.cronjob_notify_upload.arn,
    aws_ecs_task_definition.cronjob_check_payout.arn,
    aws_ecs_task_definition.cronjob_scrape_events.arn,
    aws_ecs_task_definition.cronjob_process_notifications.arn
  ]
}

output "cronjob_sync_payments_task_arn" {
  description = "Sync payments cronjob task definition ARN"
  value       = aws_ecs_task_definition.cronjob_sync_payments.arn
}

output "cronjob_notify_upload_task_arn" {
  description = "Notify upload cronjob task definition ARN"
  value       = aws_ecs_task_definition.cronjob_notify_upload.arn
}

output "cronjob_check_payout_task_arn" {
  description = "Check payout cronjob task definition ARN"
  value       = aws_ecs_task_definition.cronjob_check_payout.arn
}

output "cronjob_scrape_events_task_arn" {
  description = "Scrape events cronjob task definition ARN"
  value       = aws_ecs_task_definition.cronjob_scrape_events.arn
}

output "cronjob_process_notifications_task_arn" {
  description = "Process notifications cronjob task definition ARN"
  value       = aws_ecs_task_definition.cronjob_process_notifications.arn
}

output "backend_log_group_name" {
  description = "Backend CloudWatch log group name"
  value       = aws_cloudwatch_log_group.backend.name
}

output "frontend_log_group_name" {
  description = "Frontend CloudWatch log group name"
  value       = aws_cloudwatch_log_group.frontend.name
}

output "cronjob_log_group_name" {
  description = "Cronjob CloudWatch log group name"
  value       = aws_cloudwatch_log_group.cronjob.name
}
