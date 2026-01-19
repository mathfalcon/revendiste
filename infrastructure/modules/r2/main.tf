# R2 Module
# Creates Cloudflare R2 buckets for file storage

# Cloudflare R2 public bucket
resource "cloudflare_r2_bucket" "public" {
  account_id = var.cloudflare_account_id
  name       = "${var.environment}-revendiste-public"
  location   = var.r2_bucket_location

  lifecycle {
    prevent_destroy = false
  }
}

# Cloudflare R2 private bucket
resource "cloudflare_r2_bucket" "private" {
  account_id = var.cloudflare_account_id
  name       = "${var.environment}-revendiste-private"
  location   = var.r2_bucket_location

  lifecycle {
    prevent_destroy = false
  }
}

# Custom domain for R2 public bucket CDN
resource "cloudflare_r2_custom_domain" "cdn" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.public.name
  domain      = "cdn.${var.domain_name}"
  zone_id     = var.cloudflare_zone_id
  enabled     = true
}
