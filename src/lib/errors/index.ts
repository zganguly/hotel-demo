export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return meta ? { ok: true, data, meta } : { ok: true, data };
}

export function fail(
  code: string,
  message: string,
  details?: unknown,
): ApiFailure {
  return {
    ok: false,
    error: { code, message, details },
  };
}

export const ERROR_CODES = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  REQUIRES_APPROVAL: "REQUIRES_APPROVAL",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL",
} as const;
