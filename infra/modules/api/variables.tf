variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "colon"
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN for authorizer"
  type        = string
}

variable "users_table_arn" {
  description = "DynamoDB users table ARN"
  type        = string
}

variable "bots_table_arn" {
  description = "DynamoDB bots table ARN"
  type        = string
}

variable "recordings_table_arn" {
  description = "DynamoDB recordings table ARN"
  type        = string
}

variable "recordings_gsi_arn" {
  description = "DynamoDB recordings GSI ARN"
  type        = string
}

variable "bot_sessions_table_arn" {
  description = "DynamoDB bot-sessions table ARN"
  type        = string
}

variable "recordings_bucket_arn" {
  description = "S3 recordings bucket ARN"
  type        = string
}

variable "users_table_name" {
  description = "DynamoDB users table name"
  type        = string
}

variable "bots_table_name" {
  description = "DynamoDB bots table name"
  type        = string
}

variable "recordings_table_name" {
  description = "DynamoDB recordings table name"
  type        = string
}

variable "bot_sessions_table_name" {
  description = "DynamoDB bot-sessions table name"
  type        = string
}

variable "recordings_bucket_name" {
  description = "S3 recordings bucket name"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}
