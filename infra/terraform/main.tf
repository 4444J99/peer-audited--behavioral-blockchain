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
      version = "~> 5.0"
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
  # v5 location codes are lowercase ("wnam" = Western North America); v4 used "WNAM".
  location = "wnam"
}

# R2 object-lifecycle policies — auto-expire proof media 30 days after final
# review, honeypots after 7 (storage hygiene + GDPR data-minimization).
#
# Provider v5 (regenerated from Cloudflare's OpenAPI schema) replaces v4's
# day-based blocks (delete_objects_after { days = N }) with age *transitions*
# whose conditions are expressed in SECONDS — the schema states "after an object
# reaches an age in seconds." Day intent is therefore encoded as days * 86400:
#   30d = 2592000s · 7d = 604800s · 1d = 86400s
resource "cloudflare_r2_bucket_lifecycle" "proofs_cleanup" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.styx_proofs.name

  rules = [
    {
      id      = "auto-expire-proofs"
      enabled = true

      conditions = {
        prefix = "proofs/"
      }

      # Abort incomplete multipart uploads after 1 day (86400s).
      abort_multipart_uploads_transition = {
        condition = {
          type    = "Age"
          max_age = 86400
        }
      }

      # Delete proof objects 30 days (2592000s) after upload.
      delete_objects_transition = {
        condition = {
          type    = "Age"
          max_age = 2592000
        }
      }
    },
    {
      id      = "auto-expire-honeypots"
      enabled = true

      conditions = {
        prefix = "honeypots/"
      }

      # Delete honeypot objects 7 days (604800s) after upload.
      delete_objects_transition = {
        condition = {
          type    = "Age"
          max_age = 604800
        }
      }
    },
  ]
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
