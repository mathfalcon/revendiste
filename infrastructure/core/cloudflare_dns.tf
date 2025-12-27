# Get Cloudflare zone for revendiste.com
data "cloudflare_zones" "main" {
  name = var.domain_name
}
