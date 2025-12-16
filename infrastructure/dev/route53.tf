# Get Cloudflare zone for revendiste.com
data "cloudflare_zone" "main" {
  name = "revendiste.com"
}

# A record for API subdomain (points to single app instance)
resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.main.id
  name    = "${var.api_subdomain}.revendiste.com"
  type    = "A"
  ttl     = 300
  content = aws_eip.app.public_ip

  depends_on = [aws_eip.app]
}

# A record for frontend subdomain (points to single app instance)
resource "cloudflare_record" "frontend" {
  zone_id = data.cloudflare_zone.main.id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  content = aws_eip.app.public_ip

  depends_on = [aws_eip.app]
}



