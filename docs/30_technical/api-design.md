# API 設計書

## 1. 概要

Colon（コロン）のバックエンド REST API 仕様を定義する。

### 基本情報

| 項目 | 内容 |
|------|------|
| ベースURL | `https://api.colon.example.com/v1` |
| プロトコル | HTTPS (TLS 1.2+) |
| 認証 | Bearer Token (Cognito JWT) |
| コンテンツタイプ | `application/json` |
| 文字コード | UTF-8 |

### 共通ヘッダー

```
Authorization: Bearer {id_token}
Content-Type: application/json
Accept-Language: ja  (or en)
```

### 共通エラーレスポンス

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

| HTTP ステータス | エラーコード | 説明 |
|----------------|-------------|------|
| 400 | `BAD_REQUEST` | リクエスト不正 |
| 401 | `UNAUTHORIZED` | 認証エラー |
| 403 | `FORBIDDEN` | 権限なし |
| 404 | `NOT_FOUND` | リソース未存在 |
| 409 | `CONFLICT` | 競合（ボットが既にミーティング参加中など） |
| 422 | `VALIDATION_ERROR` | バリデーションエラー |
| 429 | `RATE_LIMIT` | レートリミット超過 |
| 500 | `INTERNAL_ERROR` | サーバーエラー |

---

## 2. 認証 API

### 2.1. 現在のユーザー情報を取得

Cognito のトークンからユーザー情報を取得・初回アクセス時は自動作成。

```
GET /auth/me
```

**レスポンス: 200 OK**

```json
{
  "userId": "google-oauth2|123456789",
  "email": "taro@gmail.com",
  "displayName": "山田 太郎",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "language": "ja",
  "createdAt": "2026-02-21T10:00:00Z"
}
```

---

## 3. ボット API

### 3.1. ボット一覧取得

```
GET /bots
```

**レスポンス: 200 OK**

```json
{
  "bots": [
    {
      "botId": "01JMXXXXXXXXXXXXXXXX",
      "botName": "要約くん",
      "isInteractiveEnabled": true,
      "isRecordingEnabled": true,
      "status": "idle",
      "createdAt": "2026-02-20T10:00:00Z",
      "updatedAt": "2026-02-20T10:00:00Z"
    }
  ]
}
```

---

### 3.2. ボット詳細取得

```
GET /bots/{botId}
```

**パスパラメータ:**
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `botId` | String | ボットID |

**レスポンス: 200 OK**

```json
{
  "botId": "01JMXXXXXXXXXXXXXXXX",
  "botName": "要約くん",
  "isInteractiveEnabled": true,
  "isRecordingEnabled": true,
  "triggerMode": "chat_only",
  "features": {
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
  },
  "status": "idle",
  "currentSession": null,
  "createdAt": "2026-02-20T10:00:00Z",
  "updatedAt": "2026-02-20T10:00:00Z"
}
```

---

### 3.3. ボット作成

```
POST /bots
```

**リクエストボディ:**

```json
{
  "botName": "要約くん",
  "isInteractiveEnabled": true,
  "isRecordingEnabled": true,
  "triggerMode": "chat_only",
  "features": {
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
}
```

**バリデーション:**

| フィールド | ルール |
|-----------|--------|
| `botName` | 必須、1〜50文字 |
| `isInteractiveEnabled` | 必須、Boolean |
| `isRecordingEnabled` | 必須、Boolean |
| `triggerMode` | `isInteractiveEnabled=true` の場合必須。`chat_only` / `name_reaction` / `all_reaction` |
| `features.*.instruction` | 最大1000文字 |

**レスポンス: 201 Created**

```json
{
  "botId": "01JMXXXXXXXXXXXXXXXX",
  "botName": "要約くん",
  "isInteractiveEnabled": true,
  "isRecordingEnabled": true,
  "triggerMode": "chat_only",
  "features": { ... },
  "status": "idle",
  "createdAt": "2026-02-20T10:00:00Z",
  "updatedAt": "2026-02-20T10:00:00Z"
}
```

---

### 3.4. ボット更新

```
PUT /bots/{botId}
```

**リクエストボディ:** ボット作成と同じ構造（全フィールド必須、部分更新は不可）

**レスポンス: 200 OK** ボット詳細と同じ構造

---

### 3.5. ボット削除

```
DELETE /bots/{botId}
```

**レスポンス: 204 No Content**

**注意:** ボットが `in_meeting` ステータスの場合、先にミーティングから退出させる必要がある（409 CONFLICT を返す）。

> **未実装**: カスケード削除（関連するセッション・録画の削除）は未実装。ボットレコードのみ削除される。

---

## 4. ボット招待 API

### 4.1. ミーティングに招待

```
POST /bots/{botId}/invite
```

**リクエストボディ:**

```json
{
  "meetingUrl": "https://meet.google.com/abc-defg-hij"
}
```

**バリデーション:**

| フィールド | ルール |
|-----------|--------|
| `meetingUrl` | 必須、`https://meet.google.com/` で始まる有効なURL |

**レスポンス: 200 OK**

```json
{
  "sessionId": "01JMXXXXXXXXXXXXXXXX",
  "botId": "01JMXXXXXXXXXXXXXXXX",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "status": "joining",
  "joinedAt": "2026-02-21T14:00:00Z"
}
```

**エラーケース:**
- 409: ボットが既にミーティングに参加中
- 422: 無効な Google Meet URL

> **注意**: 現在の実装では、Recall.ai API に `meeting_url`, `bot_name`, `recording_mode` のみ送信。ボットのインタラクティブ機能設定（`features`, `triggerMode`）は Recall.ai に送信されていない。

---

### 4.2. ミーティングから退出

```
POST /bots/{botId}/leave
```

**レスポンス: 200 OK**

