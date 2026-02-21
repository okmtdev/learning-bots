variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "colon"
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "callback_urls" {
  description = "OAuth callback URLs"
  type        = list(string)
}

variable "logout_urls" {
  description = "OAuth logout URLs"
  type        = list(string)
}

variable "cognito_domain_prefix" {
  description = "Cognito Hosted UI domain prefix"
  type        = string
}
