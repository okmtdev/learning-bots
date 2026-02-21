export const APP_NAME = "Colon";
export const APP_DESCRIPTION = "カスタマイズ可能なリアルタイムインタラクティブボットサービス";

export const COGNITO_CONFIG = {
  REGION: process.env.NEXT_PUBLIC_COGNITO_REGION || "ap-northeast-1",
  USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
  CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
  DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "",
  REDIRECT_URI: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI || "http://localhost:3000/auth/callback",
  LOGOUT_URI: process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI || "http://localhost:3000/",
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/v1";

export const TRIGGER_MODE_LABELS = {
  chat_only: { ja: "チャットのみ", en: "Chat only" },
  name_reaction: { ja: "名前に反応", en: "React to name" },
  all_reaction: { ja: "全ての発話に反応", en: "React to all" },
} as const;

export const BOT_STATUS_LABELS = {
  idle: { ja: "待機中", en: "Idle" },
  in_meeting: { ja: "ミーティング参加中", en: "In meeting" },
} as const;

export const RECORDING_STATUS_LABELS = {
  processing: { ja: "処理中", en: "Processing" },
  ready: { ja: "再生可能", en: "Ready" },
  failed: { ja: "失敗", en: "Failed" },
} as const;

export const MAX_BOT_NAME_LENGTH = 50;
export const MAX_INSTRUCTION_LENGTH = 1000;
export const RECORDINGS_PER_PAGE = 10;
