# アーキテクチャ設計書

## 1. 概要

Colon（コロン）は、Google Meetに招待できるカスタマイズ可能なインタラクティブボットサービスである。本ドキュメントでは、システム全体のアーキテクチャを定義する。

### 設計方針

| 優先度 | 方針 | 具体策 |
|--------|------|--------|
| 1 | コスト最小化（特に固定費ゼロ） | サーバーレス構成、従量課金サービス活用 |
| 2 | コスパ・タイパの良い管理 | マネージドサービス活用、IaC |
| 3 | 初期スコープに集中 | Google Meetのみ、Googleログインのみ |

---

## 2. システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                         クライアント                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ブラウザ (Next.js SPA)                                   │   │
│  └──────────────────────┬───────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┼───────────────────────────────────────┐
│  AWS                    │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────┐                       │
│  │  CloudFront (CDN)                     │                       │
│  │  - 静的アセット配信                     │                       │
│  │  - API Gateway へのプロキシ             │                       │
│  └──────────┬───────────┬───────────────┘                       │
│             │           │                                       │
│     静的ファイル    API リクエスト                                  │
│             │           │                                       │
│             ▼           ▼                                       │
│  ┌──────────────┐  ┌──────────────────────┐                     │
│  │  S3           │  │  API Gateway          │                     │
│  │  (静的サイト)  │  │  (REST API)           │                     │
│  └──────────────┘  └──────────┬───────────┘                     │
│                               │                                 │
│                               ▼                                 │
│                    ┌──────────────────────┐                      │
│                    │  Lambda Functions     │                      │
│                    │  (Node.js Runtime)    │                      │
│                    └───┬──────┬───────┬───┘                      │
│                        │      │       │                          │
│              ┌─────────┘      │       └──────────┐              │
│              ▼                ▼                   ▼              │
│  ┌──────────────────┐ ┌────────────┐  ┌──────────────────┐      │
│  │  DynamoDB         │ │  S3         │  │  Cognito          │      │
│  │  (データストア)    │ │  (録画保存)  │  │  (認証/Google     │      │
│  │  - Users          │ │             │  │   OAuth 2.0)      │      │
│  │  - Bots           │ └────────────┘  └──────────────────┘      │
│  │  - Recordings     │                                          │
│  └──────────────────┘                                           │
│                                                                 │
│              ┌──────────────────────────────────┐               │
│              │  CloudWatch                       │               │
│              │  (ログ・モニタリング・アラーム)       │               │
│              └──────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘

                          │
                          │ HTTPS (API)
                          ▼
              ┌──────────────────────┐
              │  Recall.ai            │
              │  (外部サービス)        │
              │  - ボットの会議参加     │
              │  - リアルタイム転写     │
              │  - 録画取得            │
              │  - チャット/リアクション │
              └──────────────────────┘
