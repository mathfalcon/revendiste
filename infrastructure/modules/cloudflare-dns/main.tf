# Cloudflare DNS Module
# Creates DNS records and page rules for Cloudflare

# Get Cloudflare zone (always the root zone, e.g., revendiste.com)
data "cloudflare_zones" "main" {
  name = var.zone_name
}

locals {
  zone_id = data.cloudflare_zones.main.result[0].id
}

# A record for main domain (points to ALB)
resource "cloudflare_dns_record" "main" {
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "CNAME"
  content = var.alb_dns_name
  ttl     = 1
  proxied = true
}

# A record for www subdomain (points to ALB)
resource "cloudflare_dns_record" "www" {
  zone_id = local.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  content = var.alb_dns_name
  ttl     = 1
  proxied = true
}

# ACM Certificate DNS Validation Records
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

# Cloudflare Page Rules for Cache Control
resource "cloudflare_page_rule" "cache_assets" {
  zone_id  = local.zone_id
  target   = "${var.domain_name}/assets/*"
  priority = 1
  status   = "active"

  actions = {
    cache_level       = "aggressive"
    edge_cache_ttl    = 2419200  # 28 days
    browser_cache_ttl = 31536000 # 1 year
  }
}

resource "cloudflare_page_rule" "no_cache_html" {
  zone_id  = local.zone_id
  target   = "${var.domain_name}/*"
  priority = 2
  status   = "active"

  actions = {
    cache_level = "bypass"
  }
}
