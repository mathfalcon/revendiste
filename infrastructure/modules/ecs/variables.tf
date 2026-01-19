# ECS Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "domain_name" {
  description = "Main domain name"
  type        = string
}

# Networking
variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "ECS tasks security group ID"
  type        = string
}

# IAM
variable "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
}

# ALB
variable "backend_target_group_arn" {
  description = "ARN of the backend target group"
  type        = string
}

variable "frontend_target_group_arn" {
  description = "ARN of the frontend target group"
  type        = string
}

variable "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  type        = string
}

# Service Discovery
variable "service_discovery_namespace_name" {
  description = "Service discovery namespace name"
  type        = string
}

variable "backend_service_discovery_arn" {
  description = "Backend service discovery service ARN"
  type        = string
}

# ECR
variable "backend_repository_url" {
  description = "URL of the backend ECR repository"
  type        = string
}

variable "frontend_repository_url" {
  description = "URL of the frontend ECR repository"
  type        = string
}

# Secrets
variable "db_credentials_secret_arn" {
  description = "ARN of the database credentials secret"
  type        = string
}

variable "backend_secrets_arn" {
  description = "ARN of the backend secrets secret"
  type        = string
}

# Backend Configuration
variable "backend_cpu" {
  description = "CPU units for backend task"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory for backend task (MB)"
  type        = number
  default     = 1024
}

variable "backend_port" {
  description = "Backend container port"
  type        = number
  default     = 3001
}

variable "backend_image_tag" {
  description = "Backend Docker image tag"
  type        = string
  default     = "latest"
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 1
}

variable "backend_max_capacity" {
  description = "Maximum number of backend tasks"
  type        = number
  default     = 10
}

variable "backend_cpu_target" {
  description = "Target CPU utilization for backend autoscaling"
  type        = number
  default     = 70
}

variable "backend_memory_target" {
  description = "Target memory utilization for backend autoscaling"
  type        = number
  default     = 80
}

# Frontend Configuration
variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory for frontend task (MB)"
  type        = number
  default     = 512
}

variable "frontend_port" {
  description = "Frontend container port"
  type        = number
  default     = 3000
}

variable "frontend_image_tag" {
  description = "Frontend Docker image tag"
  type        = string
  default     = "latest"
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
  default     = 1
}

variable "frontend_max_capacity" {
  description = "Maximum number of frontend tasks"
  type        = number
  default     = 10
}

variable "frontend_cpu_target" {
  description = "Target CPU utilization for frontend autoscaling"
  type        = number
  default     = 70
}

variable "frontend_memory_target" {
  description = "Target memory utilization for frontend autoscaling"
  type        = number
  default     = 80
}

# Cronjob Configuration
variable "cronjob_cpu" {
  description = "CPU units for cronjob task"
  type        = number
  default     = 256
}

variable "cronjob_memory" {
  description = "Memory for cronjob task (MB)"
  type        = number
  default     = 512
}

variable "cronjob_scraping_cpu" {
  description = "CPU units for scraping cronjob tasks"
  type        = number
  default     = 1024
}

variable "cronjob_scraping_memory" {
  description = "Memory for scraping cronjob tasks (MB)"
  type        = number
  default     = 2048
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
