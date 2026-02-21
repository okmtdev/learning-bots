variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "colon"
}

variable "web_bucket_regional_domain_name" {
  description = "S3 web bucket regional domain name"
  type        = string
}

variable "web_bucket_id" {
  description = "S3 web bucket ID"
  type        = string
}

variable "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  type        = string
}

variable "api_gateway_id" {
  description = "API Gateway REST API ID"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 (optional)"
  type        = string
  default     = ""
}
