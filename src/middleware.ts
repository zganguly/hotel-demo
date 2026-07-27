import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const DEFAULT_APP_HOME = "/app/harbour-view/dashboard";

function safeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (!value.startsWith("/app/")) return null;
  return value;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (pathname.startsWith("/app/")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (sessionCookie) {
      const callback = safeCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));
      return NextResponse.redirect(new URL(callback ?? DEFAULT_APP_HOME, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
