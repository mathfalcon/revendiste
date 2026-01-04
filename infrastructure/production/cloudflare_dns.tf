# Get Cloudflare zone for revendiste.com
data "cloudflare_zones" "main" {
  name = var.domain_name
}

# A record for main domain (points to ALB)
resource "cloudflare_dns_record" "main" {
  zone_id = data.cloudflare_zones.main.result[0].id
  name    = var.domain_name
  type    = "CNAME"
  content = aws_lb.main.dns_name
  ttl     = 1
  proxied = true

  depends_on = [aws_lb.main]
}

# A record for www subdomain (points to ALB)
resource "cloudflare_dns_record" "www" {
  zone_id = data.cloudflare_zones.main.result[0].id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  content = aws_lb.main.dns_name
  ttl     = 1
  proxied = true

  depends_on = [aws_lb.main]
}

# ACM Certificate DNS Validation Records
# These records are required for ACM certificate validation
resource "cloudflare_dns_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = data.cloudflare_zones.main.result[0].id
  name    = trimsuffix(each.value.name, ".${var.domain_name}.")
  type    = each.value.type
  content = each.value.record
  ttl     = 60
  proxied = false

  depends_on = [aws_acm_certificate.main]
}

# Cloudflare Page Rules for Cache Control
# Prevent caching of HTML pages to avoid serving stale index.html after deployments
# Static assets (JS/CSS) are versioned and can be cached long-term

# Rule 1: Cache static assets with long TTL (higher priority = evaluated first)
# Versioned assets (JS/CSS with hashes) can be cached long-term
resource "cloudflare_page_rule" "cache_assets" {
  zone_id  = data.cloudflare_zones.main.result[0].id
  target   = "${var.domain_name}/assets/*"
  priority = 1
  status   = "active"

  actions = {
    cache_level       = "aggressive"
    edge_cache_ttl    = 2419200  # 28 days (max allowed by Cloudflare)
    browser_cache_ttl = 31536000 # 1 year (browser cache can be longer)
  }
}

# Rule 2: Don't cache HTML pages (lower priority, catches everything else)
# This prevents Cloudflare from caching index.html and other HTML routes
# which reference versioned JS/CSS files that change on each deployment
resource "cloudflare_page_rule" "no_cache_html" {
  zone_id  = data.cloudflare_zones.main.result[0].id
  target   = "${var.domain_name}/*"
  priority = 2
  status   = "active"

  actions = {
    cache_level = "bypass"
  }
}

