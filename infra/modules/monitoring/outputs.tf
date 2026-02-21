output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "alarm_arns" {
  description = "Map of all CloudWatch alarm ARNs"
  value = merge(
    { for k, v in aws_cloudwatch_metric_alarm.lambda_errors : k => v.arn },
    { "api-5xx" = aws_cloudwatch_metric_alarm.api_5xx.arn }
  )
}
