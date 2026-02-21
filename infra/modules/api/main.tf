# ──────────────────────────────────────────────────────────────
# Data Sources
# ──────────────────────────────────────────────────────────────

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'placeholder' });"
    filename = "index.js"
  }
}

# ──────────────────────────────────────────────────────────────
# Locals
# ──────────────────────────────────────────────────────────────

locals {
  lambda_functions = {
    "bot-crud" = {
      memory_size = 256
      timeout     = 10
    }
    "bot-invite" = {
      memory_size = 256
      timeout     = 30
    }
    "recording-crud" = {
      memory_size = 256
      timeout     = 10
    }
    "recording-webhook" = {
      memory_size = 512
      timeout     = 60
    }
    "user-settings" = {
      memory_size = 256
      timeout     = 10
    }
  }

  api_methods = {
    "bots-GET" = {
      resource_id = aws_api_gateway_resource.bots.id
      http_method = "GET"
      lambda_key  = "bot-crud"
      authorized  = true
    }
    "bots-POST" = {
      resource_id = aws_api_gateway_resource.bots.id
      http_method = "POST"
      lambda_key  = "bot-crud"
      authorized  = true
    }
    "bots-botId-GET" = {
      resource_id = aws_api_gateway_resource.bot_id.id
      http_method = "GET"
      lambda_key  = "bot-crud"
      authorized  = true
    }
    "bots-botId-PUT" = {
      resource_id = aws_api_gateway_resource.bot_id.id
      http_method = "PUT"
      lambda_key  = "bot-crud"
      authorized  = true
    }
    "bots-botId-DELETE" = {
      resource_id = aws_api_gateway_resource.bot_id.id
      http_method = "DELETE"
      lambda_key  = "bot-crud"
      authorized  = true
    }
    "bots-botId-invite-POST" = {
      resource_id = aws_api_gateway_resource.bot_invite.id
      http_method = "POST"
      lambda_key  = "bot-invite"
      authorized  = true
    }
    "bots-botId-leave-POST" = {
      resource_id = aws_api_gateway_resource.bot_leave.id
      http_method = "POST"
      lambda_key  = "bot-invite"
      authorized  = true
    }
    "bots-botId-session-GET" = {
      resource_id = aws_api_gateway_resource.bot_session.id
      http_method = "GET"
      lambda_key  = "bot-invite"
      authorized  = true
    }
    "recordings-GET" = {
      resource_id = aws_api_gateway_resource.recordings.id
      http_method = "GET"
      lambda_key  = "recording-crud"
      authorized  = true
    }
    "recordings-recordingId-GET" = {
      resource_id = aws_api_gateway_resource.recording_id.id
      http_method = "GET"
      lambda_key  = "recording-crud"
      authorized  = true
    }
    "recordings-recordingId-DELETE" = {
      resource_id = aws_api_gateway_resource.recording_id.id
      http_method = "DELETE"
      lambda_key  = "recording-crud"
      authorized  = true
    }
    "auth-me-GET" = {
      resource_id = aws_api_gateway_resource.auth_me.id
      http_method = "GET"
      lambda_key  = "user-settings"
      authorized  = true
    }
    "settings-GET" = {
      resource_id = aws_api_gateway_resource.settings.id
      http_method = "GET"
      lambda_key  = "user-settings"
      authorized  = true
    }
    "settings-PUT" = {
      resource_id = aws_api_gateway_resource.settings.id
      http_method = "PUT"
      lambda_key  = "user-settings"
      authorized  = true
    }
    "settings-account-DELETE" = {
      resource_id = aws_api_gateway_resource.settings_account.id
      http_method = "DELETE"
      lambda_key  = "user-settings"
      authorized  = true
    }
    "webhook-recall-POST" = {
      resource_id = aws_api_gateway_resource.webhook_recall.id
      http_method = "POST"
      lambda_key  = "recording-webhook"
      authorized  = false
    }
  }
}

# ──────────────────────────────────────────────────────────────
# IAM – Shared assume-role policy
# ──────────────────────────────────────────────────────────────

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# ──────────────────────────────────────────────────────────────
# IAM – One role per Lambda (for_each)
# ──────────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda" {
  for_each = local.lambda_functions

  name               = "${var.project}-${each.key}-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  for_each = local.lambda_functions

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ──────────────────────────────────────────────────────────────
# IAM – Per-function policies
# ──────────────────────────────────────────────────────────────

resource "aws_iam_role_policy" "bot_crud" {
  name = "${var.project}-bot-crud-policy-${var.environment}"
  role = aws_iam_role.lambda["bot-crud"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [var.bots_table_arn]
      }
    ]
  })
}

resource "aws_iam_role_policy" "bot_invite" {
  name = "${var.project}-bot-invite-policy-${var.environment}"
  role = aws_iam_role.lambda["bot-invite"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.bots_table_arn,
          var.bot_sessions_table_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.environment}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "recording_crud" {
  name = "${var.project}-recording-crud-policy-${var.environment}"
  role = aws_iam_role.lambda["recording-crud"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.recordings_table_arn,
          var.recordings_gsi_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = ["${var.recordings_bucket_arn}/*"]
      }
    ]
  })
}

