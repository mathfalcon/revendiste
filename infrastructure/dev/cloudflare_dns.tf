# Get Cloudflare zone for revendiste.com
data "cloudflare_zones" "main" {
  name = "revendiste.com"
}

# A record for dev subdomain (points to single app instance)
# API is served at dev.revendiste.com/api, frontend at dev.revendiste.com
resource "cloudflare_dns_record" "frontend" {
  zone_id = data.cloudflare_zones.main.zones[0].id
  name    = var.domain_name
  type    = "A"
  content = aws_eip.app.public_ip
  ttl     = 1
  proxied = true

  depends_on = [aws_eip.app]
}



