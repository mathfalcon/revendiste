# CloudWatch Alarms Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "enabled" {
  description = "Whether to create alarms"
  type        = bool
  default     = true
}

variable "db_instance_identifier" {
  description = "RDS instance identifier"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
