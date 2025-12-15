# Get hosted zone for revendiste.com
data "aws_route53_zone" "main" {
  name = "revendiste.com"
}

# A record for API subdomain (points to single app instance)
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.api_subdomain}.revendiste.com"
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]

  depends_on = [aws_eip.app]
}

# A record for frontend subdomain (points to single app instance)
resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]

  depends_on = [aws_eip.app]
}



