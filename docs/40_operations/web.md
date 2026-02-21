# Web アプリケーション運用設計書

## 1. 概要

Colon（コロン）Webアプリケーションのビルド、デプロイ、運用に関する設計を定義する。

---

## 2. アプリケーション構成

### 2.1 フロントエンド

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 14+ (App Router) |
| ビルド方式 | Static Export (`next export`) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| 国際化 | next-intl (ja / en) |
| 状態管理 | React Context + SWR |
| パッケージマネージャ | pnpm |
| テスト | Vitest + React Testing Library |
| Lint | ESLint + Prettier |

### 2.2 バックエンド（Lambda）

| 項目 | 内容 |
|------|------|
| ランタイム | Node.js 20.x |
| 言語 | TypeScript |
| バンドラ | esbuild |
| テスト | Vitest |
| バリデーション | Zod |
| DynamoDB SDK | @aws-sdk/client-dynamodb + @aws-sdk/lib-dynamodb |

### 2.3 ディレクトリ構成

```
application/
├── web/                          # フロントエンド
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── [locale]/         # 国際化ルート（ja/en の2ロケール）
│   │   │   │   ├── page.tsx      # ランディングページ
│   │   │   │   ├── dashboard/
│   │   │   │   ├── bots/
│   │   │   │   │   ├── new/      # ボット作成
│   │   │   │   │   ├── detail/   # ボット詳細・編集 (?id=xxx)
│   │   │   │   │   └── invite/   # ボット招待 (?id=xxx)
│   │   │   │   ├── recordings/
│   │   │   │   │   └── detail/   # 録画詳細 (?id=xxx)
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   │
│   │   │ ※ S3静的ホスティング (output: export) のため動的パス [id] は不使用。
│   │   │   IDはクエリパラメータ (?id=xxx) で渡す。
│   │   ├── components/           # 共通コンポーネント
│   │   │   ├── ui/               # 基本UIコンポーネント
│   │   │   ├── layout/           # レイアウト系
│   │   │   └── features/         # 機能別コンポーネント
│   │   ├── hooks/                # カスタムフック
│   │   ├── lib/                  # ユーティリティ
│   │   │   ├── api.ts            # APIクライアント
│   │   │   ├── auth.ts           # 認証ヘルパー
│   │   │   └── constants.ts
│   │   ├── messages/             # 国際化メッセージ
│   │   │   ├── ja.json
│   │   │   └── en.json
│   │   └── types/                # 型定義
│   ├── public/                   # 静的ファイル
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── api/                          # バックエンド Lambda
│   ├── src/
│   │   ├── functions/            # Lambda ハンドラー
│   │   │   ├── bot-crud.ts
│   │   │   ├── bot-invite.ts
│   │   │   ├── recording-crud.ts
│   │   │   ├── recording-webhook.ts
│   │   │   └── user-settings.ts
│   │   ├── lib/                  # 共通ライブラリ
│   │   │   ├── dynamodb.ts       # DynamoDB クライアント
│   │   │   ├── recall.ts         # Recall.ai クライアント
│   │   │   ├── s3.ts             # S3 クライアント
│   │   │   └── validators.ts     # Zod スキーマ
│   │   └── types/                # 型定義
│   ├── tsconfig.json
│   └── package.json
└── package.json                  # ワークスペースルート
```

---

## 3. 開発フロー

### 3.1 ブランチ戦略

| ブランチ | 用途 |
|---------|------|
| `main` | 本番デプロイ対象 |
| `feature/*` | 機能開発 |
| `fix/*` | バグ修正 |
| `docs/*` | ドキュメント修正 |

### 3.2 PR ルール
- PR作成時にCI自動実行（Lint, Test, Terraform Plan）
- セルフマージ可（初期スコープ、少人数想定）
- main へのforce push禁止

### 3.3 ローカル開発

```bash
# フロントエンド
cd application/web
pnpm install
pnpm dev          # localhost:3000

# バックエンド
cd application/api
pnpm install
pnpm test         # テスト実行
```

---

## 4. デプロイ

### 4.1 フロントエンドデプロイ

```
Push to main → GitHub Actions → pnpm build → S3 sync → CloudFront invalidation
```

| ステップ | コマンド / 処理 |
|---------|----------------|
| ビルド | `pnpm build` (next build && next export) |
| デプロイ | `aws s3 sync out/ s3://colon-web-*/ --delete` |
| キャッシュ無効化 | `aws cloudfront create-invalidation --paths "/*"` |

