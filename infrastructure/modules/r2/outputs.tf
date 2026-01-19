# R2 Module Outputs

output "public_bucket_name" {
  description = "R2 public bucket name"
  value       = cloudflare_r2_bucket.public.name
}

output "private_bucket_name" {
  description = "R2 private bucket name"
  value       = cloudflare_r2_bucket.private.name
}

output "bucket_location" {
  description = "R2 bucket location"
  value       = cloudflare_r2_bucket.public.location
}

output "cdn_domain" {
  description = "CDN domain for public assets"
  value       = cloudflare_r2_custom_domain.cdn.domain
}
