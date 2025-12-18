# Cloudflare Firewall Rules to allow SSR requests
# This prevents Cloudflare from blocking server-side rendering requests
# that come from the EC2 instance or have the SSR User-Agent header

# IP Access Rule to whitelist EC2 instance IP
# This is the simplest and most reliable way to allow requests from the server
resource "cloudflare_access_rule" "ec2_ip_whitelist" {
  zone_id = data.cloudflare_zones.main.result[0].id
  mode    = "whitelist"
  notes   = "Allow SSR requests from EC2 instance (${local.name_prefix})"

  configuration = {
    target = "ip"
    value  = aws_eip.app.public_ip
  }
}

# Custom ruleset to allow requests with SSR User-Agent header
# This serves as a backup in case the IP changes or for other SSR scenarios
resource "cloudflare_ruleset" "ssr_user_agent_allow" {
  zone_id     = data.cloudflare_zones.main.result[0].id
  name        = "Allow SSR User-Agent Requests"
  description = "Allow server-side rendering requests with SSR User-Agent header"
  phase       = "http_request_firewall_custom"
  kind        = "zone"

  rules = [
    {
      description = "Allow requests with SSR User-Agent header - bypass challenges"
      expression  = "http.request.headers[\"user-agent\"][*] contains \"Revendiste-SSR\""
      action      = "skip"
      action_parameters = {
        products = ["waf", "uaBlock", "bic", "hot", "securityLevel", "rateLimit"]
      }
      enabled = true
    },
  ]
}

