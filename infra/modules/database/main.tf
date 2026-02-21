################################################################################
# Users Table
################################################################################
resource "aws_dynamodb_table" "users" {
  name         = "${var.project}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project
  }
}

################################################################################
# Bots Table
################################################################################
resource "aws_dynamodb_table" "bots" {
  name         = "${var.project}-bots"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "botId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "botId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project
  }
}

################################################################################
# Recordings Table
################################################################################
resource "aws_dynamodb_table" "recordings" {
  name         = "${var.project}-recordings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "recordingId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "recordingId"
    type = "S"
  }

  attribute {
    name = "botId"
    type = "S"
  }

  attribute {
    name = "startedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "${var.project}-recordings-by-bot"
    hash_key        = "botId"
    range_key       = "startedAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project
  }
}

################################################################################
# Bot Sessions Table
################################################################################
resource "aws_dynamodb_table" "bot_sessions" {
  name         = "${var.project}-bot-sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "botId"
  range_key    = "sessionId"

  attribute {
    name = "botId"
    type = "S"
  }

  attribute {
    name = "sessionId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project
  }
}
