output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_oai_arn" {
  description = "CloudFront Origin Access Identity ARN"
  value       = aws_cloudfront_origin_access_identity.web.iam_arn
}

output "cloudfront_oai_id" {
  description = "CloudFront Origin Access Identity ID"
  value       = aws_cloudfront_origin_access_identity.web.id
}
