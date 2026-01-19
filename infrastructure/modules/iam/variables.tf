# IAM Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "db_credentials_secret_arn" {
  description = "ARN of the database credentials secret"
  type        = string
}

variable "backend_secrets_arn" {
  description = "ARN of the backend secrets secret"
  type        = string
}

variable "cronjob_task_definition_arns" {
  description = "List of cronjob task definition ARNs for EventBridge policy"
  type        = list(string)
  default     = []
}

variable "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
