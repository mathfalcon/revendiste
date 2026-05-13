# Cloudflare DNS Module
# Creates DNS records for either an ALB CNAME target (legacy ECS/ALB stack) or
# an EIP A-record target (single-EC2 "VPS" deployment).

# Get Cloudflare zone (always the root zone, e.g., revendiste.com)
data "cloudflare_zones" "main" {
  name = var.zone_name
}

locals {
  zone_id = data.cloudflare_zones.main.result[0].id

  # Exactly one of alb_dns_name / origin_ip must be set.
  use_alb = length(var.alb_dns_name) > 0
  use_eip = length(var.origin_ip) > 0
}

# A record for main domain.
# - ALB target: CNAME to alb_dns_name (Cloudflare flattens the apex if needed).
# - EIP target: A record to the IPv4.
resource "cloudflare_dns_record" "main" {
  zone_id = local.zone_id
  name    = var.domain_name
  type    = local.use_alb ? "CNAME" : "A"
  content = local.use_alb ? var.alb_dns_name : var.origin_ip
  ttl     = 1
  proxied = true

  lifecycle {
    precondition {
      condition     = local.use_alb != local.use_eip
      error_message = "cloudflare_dns module requires exactly one of alb_dns_name or origin_ip to be set."
    }
  }
}

# www subdomain mirror — same target as main. Skipped for dev (nested subdomain
# SSL issue with www.dev.revendiste.com on Cloudflare Universal SSL).
resource "cloudflare_dns_record" "www" {
  count   = var.create_www_record ? 1 : 0
  zone_id = local.zone_id
  name    = "www.${var.domain_name}"
  type    = local.use_alb ? "CNAME" : "A"
  content = local.use_alb ? var.alb_dns_name : var.origin_ip
  ttl     = 1
  proxied = true
}

# ACM certificate DNS validation records — only relevant for ALB targets.
# When the origin is an EIP behind Cloudflare TLS, no ACM cert exists and
# acm_certificate_domain_validation_options should be [].
resource "cloudflare_dns_record" "acm_validation" {
  for_each = {
    for dvo in var.acm_certificate_domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = local.zone_id
  name    = trimsuffix(each.value.name, ".${var.zone_name}.")
  type    = each.value.type
  content = each.value.record
  ttl     = 60
  proxied = false
}
