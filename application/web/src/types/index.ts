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
  botId: string;
  botName: string;
  isInteractiveEnabled: boolean;
  isRecordingEnabled: boolean;
  triggerMode?: TriggerMode;
  features?: BotFeatures;
  status: BotStatus;
  currentSession?: BotSession | null;
  createdAt: string;
  updatedAt: string;
}

export interface BotSession {
  sessionId: string;
  meetingUrl: string;
  status: "joining" | "in_meeting" | "leaving" | "ended";
  joinedAt: string;
}

// User types
export interface User {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  language: "ja" | "en";
  createdAt: string;
}

// Recording types
export type RecordingStatus = "processing" | "ready" | "failed";

export interface Recording {
  recordingId: string;
  botId: string;
  botName: string;
  meetingUrl: string;
  durationSeconds?: number;
  fileSizeMb?: number;
  status: RecordingStatus;
  playbackUrl?: string;
  downloadUrl?: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

// Meeting Event types
export type MeetingEventType = "transcription" | "reaction" | "comment";

export interface MeetingEvent {
  sessionId: string;
  eventId: string;
  eventType: MeetingEventType;
  speakerName: string;
  content: string;
  timestamp: string;
  language?: string;
  isFinal?: boolean;
  createdAt: string;
}

// Settings types
export interface Settings {
  language: "ja" | "en";
  email: string;
  displayName: string;
}

// API Error
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
