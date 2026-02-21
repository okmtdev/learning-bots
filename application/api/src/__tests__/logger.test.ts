import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "../lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  it("info - outputs structured JSON", () => {
    logger.info("testAction", "test message");
    expect(console.log).toHaveBeenCalledOnce();

    const output = JSON.parse(
      (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]
    );
    expect(output.level).toBe("INFO");
    expect(output.action).toBe("testAction");
    expect(output.message).toBe("test message");
    expect(output.timestamp).toBeDefined();
  });

  it("warn - uses console.warn", () => {
    logger.warn("warnAction", "warning message");
    expect(console.warn).toHaveBeenCalledOnce();

    const output = JSON.parse(
      (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0]
    );
    expect(output.level).toBe("WARN");
  });

  it("error - includes error details", () => {
    const err = new Error("Something broke");
    logger.error("errorAction", "error message", err);
    expect(console.error).toHaveBeenCalledOnce();

    const output = JSON.parse(
      (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
    );
    expect(output.level).toBe("ERROR");
    expect(output.error?.name).toBe("Error");
    expect(output.error?.message).toBe("Something broke");
  });

  it("info - includes metadata", () => {
    logger.info("testAction", "test", {
      requestId: "req-1",
      userId: "user-1",
      metadata: { botId: "bot-1" },
    });

    const output = JSON.parse(
      (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]
    );
    expect(output.requestId).toBe("req-1");
    expect(output.userId).toBe("user-1");
    expect(output.metadata?.botId).toBe("bot-1");
  });
});
