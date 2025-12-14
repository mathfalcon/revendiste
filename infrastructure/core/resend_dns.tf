# Resend DNS Records for email authentication
# These records are required for Resend to send emails on behalf of your domain

resource "aws_route53_record" "resend_dkim" {
  zone_id = aws_route53_zone.main.zone_id
  # Record name is relative to the hosted zone (revendiste.com)
  # Full FQDN: resend._domainkey.notificaciones.revendiste.com
  name    = "resend._domainkey.notificaciones"
  type    = "TXT"
  ttl     = 300
  records = [var.resend_dkim_key]
}

resource "aws_route53_record" "resend_smtp_mx" {
  zone_id = aws_route53_zone.main.zone_id
  # Record name is relative to the hosted zone (revendiste.com)
  # Full FQDN: send.notificaciones.revendiste.com
  name    = "send.notificaciones"
  type    = "MX"
  ttl     = 300
  records = ["${var.resend_smtp_priority} ${var.resend_smtp_server}"]
}

resource "aws_route53_record" "resend_spf" {
  zone_id = aws_route53_zone.main.zone_id
  # Record name is relative to the hosted zone (revendiste.com)
  # Full FQDN: send.notificaciones.revendiste.com
  name    = "send.notificaciones"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# DMARC Record (Optional)
# This helps prevent email spoofing and provides reporting
resource "aws_route53_record" "dmarc" {
  count   = var.enable_dmarc ? 1 : 0
  zone_id = aws_route53_zone.main.zone_id
  # DMARC for the subdomain notificaciones.revendiste.com
  # Full FQDN: _dmarc.notificaciones.revendiste.com
  name    = "_dmarc.notificaciones"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=${var.dmarc_policy};"]
}

