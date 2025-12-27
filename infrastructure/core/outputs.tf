output "domain_name" {
  description = "Main domain name"
  value       = var.domain_name
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  value       = data.cloudflare_zones.main.zones[0].id
}

output "cloudflare_zone_name_servers" {
  description = "Name servers for the Cloudflare zone (configure these in your domain registrar)"
  value       = data.cloudflare_zones.main.zones[0].name_servers
}

output "resend_dkim_record" {
  description = "Resend DKIM record details"
  sensitive   = true
  value = {
    name    = cloudflare_dns_record.resend_dkim.name
    type    = cloudflare_dns_record.resend_dkim.type
    content = cloudflare_dns_record.resend_dkim.content
  }
}

output "resend_spf_records" {
  description = "Resend SPF records details"
  sensitive   = true
  value = {
    mx = {
      name     = cloudflare_dns_record.resend_smtp_mx.name
      type     = cloudflare_dns_record.resend_smtp_mx.type
      priority = cloudflare_dns_record.resend_smtp_mx.priority
      content  = cloudflare_dns_record.resend_smtp_mx.content
    }
    txt = {
      name    = cloudflare_dns_record.resend_spf.name
      type    = cloudflare_dns_record.resend_spf.type
      content = cloudflare_dns_record.resend_spf.content
    }
  }
}

output "dmarc_record" {
  description = "DMARC record details"
  sensitive   = true
  value = var.enable_dmarc ? {
    name    = cloudflare_dns_record.dmarc[0].name
    type    = cloudflare_dns_record.dmarc[0].type
    content = cloudflare_dns_record.dmarc[0].content
  } : null
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

