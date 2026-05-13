# EC2 App Module Variables
#
# Provisions a single EC2 instance running the Revendiste Docker Compose stack
# behind Cloudflare. Used in dev today (with Postgres-in-Docker) and planned
# for prod in Phase 5 (with RDS instead of in-VM Postgres).

variable "name_prefix" {
  description = "Prefix for resource names (e.g. revendiste-dev)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev or prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID (used to scope IAM policies)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the instance lives"
  type        = string
}

variable "subnet_id" {
  description = "Public subnet ID (instance gets an EIP and is reached via Cloudflare)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type. Default t4g.small (2 GiB / 2 vCPU); upgrade to t4g.medium if Chromium / Postgres pressure shows up."
  type        = string
  default     = "t4g.small"
}

variable "data_volume_size_gb" {
  description = "Size of the dedicated EBS gp3 data volume that holds /var/lib/docker (Postgres data + Docker image cache)"
  type        = number
  default     = 50
}

variable "root_volume_size_gb" {
  description = "Size of the root EBS volume (OS only)"
  type        = number
  default     = 20
}

variable "cloudflare_ip_ranges" {
  description = "Cloudflare IPv4 ranges allowed to hit 80/443"
  type        = list(string)
}

variable "cloudflare_ipv6_ranges" {
  description = "Cloudflare IPv6 ranges allowed to hit 80/443"
  type        = list(string)
}

variable "ecr_backend_repository_arn" {
  description = "ARN of the backend ECR repository (for least-privilege ecr:Batch* permissions)"
  type        = string
}

variable "ecr_frontend_repository_arn" {
  description = "ARN of the frontend ECR repository"
  type        = string
}

variable "backend_secrets_arn" {
  description = "ARN of the backend secrets Secrets Manager secret (BACKEND_SECRETS_JSON)"
  type        = string
}

variable "create_db_credentials_secret" {
  description = "If true (dev), create a Secrets Manager secret holding DB_CREDENTIALS_JSON for the in-VM Postgres. If false (prod), the caller passes db_credentials_secret_arn pointing at RDS's existing secret."
  type        = bool
  default     = false
}

variable "db_credentials_secret_arn" {
  description = "ARN of an existing Secrets Manager secret holding DB_CREDENTIALS_JSON. Required when create_db_credentials_secret = false."
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database username (only used when create_db_credentials_secret = true)"
  type        = string
  default     = "revendiste_admin"
  sensitive   = true
}

variable "db_name" {
  description = "Database name (only used when create_db_credentials_secret = true)"
  type        = string
  default     = "revendiste"
}

variable "db_host" {
  description = "Database host injected into the JSON secret. For dev with Postgres-in-Docker this is 'postgres' (the compose service name)."
  type        = string
  default     = "postgres"
}

variable "db_port" {
  description = "Database port injected into the JSON secret"
  type        = number
  default     = 5432
}

variable "app_hostname" {
  description = "Public hostname Caddy serves (e.g. dev.revendiste.com). Written into /opt/revendiste/.env at boot."
  type        = string
}

variable "image_tag" {
  description = "Docker image tag deployed at boot (deploy workflow overwrites at runtime by re-running the systemd unit)"
  type        = string
  default     = "latest"
}

variable "common_tags" {
  description = "Common tags applied to every resource"
  type        = map(string)
  default     = {}
}
