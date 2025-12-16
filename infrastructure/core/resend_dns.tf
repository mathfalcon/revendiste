# Resend DNS Records for email authentication
# These records are required for Resend to send emails on behalf of your domain

resource "cloudflare_record" "resend_dkim" {
  zone_id = data.cloudflare_zone.main.id
  # Full FQDN: resend._domainkey.notificaciones.revendiste.com
  name    = "resend._domainkey.notificaciones"
  type    = "TXT"
  ttl     = 300
  content = var.resend_dkim_key
}

resource "cloudflare_record" "resend_smtp_mx" {
  zone_id = data.cloudflare_zone.main.id
  # Full FQDN: send.notificaciones.revendiste.com
  name     = "send.notificaciones"
  type     = "MX"
  ttl      = 300
  priority = var.resend_smtp_priority
  content  = var.resend_smtp_server
}

resource "cloudflare_record" "resend_spf" {
  zone_id = data.cloudflare_zone.main.id
  # Full FQDN: send.notificaciones.revendiste.com
  name    = "send.notificaciones"
  type    = "TXT"
  ttl     = 300
  content = "v=spf1 include:amazonses.com ~all"
}

# DMARC Record (Optional)
# This helps prevent email spoofing and provides reporting
resource "cloudflare_record" "dmarc" {
  count   = var.enable_dmarc ? 1 : 0
  zone_id = data.cloudflare_zone.main.id
  # DMARC for the subdomain notificaciones.revendiste.com
  # Full FQDN: _dmarc.notificaciones.revendiste.com
  name    = "_dmarc.notificaciones"
  type    = "TXT"
  ttl     = 300
  content = "v=DMARC1; p=${var.dmarc_policy};"
}

