output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.api.id
}

output "api_gateway_invoke_url" {
  description = "API Gateway stage invoke URL"
  value       = aws_api_gateway_stage.v1.invoke_url
}

output "api_gateway_execution_arn" {
  description = "API Gateway execution ARN"
  value       = aws_api_gateway_rest_api.api.execution_arn
}

output "lambda_function_names" {
  description = "Map of Lambda function names"
  value       = { for k, v in aws_lambda_function.functions : k => v.function_name }
}

output "lambda_function_arns" {
  description = "Map of Lambda function ARNs"
  value       = { for k, v in aws_lambda_function.functions : k => v.arn }
}
