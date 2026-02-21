environment        = "prod"
project            = "colon"
aws_region         = "ap-northeast-1"
cognito_domain_prefix = "colon-auth"
alert_email        = "admin@example.com"

# Set via environment variables or terraform.tfvars.local (git-ignored):
# google_client_id     = "xxx"
# google_client_secret = "xxx"
# domain_name          = "colon.example.com"
# acm_certificate_arn  = "arn:aws:acm:us-east-1:..."
