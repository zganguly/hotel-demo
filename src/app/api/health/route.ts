import { NextResponse } from "next/server";

/** Liveness only — no auth, MongoDB, or external dependencies. */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
