variable "domain_name" {
  description = "Main domain name for the application"
  type        = string
  default     = "revendiste.com"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token for DNS management"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "sa-east-1" # São Paulo region
}

variable "resend_dkim_key" {
  description = "Resend DKIM public key"
  type        = string
  sensitive   = true
  default     = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC1zemEE7Ew2gK/XC0KBGNO1JLkxg6GxTVUudq2NBRs9igo3kwNOgXBt2mz7Fx5ylvG8azrDa0nf3MEQ4iu4Lugef0Ofl5EWwwyU/KoOB1JLcwUGa05sW1owkpmX3R46qYzOEEGkeq9ef3Z7f1vB5h2/ubeqwsyUWJLDpOEeS2kYQIDAQAB"
}

variable "resend_smtp_server" {
  description = "Resend SMTP server hostname"
  type        = string
  default     = "feedback-smtp.sa-east-1.amazonses.com"
}

variable "resend_smtp_priority" {
  description = "Priority for Resend SMTP MX record"
  type        = number
  default     = 10
}

variable "enable_dmarc" {
  description = "Enable DMARC policy"
  type        = bool
  default     = true
}

variable "dmarc_policy" {
  description = "DMARC policy (none, quarantine, reject)"
  type        = string
  default     = "none"
  validation {
    condition     = contains(["none", "quarantine", "reject"], var.dmarc_policy)
    error_message = "DMARC policy must be 'none', 'quarantine', or 'reject'."
  }
}