```json
{
  "sessionId": "01JMXXXXXXXXXXXXXXXX",
  "status": "leaving"
}
```

---

### 4.3. 現在のセッション取得

```
GET /bots/{botId}/session
```

**レスポンス: 200 OK**（参加中の場合）

```json
{
  "sessionId": "01JMXXXXXXXXXXXXXXXX",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "status": "in_meeting",
  "joinedAt": "2026-02-21T14:00:00Z"
}
```

**レスポンス: 200 OK**（参加していない場合）

```json
{
  "session": null
}
```

---

## 5. 録画 API

### 5.1. 録画一覧取得

```
GET /recordings
```

**クエリパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `botId` | String | ❌ | ボットIDでフィルター |
| `startDate` | String | ❌ | 開始日 (YYYY-MM-DD)　※ 未実装 |
| `endDate` | String | ❌ | 終了日 (YYYY-MM-DD)　※ 未実装 |
| `limit` | Number | ❌ | 取得件数（デフォルト: 10、最大: 50） |
| `nextToken` | String | ❌ | ページネーショントークン |

**レスポンス: 200 OK**

```json
{
  "recordings": [
    {
      "recordingId": "01JMXXXXXXXXXXXXXXXX",
      "botId": "01JMXXXXXXXXXXXXXXXX",
      "botName": "要約くん",
      "meetingUrl": "https://meet.google.com/abc-defg-hij",
      "durationSeconds": 3600,
      "fileSizeMb": 120,
      "status": "ready",
      "startedAt": "2026-02-21T14:00:00Z",
      "endedAt": "2026-02-21T15:00:00Z",
      "createdAt": "2026-02-21T15:01:00Z"
    }
  ],
  "nextToken": "eyJsYXN0..."
}
```

---

### 5.2. 録画詳細取得

```
GET /recordings/{recordingId}
```

**レスポンス: 200 OK**

```json
{
  "recordingId": "01JMXXXXXXXXXXXXXXXX",
  "botId": "01JMXXXXXXXXXXXXXXXX",
  "botName": "要約くん",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "playbackUrl": "https://d1234.cloudfront.net/recordings/...?Signature=...",
  "downloadUrl": "https://d1234.cloudfront.net/recordings/...?Signature=...&response-content-disposition=attachment",
  "durationSeconds": 3600,
  "fileSizeMb": 120,
  "status": "ready",
  "startedAt": "2026-02-21T14:00:00Z",
  "endedAt": "2026-02-21T15:00:00Z",
  "createdAt": "2026-02-21T15:01:00Z"
}
```

**注意:** `playbackUrl` と `downloadUrl` は CloudFront 署名付きURL（有効期限: 1時間）。

---

### 5.3. 録画削除

```
DELETE /recordings/{recordingId}
```

**レスポンス: 204 No Content**

S3上の録画ファイルも同時に削除する。

---

## 6. ユーザー設定 API

### 6.1. 設定取得

```
GET /settings
```

**レスポンス: 200 OK**

```json
{
  "language": "ja",
  "email": "taro@gmail.com",
  "displayName": "山田 太郎"
}
```

---

### 6.2. 設定更新

```
PUT /settings
```

**リクエストボディ:**

```json
{
  "language": "en"
}
```

**バリデーション:**

| フィールド | ルール |
|-----------|--------|
| `language` | `ja` or `en` |

**レスポンス: 200 OK**

```json
{
  "language": "en",
  "email": "taro@gmail.com",
  "displayName": "山田 太郎"
}
```

---

### 6.3. アカウント削除

```
DELETE /settings/account
```

**レスポンス: 204 No Content**

以下を順次実行:
1. すべての録画ファイル（S3）を削除
2. すべてのDynamoDBレコード（録画、ボット）を削除
3. ユーザーレコードを削除
4. Cognito ユーザーを削除

> **注意**: 現在の実装では、削除前にアクティブなボットセッションを確認・退出させる処理は未実装。また、ボットセッションテーブルのレコード削除も未実装。

---

## 7. Webhook API（内部）

### 7.1. Recall.ai Webhook

Recall.ai からのイベント通知を受信する。API Gateway に直接ルーティングされ、Cognito認証は**不要**（Svix 署名で検証）。

```
POST /webhooks/recall
```

**ヘッダー:**
```
svix-id: {message_id}
svix-timestamp: {unix_timestamp}
svix-signature: {signature}
```

**対応イベント:**
| イベント | 説明 |
|--------|------|
| `bot.done` | ボット完了（録画データ取得・保存処理） |
| `bot.call_ended` | ミーティング終了 |
| `bot.fatal` | ボットエラー |
| `bot.in_call_recording` | 録画中ステータス更新 |

**リクエストボディ:** Recall.ai のWebhookペイロード仕様に準拠

**処理内容（`bot.done` イベント時）:**
1. Svix 署名の検証
2. 録画データを Recall.ai API から取得
3. S3 に録画ファイルをアップロード
4. DynamoDB に録画メタデータを保存
5. ボットステータスを `idle` に更新

> **注意**: 現在の実装では、ステップ3、4、5は未完成。動画ダウンロードまでは実行されるが、S3アップロード・メタデータ保存・ステータス更新は未実装。

**レスポンス: 200 OK**

```json
{
  "received": true
}
```

---

## 8. レートリミット

| エンドポイント | 制限 |
|---------------|------|
| 全体 | 100リクエスト/分/ユーザー |
| `POST /bots/{botId}/invite` | 10リクエスト/分/ユーザー |
| `POST /bots` | 10リクエスト/分/ユーザー |

API Gateway のスロットリング機能で実装。

---

## 9. API バージョニング

- URLパスにバージョンを含める（`/v1/...`）
- 破壊的変更時は `/v2/` を新設し、旧バージョンは最低6ヶ月間維持
