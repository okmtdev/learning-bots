// Bot types
export interface BotFeature {
  enabled: boolean;
  instruction: string;
}

export interface BotFeatures {
  reaction: BotFeature;
  chat: BotFeature;
  voice: BotFeature;
}

export type TriggerMode = "chat_only" | "name_reaction" | "all_reaction";
export type BotStatus = "idle" | "in_meeting";

export interface Bot {
  userId: string;
  botId: string;
  botName: string;
  isInteractiveEnabled: boolean;
  isRecordingEnabled: boolean;
  triggerMode?: TriggerMode;
  features?: BotFeatures;
  status: BotStatus;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  language: "ja" | "en";
  createdAt: string;
  updatedAt: string;
}

// Recording types
export type RecordingStatus = "processing" | "ready" | "failed";

export interface Recording {
  userId: string;
  recordingId: string;
  botId: string;
  botName: string;
  meetingUrl: string;
  s3Key: string;
  fileSizeMb?: number;
  durationSeconds?: number;
  recallBotId: string;
  status: RecordingStatus;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

// Bot Session types
export type SessionStatus = "joining" | "in_meeting" | "leaving" | "ended";

export interface BotSession {
  botId: string;
  sessionId: string;
  userId: string;
  meetingUrl: string;
  recallBotId: string;
  status: SessionStatus;
  joinedAt: string;
  leftAt?: string;
  createdAt: string;
  ttl?: number;
}

// API Response types
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
