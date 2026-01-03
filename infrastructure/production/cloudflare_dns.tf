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

