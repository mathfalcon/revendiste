# Cloudflare Cache Rules
# Caches /eventos/* responses at the edge for verified bots only (WhatsApp, Google, Facebook, etc.)
# Real users always hit origin and see fresh data. Bots get a 5-minute stale window.

resource "cloudflare_ruleset" "event_page_bot_cache" {
  count   = var.enable_bot_cache ? 1 : 0
  zone_id = local.zone_id
  name    = "Cache event pages for verified bots"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules {
    ref         = "event_pages_bot_cache"
    description = "Cache /eventos/* for verified bots (5 min edge TTL)"
    expression  = "(cf.client.bot and starts_with(http.request.uri.path, \"/eventos/\"))"
    action      = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 300
      }
      browser_ttl {
        mode    = "override_origin"
        default = 0
      }
    }
  }
}
