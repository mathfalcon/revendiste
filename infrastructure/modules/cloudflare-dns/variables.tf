# Cloudflare DNS Module Variables

variable "zone_name" {
  description = "Cloudflare zone name (e.g., revendiste.com)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for this environment (e.g., dev.revendiste.com or revendiste.com)"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "acm_certificate_domain_validation_options" {
  description = "Domain validation options for ACM certificate"
  type        = any
}

variable "create_www_record" {
  description = "Whether to create www subdomain record (set false for dev to avoid nested subdomain SSL issues)"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

variable "enable_bot_cache" {
  description = "Whether to enable Cloudflare edge caching of /eventos/* for verified bots (improves link preview speed)"
  type        = bool
  default     = false
}
