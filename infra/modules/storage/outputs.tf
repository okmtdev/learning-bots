################################################################################
# Web Bucket
################################################################################
output "web_bucket_name" {
  description = "Name of the web S3 bucket"
  value       = aws_s3_bucket.web.bucket
}

output "web_bucket_arn" {
  description = "ARN of the web S3 bucket"
  value       = aws_s3_bucket.web.arn
}

output "web_bucket_regional_domain_name" {
  description = "Regional domain name of the web S3 bucket"
  value       = aws_s3_bucket.web.bucket_regional_domain_name
}

output "web_bucket_id" {
  description = "ID of the web S3 bucket"
  value       = aws_s3_bucket.web.id
}

################################################################################
# Recordings Bucket
################################################################################
output "recordings_bucket_name" {
  description = "Name of the recordings S3 bucket"
  value       = aws_s3_bucket.recordings.bucket
}

output "recordings_bucket_arn" {
  description = "ARN of the recordings S3 bucket"
  value       = aws_s3_bucket.recordings.arn
}

output "recordings_bucket_regional_domain_name" {
  description = "Regional domain name of the recordings S3 bucket"
  value       = aws_s3_bucket.recordings.bucket_regional_domain_name
}

output "recordings_bucket_id" {
  description = "ID of the recordings S3 bucket"
  value       = aws_s3_bucket.recordings.id
}
