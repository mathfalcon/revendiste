output "domain_name" {
  description = "Main domain name"
  value       = var.domain_name
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  value       = data.cloudflare_zone.main.id
}

output "cloudflare_zone_name_servers" {
  description = "Name servers for the Cloudflare zone (configure these in your domain registrar)"
  value       = data.cloudflare_zone.main.name_servers
}

output "resend_dkim_record" {
  description = "Resend DKIM record details"
  sensitive   = true
  value = {
    name  = cloudflare_record.resend_dkim.name
    type  = cloudflare_record.resend_dkim.type
    value = cloudflare_record.resend_dkim.value
  }
}

output "resend_spf_records" {
  description = "Resend SPF records details"
  sensitive   = true
  value = {
    mx = {
      name     = cloudflare_record.resend_smtp_mx.name
      type     = cloudflare_record.resend_smtp_mx.type
      priority = cloudflare_record.resend_smtp_mx.priority
      value    = cloudflare_record.resend_smtp_mx.value
    }
    txt = {
      name  = cloudflare_record.resend_spf.name
      type  = cloudflare_record.resend_spf.type
      value = cloudflare_record.resend_spf.value
    }
  }
}

output "dmarc_record" {
  description = "DMARC record details"
  sensitive   = true
  value = var.enable_dmarc ? {
    name  = cloudflare_record.dmarc[0].name
    type  = cloudflare_record.dmarc[0].type
    value = cloudflare_record.dmarc[0].value
  } : null
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

