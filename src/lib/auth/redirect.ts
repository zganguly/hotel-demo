export const DEFAULT_APP_HOME = "/app/harbour-view/dashboard";

export function safeCallbackUrl(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (!value.startsWith("/app/")) return null;
  return value;
}

export function resolvePostLoginPath(
  callbackUrl: string | null | undefined,
  propertySlug = "harbour-view",
) {
  return safeCallbackUrl(callbackUrl) ?? `/app/${propertySlug}/dashboard`;
}
