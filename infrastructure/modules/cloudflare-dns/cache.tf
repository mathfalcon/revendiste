# Cloudflare Cache Rules
# Caches /eventos/* at the edge for common link-preview and search crawlers only (5 min TTL).
# Real browsers keep hitting origin for fresh HTML.
#
# Note: Cache Rules run in phase http_request_cache_settings. Cloudflare does not allow
# cf.client.bot (or other bot-management fields) in that phase — API returns 20127.
# We approximate with http.user_agent (allowed in cache rule expressions).

resource "cloudflare_ruleset" "event_page_bot_cache" {
  count   = var.enable_bot_cache ? 1 : 0
  zone_id = local.zone_id
  name    = "Cache event pages for verified bots"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules = [
    {
      ref         = "event_pages_bot_cache"
      description = "Cache /eventos/* for major crawlers/preview bots (5 min edge TTL); UA heuristic"
      # RE2, case-insensitive; covers Google, Bing, social previews, messengers, Apple, etc.
      expression = "(starts_with(http.request.uri.path, \"/eventos/\") and http.user_agent matches \"(?i).*(Googlebot|Google-InspectionTool|AdsBot-Google|Mediapartners-Google|Storebot-Google|bingbot|BingPreview|Slurp|DuckDuckBot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|Pinterest|Embedly|vkShare|redditbot|Bytespider|Applebot|Yandex|Amazonbot|ia_archiver).*\")"
      action      = "set_cache_settings"
      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 300
        }
        browser_ttl = {
          mode    = "override_origin"
          default = 0
        }
      }
    }
  ]
}
