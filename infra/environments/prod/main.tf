terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# Database Module
# -----------------------------------------------------------------------------
module "database" {
  source      = "../../modules/database"
  environment = var.environment
  project     = var.project
}

# -----------------------------------------------------------------------------
# Storage Module (depends on networking for OAI)
# Note: Circular dependency - storage needs OAI, networking needs bucket.
# We break this by creating storage first with a placeholder OAI,
# then networking, then update storage policy.
# In practice, we pass the OAI ARN from networking into storage.
# To resolve: create OAI in networking first, use depends_on, or
# create OAI in a separate resource. Here we create OAI in networking
# and reference it.
# Approach: Create networking module which outputs OAI, pass to storage.
# But networking needs bucket domain name from storage...
# Solution: Use a separate OAI resource at the environment level.
# -----------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_identity" "web" {
  comment = "${var.project} web OAI"
}

module "storage" {
  source             = "../../modules/storage"
  environment        = var.environment
  project            = var.project
  account_id         = data.aws_caller_identity.current.account_id
  region             = var.aws_region
  cloudfront_oai_arn = aws_cloudfront_origin_access_identity.web.iam_arn
}

# -----------------------------------------------------------------------------
# Auth Module
# -----------------------------------------------------------------------------
module "auth" {
  source                = "../../modules/auth"
  environment           = var.environment
  project               = var.project
  google_client_id      = var.google_client_id
  google_client_secret  = var.google_client_secret
  cognito_domain_prefix = var.cognito_domain_prefix
  callback_urls         = [
    var.domain_name != "" ? "https://${var.domain_name}/auth/callback" : "https://${module.networking.cloudfront_domain_name}/auth/callback",
    "http://localhost:3000/auth/callback",
  ]
  logout_urls = [
    var.domain_name != "" ? "https://${var.domain_name}/" : "https://${module.networking.cloudfront_domain_name}/",
    "http://localhost:3000/",
  ]
}

# -----------------------------------------------------------------------------
# API Module
# -----------------------------------------------------------------------------
module "api" {
  source                  = "../../modules/api"
  environment             = var.environment
  project                 = var.project
  cognito_user_pool_arn   = module.auth.user_pool_arn
  cognito_user_pool_id    = module.auth.user_pool_id
  users_table_arn         = module.database.users_table_arn
  users_table_name        = module.database.users_table_name
  bots_table_arn          = module.database.bots_table_arn
  bots_table_name         = module.database.bots_table_name
  recordings_table_arn    = module.database.recordings_table_arn
  recordings_table_name   = module.database.recordings_table_name
  recordings_gsi_arn      = module.database.recordings_gsi_arn
  bot_sessions_table_arn  = module.database.bot_sessions_table_arn
  bot_sessions_table_name = module.database.bot_sessions_table_name
  recordings_bucket_arn   = module.storage.recordings_bucket_arn
  recordings_bucket_name  = module.storage.recordings_bucket_name
}

# -----------------------------------------------------------------------------
# Networking Module
# -----------------------------------------------------------------------------
module "networking" {
  source                          = "../../modules/networking"
  environment                     = var.environment
  project                         = var.project
  web_bucket_regional_domain_name = module.storage.web_bucket_regional_domain_name
  web_bucket_id                   = module.storage.web_bucket_id
  api_gateway_invoke_url          = module.api.api_gateway_invoke_url
  api_gateway_id                  = module.api.api_gateway_id
  domain_name                     = var.domain_name
  acm_certificate_arn             = var.acm_certificate_arn
}

# -----------------------------------------------------------------------------
# Monitoring Module
# -----------------------------------------------------------------------------
module "monitoring" {
  source                = "../../modules/monitoring"
  environment           = var.environment
  project               = var.project
  api_gateway_name      = "${var.project}-api"
  lambda_function_names = values(module.api.lambda_function_names)
  alert_email           = var.alert_email
}

# -----------------------------------------------------------------------------
# GitHub Actions OIDC Provider (already exists in account, use data source)
# -----------------------------------------------------------------------------
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_role" "github_actions" {
  name = "${var.project}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # environment: production を使う場合は environment:production 形式になる
            # ref:refs/heads/main はブランチ直接実行の場合
            "token.actions.githubusercontent.com:sub" = [
              "repo:*:environment:production",
              "repo:*:ref:refs/heads/main"
            ]
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "github_actions" {
  name = "${var.project}-github-actions-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          module.storage.web_bucket_arn,
          "${module.storage.web_bucket_arn}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
        ]
        Resource = [for arn in values(module.api.lambda_function_arns) : arn]
      },
    ]
  })
}
