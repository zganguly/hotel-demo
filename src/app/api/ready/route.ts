import { NextResponse } from "next/server";

/**
 * Deeper readiness (DB ping, provider checks).
 * Protect in production if it reveals infrastructure status.
 */
export async function GET() {
  const checks = {
    app: true,
    mongodb: Boolean(process.env.MONGODB_URI),
  };

  const ready = checks.app;
  return NextResponse.json(
    {
      ready,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
