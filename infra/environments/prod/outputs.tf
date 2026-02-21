output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.networking.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.networking.cloudfront_distribution_id
}

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = module.api.api_gateway_invoke_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.auth.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.auth.user_pool_client_id
}

output "cognito_domain" {
  description = "Cognito Hosted UI domain"
  value       = module.auth.user_pool_domain
}

output "web_bucket_name" {
  description = "S3 web bucket name"
  value       = module.storage.web_bucket_name
}

output "recordings_bucket_name" {
  description = "S3 recordings bucket name"
  value       = module.storage.recordings_bucket_name
}

output "lambda_function_names" {
  description = "Lambda function names"
  value       = module.api.lambda_function_names
}

output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN"
  value       = aws_iam_role.github_actions.arn
}
