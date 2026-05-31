# Styx Infrastructure — Terraform Configuration
# Target: Render (API + Web) + Supabase (PostgreSQL) + Cloudflare R2 (Media)
# TCO Target: < $2,000/year (Phase Omega forecast)

terraform {
  required_version = ">= 1.5"

  # Remote state in Cloudflare R2 (S3-compatible)
  # Prevents state divergence across machines.
  # Run `terraform init` with environment variables:
  #   AWS_ACCESS_KEY_ID=<R2_access_key>
  #   AWS_SECRET_ACCESS_KEY=<R2_secret_key>
  backend "s3" {
    bucket                      = "styx-terraform-state"
    key                         = "production/terraform.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
    # Set endpoints via TF_S3_ENDPOINT or -backend-config
    # e.g. -backend-config="endpoint=https://<account_id>.r2.cloudflarestorage.com"
  }

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

variable "repo_url" {
  type        = string
  description = "Git repository URL Render builds the Docker services from."
  default     = "https://github.com/a-organvm/peer-audited--behavioral-blockchain"
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
  name   = "styx-api"
  region = "oregon"
  plan   = "starter"

  runtime_source = {
    docker = {
      repo_url        = var.repo_url
      branch          = "main"
      dockerfile_path = "./src/api/Dockerfile"
      context         = "."
    }
  }

  env_vars = {
    NODE_ENV          = { value = var.environment }
    DATABASE_URL      = { value = var.database_url }
    REDIS_URL         = { value = var.redis_url }
    STRIPE_SECRET_KEY = { value = var.stripe_secret_key }
    JWT_SECRET        = { value = var.jwt_secret }
    ANONYMIZE_SALT    = { value = var.anonymize_salt }
    R2_ENDPOINT       = { value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com" }
    R2_BUCKET         = { value = cloudflare_r2_bucket.styx_proofs.name }
  }

  health_check_path = "/health"
}

# --- Render: Web Dashboard ---

resource "render_web_service" "styx_web" {
  name   = "styx-web"
  region = "oregon"
  plan   = "starter"

  runtime_source = {
    docker = {
      repo_url        = var.repo_url
      branch          = "main"
      dockerfile_path = "./src/web/Dockerfile"
      context         = "."
    }
  }

  env_vars = {
    NODE_ENV            = { value = var.environment }
    NEXT_PUBLIC_API_URL = { value = "https://${render_web_service.styx_api.name}.onrender.com" }
  }
}

# --- Cloudflare R2: Proof Media Bucket ---

resource "cloudflare_r2_bucket" "styx_proofs" {
  account_id = var.cloudflare_account_id
  name       = "styx-proofs"
  location   = "WNAM"
}

# R2 object-lifecycle policies — auto-expire proof media 30 days after final
# review, honeypots after 7 (storage hygiene + GDPR data-minimization) — are NOT
# managed here: the pinned Cloudflare provider (~> 4.0) has no
# `cloudflare_r2_bucket_lifecycle` resource (it landed in provider v5). Until the
# provider is upgraded, apply these rules out-of-band via the Cloudflare dashboard,
# API, or `wrangler r2 bucket lifecycle`. Restoring Terraform management requires a
# deliberate v4 -> v5 provider migration (also rewrites the cloudflare_ruleset WAF
# resources) and is tracked as a separate change.

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
