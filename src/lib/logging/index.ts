type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE = /password|secret|token|authorization|card|cvv|document/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = SENSITIVE.test(key) ? "[REDACTED]" : redact(nested);
    }
    return out;
  }
  return value;
}

function write(level: LogLevel, message: string, fields?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    service: "hotel-pms",
    ...(fields ? (redact(fields) as Record<string, unknown>) : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => write("debug", message, fields),
  info: (message: string, fields?: Record<string, unknown>) => write("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => write("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => write("error", message, fields),
};
