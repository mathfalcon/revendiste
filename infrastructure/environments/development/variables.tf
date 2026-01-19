# Variables for Dev Environment

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "sa-east-1"
}

variable "domain_name" {
  description = "Main domain name"
  type        = string
  default     = "revendiste.com"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["sa-east-1a", "sa-east-1b"]
}

# Cloudflare IP Ranges
variable "cloudflare_ip_ranges" {
  description = "Cloudflare IPv4 IP ranges"
  type        = list(string)
  default = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/12",
    "172.64.0.0/13",
    "131.0.72.0/22",
  ]
}

variable "cloudflare_ipv6_ranges" {
  description = "Cloudflare IPv6 IP ranges"
  type        = list(string)
  default = [
    "2400:cb00::/32",
    "2606:4700::/32",
    "2803:f800::/32",
    "2405:b500::/32",
    "2405:8100::/32",
    "2a06:98c0::/29",
    "2c0f:f248::/32",
  ]
}

# RDS Configuration - Dev uses minimum
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "revendiste"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "revendiste_admin"
  sensitive   = true
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.15"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro" # Minimum: ~$10/month
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum storage for auto-scaling in GB"
  type        = number
  default     = 50 # Lower limit in dev
}

variable "db_backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 3 # Shorter in dev
}

# ECS Configuration
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

# Cloudflare Configuration
variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
  sensitive   = true
}

variable "r2_bucket_location" {
  description = "R2 bucket location"
  type        = string
  default     = "WEUR"
}