### 4.2 Lambda デプロイ

```
Push to main → GitHub Actions → esbuild bundle → zip → Lambda update
```

| ステップ | コマンド / 処理 |
|---------|----------------|
| バンドル | `esbuild` で各関数を個別バンドル |
| パッケージ | `zip` でアーカイブ |
| デプロイ | `aws lambda update-function-code` |

### 4.3 インフラデプロイ

```
Push to main (infra/ changes) → GitHub Actions → terraform plan → terraform apply
```

---

## 5. 監視・アラート

### 5.1 監視項目

| 項目 | メトリクス | 閾値 | 通知 |
|------|-----------|------|------|
| Lambda エラー | Errors / Invocations | > 5% | メール |
| Lambda 所要時間 | Duration p99 | > タイムアウトの80% | メール |
| API 5xx | 5XXError | > 10/分 | メール |
| API レイテンシ | Latency p95 | > 3秒 | メール |
| DynamoDB スロットリング | ThrottledRequests | > 0 | メール |
| S3 ストレージ | BucketSizeBytes | 情報のみ | - |

### 5.2 ログ

| コンポーネント | ログ出力先 | 保持期間 |
|---------------|-----------|---------|
| Lambda | CloudWatch Logs | 30日 |
| API Gateway | CloudWatch Logs | 30日 |
| CloudFront | S3 (アクセスログ) | 90日 |

### 5.3 ログフォーマット（Lambda）

```json
{
  "level": "INFO",
  "timestamp": "2026-02-21T14:00:00Z",
  "requestId": "xxx-xxx-xxx",
  "userId": "google-oauth2|123",
  "action": "createBot",
  "message": "Bot created successfully",
  "metadata": {
    "botId": "01JMXXXXXXX"
  }
}
```

---

## 6. 障害対応

### 6.1 障害レベル

| レベル | 定義 | 対応目標 |
|--------|------|---------|
| Critical | サービス全体停止 | 1時間以内に復旧 |
| Major | 主要機能（ボット招待・録画）の障害 | 4時間以内に復旧 |
| Minor | 一部機能の障害（設定変更不可等） | 24時間以内に復旧 |

### 6.2 ロールバック手順

**フロントエンド:**
1. S3 の前バージョンを再デプロイ（GitHub Actions から前のビルドを再実行）
2. CloudFront キャッシュ無効化

**Lambda:**
1. Lambda のバージョン/エイリアスで前バージョンに切り替え
2. `aws lambda update-alias --function-name colon-* --function-version {前バージョン}`

**インフラ:**
1. `git revert` でコードを戻す
2. `terraform apply` で前の状態に戻す

---

## 7. バックアップ・リカバリ

| 対象 | 方法 | RPO |
|------|------|-----|
| DynamoDB | ポイントインタイムリカバリ (PITR) | 5分 |
| S3 (録画) | バケットバージョニング無し（コスト優先） | N/A |
| Terraform State | S3 バージョニング有効 | 即時 |

---

## 8. コスト管理

### 8.1 AWS Budgets

| 項目 | 設定値 |
|------|--------|
| 月額予算 | $50（Recall.ai除く） |
| アラート 1 | 50% ($25) で通知 |
| アラート 2 | 80% ($40) で通知 |
| アラート 3 | 100% ($50) で通知 |

### 8.2 コスト最適化策

| 施策 | 詳細 |
|------|------|
| Lambda ARM64 | Graviton2 で 20% コスト削減 |
| DynamoDB オンデマンド | 低トラフィック時のコスト最小化 |
| S3 ライフサイクル | 90日後に Glacier 移行 |
| CloudFront Price Class 200 | 不要なエッジロケーション除外 |
| CloudWatch ログ保持 | 30日に制限 |

---

## 9. セキュリティ運用

### 9.1 定期作業

| 作業 | 頻度 | 内容 |
|------|------|------|
| 依存パッケージ更新 | 月次 | Dependabot / `pnpm audit` |
| AWS アクセス確認 | 月次 | IAM ポリシーレビュー |
| シークレットローテーション | 四半期 | SSM Parameter Store の値更新 |

### 9.2 インシデント対応

1. CloudWatch Alarm が通知を発火
2. CloudWatch Logs でエラー詳細を調査
3. 必要に応じてロールバック
4. 根本原因分析と修正PR作成
