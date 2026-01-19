# Cronjobs Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  type        = string
}

variable "eventbridge_role_arn" {
  description = "ARN of the EventBridge ECS role"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "ECS tasks security group ID"
  type        = string
}

# Task definition ARNs
variable "sync_payments_task_arn" {
  description = "ARN of the sync payments task definition"
  type        = string
}

variable "notify_upload_task_arn" {
  description = "ARN of the notify upload task definition"
  type        = string
}

variable "check_payout_task_arn" {
  description = "ARN of the check payout task definition"
  type        = string
}

variable "scrape_events_task_arn" {
  description = "ARN of the scrape events task definition"
  type        = string
}

variable "process_notifications_task_arn" {
  description = "ARN of the process notifications task definition"
  type        = string
}

# Schedule expressions - environment specific
variable "sync_payments_schedule" {
  description = "Schedule expression for sync-payments job"
  type        = string
  default     = "cron(*/5 * * * ? *)" # Every 5 minutes
}

variable "notify_upload_schedule" {
  description = "Schedule expression for notify-upload job"
  type        = string
  default     = "cron(0 * * * ? *)" # Every hour
}

variable "check_payout_schedule" {
  description = "Schedule expression for check-payout job"
  type        = string
  default     = "cron(0 * * * ? *)" # Every hour
}

variable "scrape_events_schedule" {
  description = "Schedule expression for scrape-events job"
  type        = string
  default     = "cron(*/30 * * * ? *)" # Every 30 minutes
}

variable "process_notifications_schedule" {
  description = "Schedule expression for process-notifications job"
  type        = string
  default     = "cron(*/5 * * * ? *)" # Every 5 minutes
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
