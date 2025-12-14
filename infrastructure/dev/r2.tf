# Cloudflare R2 bucket for storage
resource "cloudflare_r2_bucket" "dev_storage" {
  account_id = var.cloudflare_account_id
  name       = var.r2_bucket_name
  location   = var.r2_bucket_location
}


