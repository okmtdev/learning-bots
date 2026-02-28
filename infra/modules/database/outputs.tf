################################################################################
# Users Table
################################################################################
output "users_table_name" {
  description = "Name of the Users DynamoDB table"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "ARN of the Users DynamoDB table"
  value       = aws_dynamodb_table.users.arn
}

################################################################################
# Bots Table
################################################################################
output "bots_table_name" {
  description = "Name of the Bots DynamoDB table"
  value       = aws_dynamodb_table.bots.name
}

output "bots_table_arn" {
  description = "ARN of the Bots DynamoDB table"
  value       = aws_dynamodb_table.bots.arn
}

################################################################################
# Recordings Table
################################################################################
output "recordings_table_name" {
  description = "Name of the Recordings DynamoDB table"
  value       = aws_dynamodb_table.recordings.name
}

output "recordings_table_arn" {
  description = "ARN of the Recordings DynamoDB table"
  value       = aws_dynamodb_table.recordings.arn
}

output "recordings_gsi_arn" {
  description = "ARN of the Recordings-by-bot GSI"
  value       = "${aws_dynamodb_table.recordings.arn}/index/${var.project}-recordings-by-bot"
}

################################################################################
# Bot Sessions Table
################################################################################
output "bot_sessions_table_name" {
  description = "Name of the Bot Sessions DynamoDB table"
  value       = aws_dynamodb_table.bot_sessions.name
}

output "bot_sessions_table_arn" {
  description = "ARN of the Bot Sessions DynamoDB table"
  value       = aws_dynamodb_table.bot_sessions.arn
}

output "bot_sessions_gsi_arn" {
  description = "ARN of the Bot Sessions-by-recall-bot GSI"
  value       = "${aws_dynamodb_table.bot_sessions.arn}/index/${var.project}-sessions-by-recall-bot"
}
