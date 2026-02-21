type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  requestId?: string;
  userId?: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export const logger = {
  info(
    action: string,
    message: string,
    meta?: { requestId?: string; userId?: string; metadata?: Record<string, unknown> }
  ) {
    console.log(
      formatLog({
        level: "INFO",
        timestamp: new Date().toISOString(),
        action,
        message,
        ...meta,
      })
    );
  },

  warn(
    action: string,
    message: string,
    meta?: { requestId?: string; userId?: string; metadata?: Record<string, unknown> }
  ) {
    console.warn(
      formatLog({
        level: "WARN",
        timestamp: new Date().toISOString(),
        action,
        message,
        ...meta,
      })
    );
  },

  error(
    action: string,
    message: string,
    err?: Error,
    meta?: { requestId?: string; userId?: string; metadata?: Record<string, unknown> }
  ) {
    console.error(
      formatLog({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        action,
        message,
        error: err
          ? { name: err.name, message: err.message, stack: err.stack }
          : undefined,
        ...meta,
      })
    );
  },

  debug(
    action: string,
    message: string,
    meta?: { requestId?: string; userId?: string; metadata?: Record<string, unknown> }
  ) {
    if (process.env.LOG_LEVEL === "DEBUG") {
      console.debug(
        formatLog({
          level: "DEBUG",
          timestamp: new Date().toISOString(),
          action,
          message,
          ...meta,
        })
      );
    }
  },
};
