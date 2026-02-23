# Styx Infrastructure — Terraform Configuration
# Target: Render (API + Web) + Supabase (PostgreSQL) + Cloudflare R2 (Media)
# TCO Target: < $2,000/year (Phase Omega forecast)

terraform {
  required_version = ">= 1.5"

  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# --- Variables ---

variable "render_api_key" {
  type      = string
  sensitive = true
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_account_id" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type      = string
  sensitive = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "anonymize_salt" {
  type      = string
  sensitive = true
}

variable "environment" {
  type    = string
  default = "production"
}

# --- Providers ---

provider "render" {
  api_key = var.render_api_key
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# --- Render: API Service ---

resource "render_web_service" "styx_api" {
  name            = "styx-api"
  region          = "oregon"
  plan            = "starter"
  runtime         = "docker"
  docker_path     = "./src/api/Dockerfile"
  docker_context  = "."
  branch          = "main"

  env_vars = {
    NODE_ENV           = var.environment
    DATABASE_URL       = var.database_url
    REDIS_URL          = var.redis_url
    STRIPE_SECRET_KEY  = var.stripe_secret_key
    JWT_SECRET         = var.jwt_secret
    ANONYMIZE_SALT     = var.anonymize_salt
    R2_ENDPOINT        = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
    R2_BUCKET          = cloudflare_r2_bucket.styx_proofs.name
  }

  health_check_path = "/health"
}

# --- Render: Web Dashboard ---

resource "render_web_service" "styx_web" {
  name            = "styx-web"
  region          = "oregon"
  plan            = "starter"
  runtime         = "docker"
  docker_path     = "./src/web/Dockerfile"
  docker_context  = "."
  branch          = "main"

  env_vars = {
    NODE_ENV             = var.environment
    NEXT_PUBLIC_API_URL  = "https://${render_web_service.styx_api.name}.onrender.com"
  }
}

# --- Cloudflare R2: Proof Media Bucket ---

resource "cloudflare_r2_bucket" "styx_proofs" {
  account_id = var.cloudflare_account_id
  name       = "styx-proofs"
  location   = "WNAM"
}

# --- Outputs ---

output "api_url" {
  value = "https://${render_web_service.styx_api.name}.onrender.com"
}

output "web_url" {
  value = "https://${render_web_service.styx_web.name}.onrender.com"
}

output "r2_bucket" {
  value = cloudflare_r2_bucket.styx_proofs.name
}
