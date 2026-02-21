# Colon - Infrastructure

Terraform による AWS インフラストラクチャ管理。

## ディレクトリ構成

```
infra/
├── environments/
│   └── prod/           # 本番環境
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       ├── outputs.tf
│       └── backend.tf
└── modules/
    ├── networking/     # CloudFront, OAI
    ├── auth/           # Cognito
    ├── api/            # API Gateway + Lambda
    ├── database/       # DynamoDB
    ├── storage/        # S3
    └── monitoring/     # CloudWatch Alarms
```

## 前提条件

- Terraform >= 1.5
- AWS CLI (認証情報設定済み)
- S3 バケット + DynamoDB テーブル（tfstate 管理用）を事前作成

## 初回セットアップ

1. `backend.tf` のバケット名を実際のアカウントIDに更新
2. シークレットを設定:

```bash
# terraform.tfvars.local を作成（git-ignored）
cat > infra/environments/prod/terraform.tfvars.local << 'EOF'
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"
alert_email          = "your-email@example.com"
EOF
```

3. 実行:

```bash
cd infra/environments/prod
terraform init
terraform plan -var-file=terraform.tfvars.local
terraform apply -var-file=terraform.tfvars.local
```

## SSM Parameter Store

以下のパラメータを AWS コンソールまたは CLI で事前設定:

| パス | タイプ | 説明 |
|------|--------|------|
| `/colon/prod/recall-api-key` | SecureString | Recall.ai API キー |
| `/colon/prod/recall-webhook-secret` | SecureString | Recall.ai Webhook シークレット |
| `/colon/prod/cloudfront-signing-key` | SecureString | CloudFront 署名キー |