resource "aws_iam_role_policy" "recording_webhook" {
  name = "${var.project}-recording-webhook-policy-${var.environment}"
  role = aws_iam_role.lambda["recording-webhook"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.recordings_table_arn,
          var.recordings_gsi_arn,
          var.bots_table_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = ["${var.recordings_bucket_arn}/*"]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.environment}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "user_settings" {
  name = "${var.project}-user-settings-policy-${var.environment}"
  role = aws_iam_role.lambda["user-settings"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [var.users_table_arn]
      },
      {
        Effect   = "Allow"
        Action   = ["cognito-idp:AdminDeleteUser"]
        Resource = [var.cognito_user_pool_arn]
      }
    ]
  })
}

# ──────────────────────────────────────────────────────────────
# Lambda Functions
# ──────────────────────────────────────────────────────────────

resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions

  function_name = "${var.project}-${each.key}-${var.environment}"
  role          = aws_iam_role.lambda[each.key].arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  memory_size   = each.value.memory_size
  timeout       = each.value.timeout

  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      USERS_TABLE_NAME        = var.users_table_name
      BOTS_TABLE_NAME         = var.bots_table_name
      RECORDINGS_TABLE_NAME   = var.recordings_table_name
      BOT_SESSIONS_TABLE_NAME = var.bot_sessions_table_name
      RECORDINGS_BUCKET_NAME  = var.recordings_bucket_name
      REGION                  = data.aws_region.current.name
      SSM_PREFIX              = "/${var.project}/${var.environment}"
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# ──────────────────────────────────────────────────────────────
# API Gateway – REST API & Authorizer
# ──────────────────────────────────────────────────────────────

resource "aws_api_gateway_rest_api" "api" {
  name = "${var.project}-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_authorizer" "cognito" {
  name            = "cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.api.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [var.cognito_user_pool_arn]
  identity_source = "method.request.header.Authorization"
}

# ──────────────────────────────────────────────────────────────
# API Gateway – Resources
# ──────────────────────────────────────────────────────────────

# /bots
resource "aws_api_gateway_resource" "bots" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "bots"
}

# /bots/{botId}
resource "aws_api_gateway_resource" "bot_id" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.bots.id
  path_part   = "{botId}"
}

# /bots/{botId}/invite
resource "aws_api_gateway_resource" "bot_invite" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.bot_id.id
  path_part   = "invite"
}

# /bots/{botId}/leave
resource "aws_api_gateway_resource" "bot_leave" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.bot_id.id
  path_part   = "leave"
}

# /bots/{botId}/session
resource "aws_api_gateway_resource" "bot_session" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.bot_id.id
  path_part   = "session"
}

# /recordings
resource "aws_api_gateway_resource" "recordings" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "recordings"
}

# /recordings/{recordingId}
resource "aws_api_gateway_resource" "recording_id" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.recordings.id
  path_part   = "{recordingId}"
}

# /auth
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "auth"
}

# /auth/me
resource "aws_api_gateway_resource" "auth_me" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "me"
}

# /settings
resource "aws_api_gateway_resource" "settings" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "settings"
}

# /settings/account
resource "aws_api_gateway_resource" "settings_account" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.settings.id
  path_part   = "account"
}

# /webhook
resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "webhook"
}

# /webhook/recall
resource "aws_api_gateway_resource" "webhook_recall" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.webhook.id
  path_part   = "recall"
}

# ──────────────────────────────────────────────────────────────
# API Gateway – Methods & Integrations (for_each)
# ──────────────────────────────────────────────────────────────

resource "aws_api_gateway_method" "methods" {
  for_each = local.api_methods

  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = each.value.resource_id
  http_method   = each.value.http_method
  authorization = each.value.authorized ? "COGNITO_USER_POOLS" : "NONE"
  authorizer_id = each.value.authorized ? aws_api_gateway_authorizer.cognito.id : null
}

resource "aws_api_gateway_integration" "integrations" {
  for_each = local.api_methods

  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = each.value.resource_id
  http_method             = aws_api_gateway_method.methods[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.functions[each.value.lambda_key].invoke_arn
}

# ──────────────────────────────────────────────────────────────
# API Gateway – Deployment & Stage
# ──────────────────────────────────────────────────────────────

resource "aws_api_gateway_deployment" "api" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode({
      for k, v in aws_api_gateway_integration.integrations : k => v.id
    }))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.integrations
  ]
}

resource "aws_api_gateway_stage" "v1" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "v1"
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = aws_api_gateway_stage.v1.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = 100
    throttling_burst_limit = 200
  }
}

# ──────────────────────────────────────────────────────────────
# Lambda Permissions for API Gateway
# ──────────────────────────────────────────────────────────────

resource "aws_lambda_permission" "api_gateway" {
  for_each = local.lambda_functions

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
