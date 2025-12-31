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

# A record for API subdomain (points to ALB)
resource "cloudflare_dns_record" "api" {
  zone_id = data.cloudflare_zones.main.result[0].id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  content = aws_lb.main.dns_name
  ttl     = 1
  proxied = true

  depends_on = [aws_lb.main]
}

