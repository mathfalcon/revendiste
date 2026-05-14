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
  description = "DNS name of the Application Load Balancer (legacy ALB target). Mutually exclusive with origin_ip."
  type        = string
  default     = ""
}

variable "origin_ip" {
  description = "IPv4 address (typically an Elastic IP) for an A-record origin (single-EC2 'VPS' deployment). Mutually exclusive with alb_dns_name."
  type        = string
  default     = ""
}

variable "acm_certificate_domain_validation_options" {
  description = "Domain validation options for ACM certificate. Empty list when no ALB/ACM is in use (e.g. EC2 origin behind Cloudflare TLS)."
  type        = any
  default     = []
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

