variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "colon"
}

variable "api_gateway_name" {
  description = "API Gateway name"
  type        = string
}

variable "lambda_function_names" {
  description = "List of Lambda function names to monitor"
  type        = list(string)
}

variable "alert_email" {
  description = "Email address for alarm notifications"
  type        = string
}
