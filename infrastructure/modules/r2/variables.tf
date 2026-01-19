# R2 Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "zone_name" {
  description = "Root zone name (e.g., revendiste.com)"
  type        = string
}

variable "domain_name" {
  description = "Main domain name"
  type        = string
}

variable "cdn_subdomain" {
  description = "CDN subdomain (e.g., 'cdn' for cdn.revendiste.com, 'dev-cdn' for dev-cdn.revendiste.com)"
  type        = string
  default     = "cdn"
}

variable "r2_bucket_location" {
  description = "R2 bucket location"
  type        = string
  default     = "WEUR"
}
