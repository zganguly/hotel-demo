import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { connectDb } from "@/lib/db";
import { fail, ok, ERROR_CODES } from "@/lib/errors";
import { AiConversationLogModel } from "@/modules/ai/ai-conversation-log.model";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (!getSessionCookie(request)) {
      return NextResponse.json(fail(ERROR_CODES.UNAUTHENTICATED, "Sign in required"), {
        status: 401,
      });
    }

    const propertySlug = request.nextUrl.searchParams.get("propertySlug")?.trim();
    if (!propertySlug) {
      return NextResponse.json(fail(ERROR_CODES.VALIDATION, "propertySlug is required"), {
        status: 400,
      });
    }

    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

    await connectDb();
    const logs = await AiConversationLogModel.find({ propertySlug })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      ok({
        logs: logs.map((log) => ({
          publicId: log.publicId,
          conversationId: log.conversationId,
          provider: log.provider,
          model: log.model,
          requestText: log.requestText,
          responseText: log.responseText,
          requestTokens: log.requestTokens,
          responseTokens: log.responseTokens,
          totalTokens: log.totalTokens,
          status: log.status,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
        })),
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load AI logs";
    return NextResponse.json(fail(ERROR_CODES.INTERNAL, message), { status: 500 });
  }
}
