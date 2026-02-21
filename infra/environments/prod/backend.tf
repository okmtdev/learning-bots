terraform {
  backend "s3" {
    bucket         = "colon-terraform-state-761624429622"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "colon-terraform-lock"
    encrypt        = true
  }
}
