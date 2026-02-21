locals {
  # API Gateway invoke URL is like: https://abc123.execute-api.ap-northeast-1.amazonaws.com/v1
  api_url_without_scheme = replace(var.api_gateway_invoke_url, "https://", "")
  api_gateway_domain     = split("/", local.api_url_without_scheme)[0]
  api_gateway_stage      = "/${split("/", local.api_url_without_scheme)[1]}"
  s3_origin_id           = "S3-${var.web_bucket_id}"
  api_origin_id          = "API-${var.api_gateway_id}"
}

# ============================================================
# CloudFront Origin Access Identity
# ============================================================
resource "aws_cloudfront_origin_access_identity" "web" {
  comment = "${var.project}-${var.environment} web OAI"
}

# ============================================================
# CloudFront Distribution
# ============================================================
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "${var.project}-${var.environment} distribution"
  price_class         = "PriceClass_200"

  aliases = var.domain_name != "" ? [var.domain_name] : []

  # ----------------------------------------------------------
  # Origin 1: S3 bucket (web assets)
  # ----------------------------------------------------------
  origin {
    domain_name = var.web_bucket_regional_domain_name
    origin_id   = local.s3_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.web.cloudfront_access_identity_path
    }
  }

  # ----------------------------------------------------------
  # Origin 2: API Gateway
  # ----------------------------------------------------------
  origin {
    domain_name = local.api_gateway_domain
    origin_id   = local.api_origin_id
    origin_path = local.api_gateway_stage

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # ----------------------------------------------------------
  # Default cache behavior → S3
  # ----------------------------------------------------------
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
    compress    = true
  }

  # ----------------------------------------------------------
  # Ordered cache behavior → API Gateway (/api/*)
  # ----------------------------------------------------------
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.api_origin_id
    viewer_protocol_policy = "https-only"

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id

    compress = true
  }

  # ----------------------------------------------------------
  # Custom error responses (SPA routing)
  # ----------------------------------------------------------
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # ----------------------------------------------------------
  # Viewer certificate
  # ----------------------------------------------------------
  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : null
  }

  # ----------------------------------------------------------
  # Restrictions
  # ----------------------------------------------------------
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-distribution"
    Environment = var.environment
    Project     = var.project
  }
}

# ============================================================
# Managed cache & origin request policies (data sources)
# ============================================================
data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}
