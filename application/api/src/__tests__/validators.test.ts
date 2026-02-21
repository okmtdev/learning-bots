import { describe, it, expect } from "vitest";
import {
  createBotSchema,
  inviteBotSchema,
  updateSettingsSchema,
} from "../lib/validators";

describe("createBotSchema", () => {
  it("should validate a valid bot with interactive disabled", () => {
    const result = createBotSchema.safeParse({
      botName: "Test Bot",
      isInteractiveEnabled: false,
      isRecordingEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("should validate a valid bot with interactive enabled and triggerMode", () => {
    const result = createBotSchema.safeParse({
      botName: "Test Bot",
      isInteractiveEnabled: true,
      isRecordingEnabled: true,
      triggerMode: "chat_only",
      features: {
        reaction: { enabled: true, instruction: "React!" },
        chat: { enabled: true, instruction: "Chat!" },
        voice: { enabled: false, instruction: "" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject when interactive is enabled but triggerMode is missing", () => {
    const result = createBotSchema.safeParse({
      botName: "Test Bot",
      isInteractiveEnabled: true,
      isRecordingEnabled: true,
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty botName", () => {
    const result = createBotSchema.safeParse({
      botName: "",
      isInteractiveEnabled: false,
      isRecordingEnabled: true,
    });
    expect(result.success).toBe(false);
  });

  it("should reject botName longer than 50 chars", () => {
    const result = createBotSchema.safeParse({
      botName: "a".repeat(51),
      isInteractiveEnabled: false,
      isRecordingEnabled: true,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid triggerMode", () => {
    const result = createBotSchema.safeParse({
      botName: "Test Bot",
      isInteractiveEnabled: true,
      isRecordingEnabled: true,
      triggerMode: "invalid_mode",
    });
    expect(result.success).toBe(false);
  });

  it("should reject instruction longer than 1000 chars", () => {
    const result = createBotSchema.safeParse({
      botName: "Test Bot",
      isInteractiveEnabled: true,
      isRecordingEnabled: true,
      triggerMode: "chat_only",
      features: {
        reaction: { enabled: true, instruction: "a".repeat(1001) },
        chat: { enabled: false, instruction: "" },
        voice: { enabled: false, instruction: "" },
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("inviteBotSchema", () => {
  it("should validate a valid Google Meet URL", () => {
    const result = inviteBotSchema.safeParse({
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-Google Meet URL", () => {
    const result = inviteBotSchema.safeParse({
      meetingUrl: "https://zoom.us/j/123456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid URL", () => {
    const result = inviteBotSchema.safeParse({
      meetingUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty string", () => {
    const result = inviteBotSchema.safeParse({
      meetingUrl: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSettingsSchema", () => {
  it("should validate 'ja'", () => {
    const result = updateSettingsSchema.safeParse({ language: "ja" });
    expect(result.success).toBe(true);
  });

  it("should validate 'en'", () => {
    const result = updateSettingsSchema.safeParse({ language: "en" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid language", () => {
    const result = updateSettingsSchema.safeParse({ language: "fr" });
    expect(result.success).toBe(false);
  });
});
