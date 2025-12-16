# Cloudflare Zone for main domain
# Note: The zone should already exist in Cloudflare. This data source references it.
data "cloudflare_zone" "main" {
  name = var.domain_name
}

