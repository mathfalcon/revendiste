variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "sa-east-1" # São Paulo region
}

variable "instance_type" {
  description = "EC2 instance type for dev environment"
  type        = string
  default     = "t3.micro" # 2 vCPU, 1GB RAM - sufficient for dev
}

variable "key_pair_name" {
  description = "Name of the AWS Key Pair for SSH access"
  type        = string
  sensitive   = true
}

variable "github_actions_ssh_public_key" {
  description = "Public SSH key for GitHub Actions to deploy"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for dev environment"
  type        = string
  default     = "dev.revendiste.com"
}

variable "api_subdomain" {
  description = "API subdomain"
  type        = string
  default     = "api.dev"
}

variable "allowed_ssh_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into the instance"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

variable "allowed_http_cidr_blocks" {
  description = "CIDR blocks allowed to access HTTP/HTTPS"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Cloudflare R2 variables
variable "cloudflare_api_token" {
  description = "Cloudflare API token for R2 bucket management"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID for R2 bucket"
  type        = string
  sensitive   = true
}

variable "r2_bucket_name" {
  description = "Name of the R2 bucket for dev storage"
  type        = string
  default     = "revendiste-dev-storage"
}

variable "r2_bucket_location" {
  description = "R2 bucket location (e.g., 'WEUR', 'WNAM', 'ENAM', 'APAC')"
  type        = string
  default     = "WEUR" # Western Europe - adjust based on your needs
}

variable "port" {
  description = "Backend API port"
  type        = number
  default     = 3001
}

# Note: Secrets are NOT stored in Terraform variables for security
# All backend secrets are manually populated in AWS Secrets Manager console
# See README.md for instructions on creating the secret JSON


