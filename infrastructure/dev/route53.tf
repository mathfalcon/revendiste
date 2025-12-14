# Get hosted zone for revendiste.com
data "aws_route53_zone" "main" {
  name = "revendiste.com"
}

# A record for API subdomain
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.api_subdomain}.revendiste.com"
  type    = "A"
  ttl     = 300
  records = [aws_eip.backend.public_ip]

  depends_on = [aws_eip.backend]
}

# A record for frontend subdomain
resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.frontend.public_ip]

  depends_on = [aws_eip.frontend]
}



