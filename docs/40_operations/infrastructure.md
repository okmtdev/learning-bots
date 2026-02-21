# インフラストラクチャ設計書

## 1. 概要

Colon（コロン）のAWSインフラストラクチャをTerraformで構築・管理する。本ドキュメントではインフラ構成、Terraform設計、環境戦略を定義する。

### 設計方針
- 固定費ゼロを目指すサーバーレス構成
- Terraform による完全な IaC 管理
- 初期スコープは単一環境（production）から開始、必要に応じてstaging追加

---

## 2. AWS アカウント・リージョン

| 項目 | 内容 |
|------|------|
| AWSアカウント | 単一アカウント（初期スコープ） |
| メインリージョン | `ap-northeast-1`（東京） |
| CloudFront | `us-east-1`（グローバル / ACM証明書用） |

---

## 3. Terraform 構成

### 3.1 ディレクトリ構成

```
infra/
├── environments/
│   └── prod/
│       ├── main.tf          # モジュール呼び出し
│       ├── variables.tf     # 環境固有変数
│       ├── terraform.tfvars # 環境固有値
│       ├── outputs.tf       # 出力値
│       └── backend.tf       # tfstate 管理設定
├── modules/
│   ├── networking/          # CloudFront, Route53
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── auth/                # Cognito
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── api/                 # API Gateway + Lambda
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/            # DynamoDB
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── storage/             # S3
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── monitoring/          # CloudWatch
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── README.md
```

### 3.2 State 管理

