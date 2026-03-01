# データベーススキーマ設計書

## 1. 概要

Colon（コロン）のデータストアとして Amazon DynamoDB を使用する。本ドキュメントでは、テーブル設計とアクセスパターンを定義する。

### 設計方針
- シングルテーブルデザインではなく、テーブル分割方式を採用（可読性・保守性重視）
- オンデマンドキャパシティモード（従量課金・固定費ゼロ）
- GSI（グローバルセカンダリインデックス）は最小限に抑える

---

## 2. テーブル一覧

| テーブル名 | 説明 | PK | SK |
|-----------|------|----|----|
| `colon-users` | ユーザー情報 | `userId` | - |
| `colon-bots` | ボット設定 | `userId` | `botId` |
| `colon-recordings` | 録画メタデータ | `userId` | `recordingId` |
| `colon-bot-sessions` | ボットのミーティング参加セッション | `botId` | `sessionId` |
| `colon-meeting-events` | ミーティング中のイベント（転写・リアクション・コメント） | `sessionId` | `eventId` |

---

## 3. テーブル詳細

### 3.1 colon-users

ユーザーアカウント情報を管理する。

| 属性名 | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `userId` (PK) | String | ✅ | Cognito Sub（Google OAuth の subject） |
| `email` | String | ✅ | メールアドレス |
| `displayName` | String | ✅ | 表示名 |
| `avatarUrl` | String | ❌ | Google プロフィール画像 URL |
| `language` | String | ✅ | 表示言語 (`ja` / `en`)。デフォルト: `ja` |
| `createdAt` | String | ✅ | 作成日時 (ISO 8601) |
| `updatedAt` | String | ✅ | 更新日時 (ISO 8601) |

**アクセスパターン:**
| パターン | キー条件 |
|----------|----------|
| ユーザー情報取得 | PK = `userId` |

---

### 3.2 colon-bots

ボットの設定情報を管理する。

| 属性名 | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `userId` (PK) | String | ✅ | 所有ユーザーID |
| `botId` (SK) | String | ✅ | ボットID（ULID） |
| `botName` | String | ✅ | ボット名（1〜50文字） |
| `isInteractiveEnabled` | Boolean | ✅ | インタラクティブ機能の ON/OFF |
| `isRecordingEnabled` | Boolean | ✅ | 録画機能の ON/OFF |
| `triggerMode` | String | ❌ | 呼び出し方。`chat_only` / `name_reaction` / `all_reaction`。インタラクティブON時必須 |
| `features` | Map | ❌ | ボット機能の詳細設定（下記参照） |
| `status` | String | ✅ | ステータス。`idle` / `in_meeting` |
| `createdAt` | String | ✅ | 作成日時 (ISO 8601) |
| `updatedAt` | String | ✅ | 更新日時 (ISO 8601) |

**`features` Map 構造:**

```json
{
  "reaction": {
    "enabled": true,
    "instruction": "参加者が面白いことを言ったらリアクションしてください"
  },
  "chat": {
    "enabled": true,
    "instruction": "会議の要約を求められたらチャットで投稿してください"
  },
  "voice": {
    "enabled": false,
    "instruction": ""
  }
}
```

| features 内属性 | 型 | 説明 |
|---|---|---|
| `reaction.enabled` | Boolean | リアクション機能の ON/OFF |
| `reaction.instruction` | String | リアクションの指示文（最大1000文字） |
| `chat.enabled` | Boolean | チャット機能の ON/OFF |
| `chat.instruction` | String | チャットの指示文（最大1000文字） |
| `voice.enabled` | Boolean | 自動音声機能の ON/OFF |
| `voice.instruction` | String | 自動音声の指示文（最大1000文字） |

**アクセスパターン:**
| パターン | キー条件 |
|----------|----------|
| ユーザーのボット一覧取得 | PK = `userId` |
| ボット詳細取得 | PK = `userId`, SK = `botId` |

---

### 3.3 colon-recordings

録画のメタデータを管理する。録画ファイル本体は S3 に保存。

| 属性名 | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `userId` (PK) | String | ✅ | 所有ユーザーID |
| `recordingId` (SK) | String | ✅ | 録画ID（ULID） |
| `botId` | String | ✅ | 録画したボットID |
| `botName` | String | ✅ | 録画時のボット名（非正規化） |
| `meetingUrl` | String | ✅ | Google Meet URL |
| `s3Key` | String | ✅ | S3 上のファイルパス |
| `fileSizeMb` | Number | ❌ | ファイルサイズ (MB) |
| `durationSeconds` | Number | ❌ | 録画時間（秒） |
| `recallBotId` | String | ✅ | Recall.ai のボットID |
| `status` | String | ✅ | `processing` / `ready` / `failed` |
| `startedAt` | String | ✅ | 録画開始日時 (ISO 8601) |
| `endedAt` | String | ❌ | 録画終了日時 (ISO 8601) |
| `createdAt` | String | ✅ | 作成日時 (ISO 8601) |

**GSI: `colon-recordings-by-bot`**

| 属性 | 役割 |
|------|------|
| `botId` | GSI PK |
| `startedAt` | GSI SK |

**アクセスパターン:**
| パターン | キー条件 |
|----------|----------|
| ユーザーの録画一覧取得 | PK = `userId`（SK降順） |
| ボット別録画一覧取得 | GSI PK = `botId`, GSI SK = `startedAt` |
| 録画詳細取得 | PK = `userId`, SK = `recordingId` |

