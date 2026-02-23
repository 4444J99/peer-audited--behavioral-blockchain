# Cloudflare WAF & Security Hardening for Styx
# Financial-stakes platform requires aggressive bot/abuse protection

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for the Styx domain"
}

# --- Security Headers ---

resource "cloudflare_ruleset" "security_headers" {
  zone_id = var.cloudflare_zone_id
  name    = "Styx Security Headers"
  kind    = "zone"
  phase   = "http_response_headers_transform"

  rules {
    action = "rewrite"
    action_parameters {
      headers {
        name      = "X-Content-Type-Options"
        operation = "set"
        value     = "nosniff"
      }
      headers {
        name      = "X-Frame-Options"
        operation = "set"
        value     = "DENY"
      }
      headers {
        name      = "X-XSS-Protection"
        operation = "set"
        value     = "1; mode=block"
      }
      headers {
        name      = "Referrer-Policy"
        operation = "set"
        value     = "strict-origin-when-cross-origin"
      }
      headers {
        name      = "Permissions-Policy"
        operation = "set"
        value     = "camera=(), microphone=(), geolocation=(self)"
      }
      headers {
        name      = "Strict-Transport-Security"
        operation = "set"
        value     = "max-age=31536000; includeSubDomains; preload"
      }
    }
    expression  = "true"
    description = "Apply security headers to all responses"
    enabled     = true
  }
}

# --- Rate Limiting ---

resource "cloudflare_ruleset" "rate_limiting" {
  zone_id = var.cloudflare_zone_id
  name    = "Styx Rate Limiting"
  kind    = "zone"
  phase   = "http_ratelimit"

  # Auth endpoints: 5 requests per minute (brute force protection)
  rules {
    action = "block"
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 60
      requests_per_period = 5
      mitigation_timeout  = 300
    }
    expression  = "(http.request.uri.path contains \"/auth/login\" or http.request.uri.path contains \"/auth/register\")"
    description = "Rate limit auth endpoints — 5 req/min per IP"
    enabled     = true
  }

  # Payment/escrow endpoints: 10 requests per minute
  rules {
    action = "block"
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 60
      requests_per_period = 10
      mitigation_timeout  = 300
    }
    expression  = "(http.request.uri.path contains \"/wallet\" or http.request.uri.path contains \"/contracts\" and http.request.method eq \"POST\")"
    description = "Rate limit financial mutation endpoints — 10 req/min per IP"
    enabled     = true
  }

  # General API: 120 requests per minute
  rules {
    action = "block"
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 60
      requests_per_period = 120
      mitigation_timeout  = 60
    }
    expression  = "(http.request.uri.path contains \"/api\")"
    description = "General API rate limit — 120 req/min per IP"
    enabled     = true
  }
}

# --- Bot Management ---

resource "cloudflare_ruleset" "waf_custom" {
  zone_id = var.cloudflare_zone_id
  name    = "Styx WAF Custom Rules"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  # Block requests without a User-Agent (bots, scanners)
  rules {
    action      = "block"
    expression  = "(not http.user_agent ne \"\")"
    description = "Block empty User-Agent"
    enabled     = true
  }

  # Block known bad bots targeting financial APIs
  rules {
    action      = "challenge"
    expression  = "(cf.client.bot and http.request.uri.path contains \"/wallet\")"
    description = "Challenge bots accessing financial endpoints"
    enabled     = true
  }

  # Geofencing: block restricted jurisdictions at edge (mirrors GeofenceService)
  # AZ, AR, DE, HI, IA, ID, IL, IN, LA, MO, MT, NV, NH, OH, OR, SC, SD, TN, UT, VT, WA
  rules {
    action      = "block"
    expression  = "(ip.geoip.subdivision_1_iso_code in {\"AZ\" \"AR\" \"DE\" \"HI\" \"IA\" \"ID\" \"IL\" \"IN\" \"LA\" \"MO\" \"MT\" \"NV\" \"NH\" \"OH\" \"OR\" \"SC\" \"SD\" \"TN\" \"UT\" \"VT\" \"WA\"} and http.request.uri.path contains \"/contracts\")"
    description = "Edge geofence — block restricted US jurisdictions from contract creation"
    enabled     = true
  }
}