| 項目 | 内容 |
|------|------|
| バックエンド | S3 + DynamoDB (state lock) |
| State バケット | `colon-terraform-state-{account-id}` |
| Lock テーブル | `colon-terraform-lock` |
| 暗号化 | SSE-S3 |

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "colon-terraform-state-XXXXXXXXXXXX"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "colon-terraform-lock"
    encrypt        = true
  }
}
```

---

## 4. リソース詳細

### 4.1 ネットワーキング（modules/networking）

#### CloudFront Distribution

| 項目 | 設定値 |
|------|--------|
| Origin 1 | S3 バケット（静的サイト）- OAI 経由 |
| Origin 2 | API Gateway - カスタムオリジン |
| Behavior 1 | `/api/*` → API Gateway |
| Behavior 2 | `/*` → S3 (デフォルト) |
| Price Class | `PriceClass_200`（日本含むアジア対応） |
| SSL証明書 | ACM (us-east-1) |
| WAF | 無し（初期スコープ、コスト優先） |

#### Route 53（オプション・未実装）

| 項目 | 内容 |
|------|------|
| ドメイン | `colon.example.com`（要取得） |
| レコード | A (Alias) → CloudFront |
| API | `colon.example.com/api/*` → CloudFront → API Gateway |

> CloudFront の `domain_name` 変数によるカスタムドメイン対応は任意。Route 53 リソースは Terraform に未定義。

### 4.2 認証（modules/auth）

#### Cognito User Pool

| 項目 | 設定値 |
|------|--------|
| User Pool 名 | `colon-user-pool` |
| IdP | Google (OpenID Connect) |
| コールバックURL | `https://colon.example.com/auth/callback` |
| サインアウトURL | `https://colon.example.com/` |
| トークン有効期限 | Access: 1時間, ID: 1時間, Refresh: 30日 |
| Hosted UI | 有効化 |

### 4.3 API（modules/api）

#### API Gateway

| 項目 | 設定値 |
|------|--------|
| 名称 | `colon-api` |
| タイプ | REST API |
| ステージ | `v1` |
| Authorizer | Cognito User Pool Authorizer |
| スロットリング | 100 req/sec (バースト: 200) |
| CORS | なし（CloudFront 同一オリジンプロキシで対応） |

#### Lambda Functions

| 関数名 | メモリ | タイムアウト | 説明 |
|--------|--------|-------------|------|
| `colon-bot-crud-{env}` | 256 MB | 10秒 | ボット CRUD |
| `colon-bot-invite-{env}` | 256 MB | 30秒 | ボット招待・退出 |
| `colon-recording-crud-{env}` | 256 MB | 10秒 | 録画 CRUD |
| `colon-recording-webhook-{env}` | 512 MB | 60秒 | Webhook 受信・録画保存 |
| `colon-user-settings-{env}` | 256 MB | 10秒 | ユーザー設定 |

**共通設定:**
| 項目 | 設定値 |
|------|--------|
| ランタイム | Node.js 20.x |
| アーキテクチャ | arm64 (Graviton2, コスト20%削減) |
| 環境変数 | SSM Parameter Store から取得 |
| ログ | CloudWatch Logs 自動連携 |

### 4.4 データベース（modules/database）

#### DynamoDB テーブル

| テーブル名 | キャパシティモード | ポイントインタイムリカバリ |
|-----------|-------------------|--------------------------|
| `colon-users` | オンデマンド | 有効 |
| `colon-bots` | オンデマンド | 有効 |
| `colon-recordings` | オンデマンド | 有効 |
| `colon-bot-sessions` | オンデマンド | 有効（TTL有効） |

### 4.5 ストレージ（modules/storage）

#### S3 バケット

| バケット | パブリックアクセス | バージョニング | ライフサイクル |
|---------|-------------------|---------------|---------------|
| `colon-web-*` | ブロック | 無効 | なし |
| `colon-recordings-*` | ブロック | 無効 | 90日→Glacier, 365日→削除 |

### 4.6 モニタリング（modules/monitoring）

#### CloudWatch Alarms

| アラーム | 条件 | 通知先 | 実装状況 |
|---------|------|--------|------|
| Lambda エラー数 | Errors Sum > 0 (5分間) | SNS → メール | ✓ 実装済み（各Lambda関数毎） |
| API Gateway 5xx | 5xxエラー > 0 (5分間) | SNS → メール | ✓ 実装済み |
| Lambda 実行時間 | p99 > タイムアウトの80% | SNS → メール | ✗ 未実装 |
| DynamoDB スロットリング | ThrottledRequests > 0 | SNS → メール | ✗ 未実装 |
| API レイテンシ | p95 > 3秒 | SNS → メール | ✗ 未実装 |

> **注意**: CloudWatch Logs の保存期限設定は Terraform で管理されていない。Lambda 自動作成のロググループは無期限保存となる。

---

## 5. シークレット管理

| シークレット | 管理場所 | 説明 |
|---|---|---|
| Google OAuth Client ID | Terraform 変数 | Cognito IdP 設定用 |
| Google OAuth Client Secret | Terraform 変数 (sensitive) | Cognito IdP 設定用 |
| Recall.ai API Key | SSM Parameter Store (SecureString) | Recall.ai API 認証 |
| Recall.ai Webhook Secret | SSM Parameter Store (SecureString) | Svix 署名検証用 |
| CloudFront Signing Key | SSM Parameter Store (SecureString) | 署名付きURL生成用 |

> **注意**: SSM パラメータは Terraform では作成されず、手動でプロビジョニングが必要。

SSM Parameter Store のパス規約:
```
/colon/prod/google-oauth-client-id
/colon/prod/google-oauth-client-secret
/colon/prod/recall-api-key
/colon/prod/recall-webhook-secret
/colon/prod/cloudfront-signing-key
```

---

## 6. IAM 設計

### 6.1 Lambda 実行ロール

各Lambda関数に個別のIAMロールを割り当て、最小権限を付与する。

| 関数 | 必要な権限 |
|------|-----------|
| `colon-bot-crud` | DynamoDB (bots テーブル R/W, bot-sessions テーブル R) |
| `colon-bot-invite` | DynamoDB (bots, bot-sessions R/W), SSM (Recall API Key 読取) |
| `colon-recording-crud` | DynamoDB (recordings R/W), S3 (recordings 読取/削除) |
| `colon-recording-webhook` | DynamoDB (recordings, bots, bot-sessions R/W), S3 (recordings 書込), SSM (Recall keys 読取) |
| `colon-user-settings` | DynamoDB (users, bots, recordings R/W), S3 (recordings 削除), Cognito (ユーザー削除) |

> **注意**: `colon-recording-crud` には CloudFront 署名付きURL生成用の権限（SSM 署名キー読取）が未付与。

---

## 7. CI/CD パイプライン

### 7.1 GitHub Actions ワークフロー

```
┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────┐
│  Push /   │ →  │  Lint &    │ →  │  Terraform │ →  │  Deploy   │
│  PR       │    │  Test      │    │  Plan      │    │  Apply    │
└──────────┘    └───────────┘    └────────────┘    └──────────┘
```

| ワークフロー | トリガー | 処理内容 |
|---|---|---|
| `ci.yml` | PR作成/更新 | Lint, Test (`continue-on-error: true`), Terraform Plan (条件付き) |
| `deploy-infra.yml` | main マージ (infra/ 変更時) | Terraform Apply (`-auto-approve`)、`production` 環境 |
| `deploy-app.yml` | main マージ (application/web/ 変更時) | Build & S3 デプロイ & CloudFront キャッシュ無効化 |
| `deploy-lambda.yml` | main マージ (application/api/ 変更時) | Lambda コード更新 |

> **注意**: `deploy-lambda.yml` の関数名が `colon-${func}` となっているが、Terraform では `colon-${func}-{env}` で作成されるため、デプロイが失敗する可能性がある。

### 7.2 OIDC 認証

GitHub Actions から AWS への認証は OIDC (OpenID Connect) を使用。長期間のアクセスキーは使用しない。

```hcl
# GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["..."]
}
```

---

## 8. タグ戦略

すべてのAWSリソースに以下のタグを付与する。

| タグキー | 値 | 説明 |
|---------|-----|------|
| `Project` | `colon` | プロジェクト名 |
| `Environment` | `prod` | 環境名 |
| `ManagedBy` | `terraform` | 管理方法 |

```hcl
# provider.tf
provider "aws" {
  region = "ap-northeast-1"

  default_tags {
    tags = {
      Project     = "colon"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
```
