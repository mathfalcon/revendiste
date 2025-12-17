# Cloudflare R2 public bucket for images and public assets
resource "cloudflare_r2_bucket" "dev_public" {
  account_id = var.cloudflare_account_id
  name       = "${var.environment}-revendiste-public"
  location   = var.r2_bucket_location

  lifecycle {
    prevent_destroy = false
  }
}

# Cloudflare R2 private bucket for ticket documents and sensitive files
resource "cloudflare_r2_bucket" "dev_private" {
  account_id = var.cloudflare_account_id
  name       = "${var.environment}-revendiste-private"
  location   = var.r2_bucket_location

  lifecycle {
    prevent_destroy = false
  }
}

# Custom domain for R2 public bucket CDN
# Reference: https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/r2_custom_domain
resource "cloudflare_r2_custom_domain" "dev_cdn" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.dev_public.name
  domain      = "cdn-${var.environment}.revendiste.com"
  zone_id     = data.cloudflare_zones.main.result[0].id
  enabled     = true
}
