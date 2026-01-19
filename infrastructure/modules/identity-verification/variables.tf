# Identity Verification Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "ecs_task_role_id" {
  description = "ID of the ECS task role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