---

### 3.4 colon-bot-sessions

ボットのミーティング参加セッションを管理する。

| 属性名 | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `botId` (PK) | String | ✅ | ボットID |
| `sessionId` (SK) | String | ✅ | セッションID（ULID） |
| `userId` | String | ✅ | 所有ユーザーID |
| `meetingUrl` | String | ✅ | Google Meet URL |
| `recallBotId` | String | ✅ | Recall.ai で作成されたボットインスタンスID |
| `status` | String | ✅ | `joining` / `in_meeting` / `leaving` / `ended` |
| `joinedAt` | String | ✅ | 参加開始日時 (ISO 8601) |
| `leftAt` | String | ❌ | 退出日時 (ISO 8601) |
| `createdAt` | String | ✅ | 作成日時 (ISO 8601) |
| `ttl` | Number | ❌ | TTL（セッション終了後24時間で自動削除） |

**アクセスパターン:**
| パターン | キー条件 |
|----------|----------|
| ボットの現在のセッション取得 | PK = `botId`, `status` = `in_meeting` |
| ボットのセッション履歴 | PK = `botId`（SK降順） |

---

### 3.5 colon-meeting-events

ミーティング中に発生するイベント（リアルタイム転写、リアクション、チャットコメント）を永続保存する。

| 属性名 | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `sessionId` (PK) | String | ✅ | ボットセッションID（`colon-bot-sessions` の `sessionId`） |
| `eventId` (SK) | String | ✅ | イベントID（ULID） |
| `userId` | String | ✅ | 所有ユーザーID |
| `botId` | String | ✅ | ボットID |
| `eventType` | String | ✅ | `transcription` / `reaction` / `comment` |
| `speakerName` | String | ✅ | 発言者・リアクション者の名前 |
| `content` | String | ✅ | 転写テキスト / リアクション絵文字 / コメント本文 |
| `timestamp` | String | ✅ | イベント発生日時 (ISO 8601) |
| `language` | String | ❌ | 転写の言語コード（例: `ja`, `en`）。`transcription` 時のみ |
| `isFinal` | Boolean | ❌ | 転写が確定済みか。`transcription` 時のみ |
| `createdAt` | String | ✅ | レコード作成日時 (ISO 8601) |

**データ保持:** TTL なし（永続保存）

**eventType 別の content 内容:**

| eventType | content の内容 | 例 |
|-----------|-------------|-----|
| `transcription` | リアルタイム転写テキスト | `"本日の議題について説明します"` |
| `reaction` | リアクション絵文字 | `"👍"`, `"😂"` |
| `comment` | ミーティングチャットのメッセージ | `"資料をチャットに貼りました"` |

**アクセスパターン:**
| パターン | キー条件 |
|----------|----------|
| セッションのイベント一覧取得 | PK = `sessionId`（SK昇順 = 時系列順） |
| セッションの転写のみ取得 | PK = `sessionId`, FilterExpression: `eventType = transcription` |
| セッションのリアクションのみ取得 | PK = `sessionId`, FilterExpression: `eventType = reaction` |
| セッションのコメントのみ取得 | PK = `sessionId`, FilterExpression: `eventType = comment` |

**録画との関連:**
- 録画（`colon-recordings`）からイベントを取得するには、`recallBotId` を使って `colon-bot-sessions` のセッションを検索し、その `sessionId` でイベントを取得する

---

## 4. S3 バケット設計

### 4.1 録画ファイル保存

| 項目 | 内容 |
|------|------|
| バケット名 | `colon-recordings-{account-id}-{region}` |
| キー構造 | `recordings/{userId}/{recordingId}/recording.mp4` |
| 暗号化 | SSE-S3 (AES256) |
| バージョニング | 無効 |
| ライフサイクル | 90日後に Glacier に移行、365日後に削除 |
| CORS | `allowed_origins = ["*"]`（全オリジン許可） |

### 4.2 静的サイトホスティング

| 項目 | 内容 |
|------|------|
| バケット名 | `colon-web-{account-id}-{region}` |
| キー構造 | Next.js Static Export 出力をそのまま配置 |
| 暗号化 | SSE-S3 |
| アクセス | CloudFront OAI 経由のみ |

---

## 5. ID 生成戦略

| エンティティ | ID形式 | 理由 |
|---|---|---|
| userId | Cognito Sub (UUID) | Google OAuth から自動付与 |
| botId | ULID | 時系列ソート可能、衝突耐性 |
| recordingId | ULID | 時系列ソート可能、衝突耐性 |
| sessionId | ULID | 時系列ソート可能、衝突耐性 |
| eventId | ULID | 時系列ソート可能、衝突耐性 |

---

## 6. データ整合性

### 6.1 削除時の一貫性

| 操作 | 設計 | 実装状況 |
|------|------|------|
| ユーザー削除 | Users → Bots → Bot Sessions → Recordings（S3ファイル含む）を順次削除 | ∆ ボットセッション削除・アクティブセッション退出は未実装 |
| ボット削除 | Bots のアイテム削除 + 関連 Bot Sessions 削除 + 関連 Recordings 削除 | ∆ ボットレコードのみ削除、カスケード削除は未実装 |
| 録画削除 | Recordings のアイテム削除 + S3 ファイル削除 | ✓ 実装済み |

### 6.2 非正規化データの更新
- `recordings.botName` はボット名変更時に更新しない（録画時点の名前を保持）
