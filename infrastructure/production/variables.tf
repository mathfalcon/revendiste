variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "sa-east-1" # São Paulo region
}

variable "domain_name" {
  description = "Main domain name for production"
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

# Cloudflare IP Ranges (for security groups)
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

# RDS Configuration
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
  description = "PostgreSQL engine version for Aurora"
  type        = string
  default     = "15.4"
}

variable "db_min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity (ACUs)"
  type        = number
  default     = 0.5 # Minimum for cost optimization
}

variable "db_max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity (ACUs)"
  type        = number
  default     = 16 # Auto-scales up to 16 ACUs based on load
}

variable "db_instance_count" {
  description = "Number of Aurora instances"
  type        = number
  default     = 1 # Start with 1, can scale to 2+ for high availability
}

variable "db_backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

# ECS Configuration - Backend
variable "backend_cpu" {
  description = "CPU units for backend task (1024 = 1 vCPU). Backend API handles HTTP requests, database queries, and file uploads. Playwright/Crawlee/Sharp are used in cronjobs, not the main API service."
  type        = number
  default     = 512 # 0.5 vCPU (sufficient for API-only workloads)
}

variable "backend_memory" {
  description = "Memory for backend task (MB). Backend API handles HTTP requests, database queries, and file uploads. Playwright/Crawlee/Sharp are used in cronjobs, not the main API service."
  type        = number
  default     = 1536 # 1.5 GB (sufficient for API + database connection pools + request handling)
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
  default     = 2 # Start with 2 for high availability
}

variable "backend_min_capacity" {
  description = "Minimum number of backend tasks"
  type        = number
  default     = 1
}

variable "backend_max_capacity" {
  description = "Maximum number of backend tasks"
  type        = number
  default     = 10
}

variable "backend_cpu_target" {
  description = "Target CPU utilization for backend autoscaling (%)"
  type        = number
  default     = 70
}

variable "backend_memory_target" {
  description = "Target memory utilization for backend autoscaling (%)"
  type        = number
  default     = 80
}

# ECS Configuration - Frontend
variable "frontend_cpu" {
  description = "CPU units for frontend task (1024 = 1 vCPU)"
  type        = number
  default     = 256 # 0.25 vCPU
}

variable "frontend_memory" {
  description = "Memory for frontend task (MB)"
  type        = number
  default     = 512 # 0.5 GB
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
  default     = 2 # Start with 2 for high availability
}

variable "frontend_min_capacity" {
  description = "Minimum number of frontend tasks"
  type        = number
  default     = 1
}

variable "frontend_max_capacity" {
  description = "Maximum number of frontend tasks"
  type        = number
  default     = 10
}

variable "frontend_cpu_target" {
  description = "Target CPU utilization for frontend autoscaling (%)"
  type        = number
  default     = 70
}

variable "frontend_memory_target" {
  description = "Target memory utilization for frontend autoscaling (%)"
  type        = number
  default     = 80
}

# ECS Configuration - Cronjobs
variable "cronjob_cpu" {
  description = "CPU units for cronjob task (1024 = 1 vCPU). Note: Scraping jobs (Playwright/Crawlee) need more resources - use cronjob_scraping_cpu instead."
  type        = number
  default     = 256 # 0.25 vCPU (sufficient for lightweight jobs like sync-payments, notifications)
}

variable "cronjob_memory" {
  description = "Memory for cronjob task (MB). Note: Scraping jobs (Playwright/Crawlee) need more resources - use cronjob_scraping_memory instead."
  type        = number
  default     = 512 # 0.5 GB (sufficient for lightweight jobs)
}

# Scraping-specific cronjob resources (for Playwright/Crawlee workloads)
variable "cronjob_scraping_cpu" {
  description = "CPU units for scraping cronjob tasks (1024 = 1 vCPU). Playwright browser automation requires more CPU."
  type        = number
  default     = 1024 # 1 vCPU (minimum for Playwright workloads)
}

variable "cronjob_scraping_memory" {
  description = "Memory for scraping cronjob tasks (MB). Playwright browser instances use 300-500MB each, plus Node.js runtime and image processing buffers."
  type        = number
  default     = 2048 # 2 GB (minimum for Playwright + Sharp image processing)
}

variable "cronjob_command" {
  description = "Default command for cronjob task (overridden by EventBridge)"
  type        = list(string)
  default     = ["node", "--version"]
}

# CloudWatch Logs
variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
}

# Cloudflare Configuration
variable "cloudflare_api_token" {
  description = "Cloudflare API token for R2 bucket management and DNS (requires Account R2:Edit, Zone:Read, Zone:DNS:Edit permissions)"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID for R2 bucket"
  type        = string
  sensitive   = true
}

variable "r2_bucket_location" {
  description = "R2 bucket location (e.g., 'WEUR', 'WNAM', 'ENAM', 'APAC')"
  type        = string
  default     = "WEUR" # Western Europe - adjust based on your needs
}
