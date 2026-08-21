import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { fail, ok, ERROR_CODES } from "@/lib/errors";
import { getSessionCookie } from "better-auth/cookies";
import { AiConversationLogModel } from "@/modules/ai/ai-conversation-log.model";
import { runChatCompletion, type AiProvider } from "@/modules/ai/chat.service";

export const runtime = "nodejs";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(12000),
});

const BodySchema = z.object({
  propertySlug: z.string().trim().min(1),
  conversationId: z.string().uuid().optional(),
  provider: z.enum(["OPENAI", "OPENROUTER"]),
  message: z.string().trim().min(1).max(8000),
  history: z.array(MessageSchema).max(40).default([]),
});

export async function POST(request: NextRequest) {
  try {
    if (!getSessionCookie(request)) {
      return NextResponse.json(fail(ERROR_CODES.UNAUTHENTICATED, "Sign in required"), {
        status: 401,
      });
    }

    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "Invalid chat request", parsed.error.flatten()),
        { status: 400 },
      );
    }

    const { propertySlug, provider, message, history } = parsed.data;
    const conversationId = parsed.data.conversationId ?? randomUUID();

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a helpful hotel property-management assistant. Answer clearly in plain, human-readable language. Use short paragraphs and bullet lists when useful.",
      },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user" as const, content: message },
    ];

    await connectDb();

    try {
      const result = await runChatCompletion({
        provider: provider as AiProvider,
        messages,
      });

      const log = await AiConversationLogModel.create({
        publicId: randomUUID(),
        conversationId,
        propertySlug,
        provider,
        model: result.model,
        requestText: message,
        responseText: result.content,
        requestTokens: result.requestTokens,
        responseTokens: result.responseTokens,
        totalTokens: result.totalTokens,
        status: "SUCCESS",
        createdAt: new Date(),
      });

      return NextResponse.json(
        ok({
          conversationId,
          provider,
          model: result.model,
          reply: result.content,
          usage: {
            requestTokens: result.requestTokens,
            responseTokens: result.responseTokens,
            totalTokens: result.totalTokens,
          },
          logId: log.publicId,
          createdAt: log.createdAt,
        }),
      );
    } catch (providerError) {
      const errMessage =
        providerError instanceof Error ? providerError.message : "Provider request failed";

      await AiConversationLogModel.create({
        publicId: randomUUID(),
        conversationId,
        propertySlug,
        provider,
        model:
          provider === "OPENAI"
            ? process.env.OPENAI_MODEL || "gpt-4o-mini"
            : process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        requestText: message,
        responseText: "",
        requestTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
        status: "ERROR",
        errorMessage: errMessage,
        createdAt: new Date(),
      });

      return NextResponse.json(fail(ERROR_CODES.INTERNAL, errMessage), { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected chat error";
    return NextResponse.json(fail(ERROR_CODES.INTERNAL, message), { status: 500 });
  }
}
