# Cloudflare DNS Module Variables

variable "domain_name" {
  description = "Main domain name"
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

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
