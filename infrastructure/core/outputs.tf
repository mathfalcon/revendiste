output "domain_name" {
  description = "Main domain name"
  value       = var.domain_name
}

output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers for the hosted zone (configure these in your domain registrar)"
  value       = aws_route53_zone.main.name_servers
}

output "resend_dkim_record" {
  description = "Resend DKIM record details"
  sensitive   = true
  value = {
    name   = aws_route53_record.resend_dkim.name
    type   = aws_route53_record.resend_dkim.type
    record = tolist(aws_route53_record.resend_dkim.records)[0]
  }
}

output "resend_spf_records" {
  description = "Resend SPF records details"
  sensitive   = true
  value = {
    mx = {
      name   = aws_route53_record.resend_smtp_mx.name
      type   = aws_route53_record.resend_smtp_mx.type
      record = tolist(aws_route53_record.resend_smtp_mx.records)[0]
    }
    txt = {
      name   = aws_route53_record.resend_spf.name
      type   = aws_route53_record.resend_spf.type
      record = tolist(aws_route53_record.resend_spf.records)[0]
    }
  }
}

output "dmarc_record" {
  description = "DMARC record details"
  sensitive   = true
  value = var.enable_dmarc ? {
    name   = aws_route53_record.dmarc[0].name
    type   = aws_route53_record.dmarc[0].type
    record = tolist(aws_route53_record.dmarc[0].records)[0]
  } : null
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