```

---

## 3. コンポーネント詳細

### 3.1 フロントエンド

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 14+ (Static Export) |
| ホスティング | S3 + CloudFront |
| 認証 | Cognito Hosted UI (Google OAuth 2.0) |
| 状態管理 | React Context (AuthProvider, ToastProvider) + SWR (データフェッチ) |
| 国際化 | next-intl（依存関係のみ。実際のUIテキストは日本語ハードコード、翻訳ファイルは未使用） |
| ビルド設定 | `output: "export"`, `trailingSlash: true`, `images: { unoptimized: true }` |
| 固定費 | 実質ゼロ（従量課金のみ） |

**選定理由:** Static Exportにすることで、S3 + CloudFrontだけで配信可能。サーバー不要で固定費ゼロ。

### 3.2 認証

| 項目 | 内容 |
|------|------|
| サービス | Amazon Cognito User Pool |
| IdP | Google (OAuth 2.0 / OpenID Connect) |
| トークン | JWT (ID Token / Access Token / Refresh Token) |
| セッション | フロントエンドで localStorage にトークン保持（キー: `colon_tokens`） |
| トークン有効期限 | Access/ID Token: 1時間、Refresh Token: 30日 |

**フロー:**
1. ユーザーが「Googleでログイン」をクリック
2. Cognito Hosted UI → Google OAuth 同意画面（`identity_provider: Google` 指定）
3. Google認証完了 → `/{locale}/auth/callback` にリダイレクト
4. コールバックページが認可コードを Cognito `/oauth2/token` エンドポイントでトークンに交換
5. トークンを localStorage に保存、`GET /auth/me` でユーザー情報取得
6. ダッシュボードにリダイレクト

> **注意**: Refresh Token は保存されるが、現在の実装ではトークンリフレッシュフローは未実装。有効期限切れ時はトークンクリアされ再ログインが必要。

### 3.3 バックエンド API

| 項目 | 内容 |
|------|------|
| API | Amazon API Gateway (REST API) |
| ランタイム | AWS Lambda (Node.js 20.x) |
| 認証 | Cognito Authorizer |
| API形式 | RESTful |

**Lambda関数構成:**

| 関数名 | 責務 |
|--------|------|
| `bot-crud` | ボットのCRUD操作 |
| `bot-invite` | ボットのミーティング招待・退出（Recall.ai連携） |
| `recording-crud` | 録画のCRUD操作 |
| `recording-webhook` | Recall.aiからの録画完了Webhook受信 |
| `user-settings` | ユーザー設定の読み書き |

### 3.4 データストア

| 項目 | 内容 |
|------|------|
| サービス | Amazon DynamoDB |
| 課金モデル | オンデマンド（従量課金） |
| 固定費 | ゼロ |

**選定理由:** オンデマンドモードにより、初期段階では固定費ゼロ。スキーマレスでプロトタイプ開発に適している。

### 3.5 ファイルストレージ

| 項目 | 内容 |
|------|------|
| サービス | Amazon S3 |
| 用途 | 録画ファイル保存 |
| アクセス | CloudFront署名付きURLで配信 |
| ライフサイクル | 90日後にGlacierへ移行、365日後に削除 |

### 3.6 ボットエンジン（Recall.ai）

| 項目 | 内容 |
|------|------|
| サービス | Recall.ai |
| 連携方法 | REST API |
| Webhook認証 | Svix ライブラリによる署名検証（`svix-id`, `svix-timestamp`, `svix-signature` ヘッダー） |
| 主な機能 | ボットの会議参加、リアルタイム転写、録画、チャット送信、リアクション |

**Recall.ai連携フロー:**
1. ユーザーがWeb UIからミーティングURLを入力して招待
2. Lambda が Recall.ai API を呼び出し、ボットを会議に参加させる（`meeting_url`, `bot_name`, `recording_mode` を送信）
3. Recall.ai がリアルタイムで転写・インタラクションを実行
4. 会議終了後、Recall.ai が Webhook で録画完了を通知（Svix 署名付き）
5. Lambda が録画データを取得し、S3に保存
6. DynamoDB に録画メタデータを記録

> **注意**: 現在の実装では、Webhook受信時のS3アップロード・メタデータ保存・ボットステータス更新（ステップ5-6）は未完成。また、ボットのインタラクティブ機能（reaction/chat/voice + triggerMode）は Recall.ai API にまだ送信されていない。

### 3.7 モニタリング・ログ

| 項目 | 内容 |
|------|------|
| ログ | CloudWatch Logs (Lambda自動連携) |
| メトリクス | CloudWatch Metrics |
| アラーム | CloudWatch Alarms (Lambda エラー数 > 0、API Gateway 5xx) |
| 通知 | SNS トピック → メール通知 |

> **未実装のアラーム**: Lambda Duration p99、DynamoDB ThrottledRequests、API レイテンシ p95 のアラームは未作成。また CloudWatch Logs の保存期限設定も未設定。

---

## 4. セキュリティ

### 4.1 認証・認可
- Cognito による Google OAuth 2.0 認証
- API Gateway に Cognito Authorizer を設定
- Lambda 内でユーザーIDを検証し、自分のリソースのみアクセス可能

### 4.2 データ保護
- 通信: HTTPS (TLS 1.2+) のみ
- DynamoDB: AWS管理キーによる暗号化（デフォルト）
- S3: SSE-S3 によるサーバーサイド暗号化
- 録画URL: CloudFront署名付きURL（有効期限付き）

### 4.3 IAM
- Lambda 実行ロールは最小権限の原則に従う
- 各Lambda関数ごとに個別のIAMロールを割り当て

---

## 5. コスト予測（月額）

初期スコープ（少数ユーザー想定）での概算:

| サービス | 想定月額 | 備考 |
|----------|----------|------|
| CloudFront | $0〜1 | 無料枠内で収まる見込み |
| S3 (静的サイト) | $0.01〜 | 容量極小 |
| S3 (録画) | $0.023/GB | 録画量に依存 |
| API Gateway | $3.50/100万リクエスト | 少量なら $0〜1 |
| Lambda | $0.20/100万リクエスト | 少量なら $0〜1 |
| DynamoDB | $1.25/100万書込 | オンデマンドで $0〜1 |
| Cognito | 無料 | 50,000 MAU まで無料 |
| CloudWatch | $0〜1 | 基本的なログ |
| Recall.ai | 従量課金 | 利用時間に依存 |
| **合計（Recall.ai除く）** | **$0〜5** | **固定費ほぼゼロ** |

---

## 6. 技術スタック一覧

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Next.js 14+, React 18, TypeScript |
| スタイリング | Tailwind CSS |
| 状態管理 | React Context (AuthProvider, ToastProvider), SWR |
| API クライアント | カスタム `ApiClient` クラス (`fetch` ラッパー) |
| ユーティリティ | clsx |
| バックエンド | AWS Lambda (Node.js 20.x, TypeScript, arm64) |
| バリデーション | Zod |
| ビルドツール | esbuild (ESM バンドル) |
| テスト | Vitest |
| API | Amazon API Gateway (REST) |
| 認証 | Amazon Cognito + Google OAuth 2.0 |
| データベース | Amazon DynamoDB |
| ストレージ | Amazon S3 |
| CDN | Amazon CloudFront |
| 監視 | Amazon CloudWatch + SNS |
| Webhook検証 | Svix |
| ID生成 | ULID |
| IaC | Terraform |
| CI/CD | GitHub Actions (OIDC 認証) |
| パッケージマネージャ | pnpm (ワークスペース構成) |
| ボットエンジン | Recall.ai |
