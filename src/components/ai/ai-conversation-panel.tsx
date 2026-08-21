"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Provider = "OPENAI" | "OPENROUTER";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: Provider;
  model?: string;
  usage?: {
    requestTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  createdAt?: string;
};

function formatReadable(text: string) {
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, index) => {
    const lines = block.split("\n");
    const isList = lines.every((line) => !line.trim() || /^[-*•]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim()));
    if (isList) {
      return (
        <ul key={index} className="my-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text">
          {lines
            .map((line) => line.trim().replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, ""))
            .filter(Boolean)
            .map((line, i) => (
              <li key={i}>{line}</li>
            ))}
        </ul>
      );
    }
    return (
      <p key={index} className="my-2 whitespace-pre-wrap text-sm leading-relaxed text-text">
        {block}
      </p>
    );
  });
}

export function AiConversationPanel({ propertySlug }: { propertySlug: string }) {
  const [provider, setProvider] = useState<Provider>("OPENAI");
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const history = useMemo(
    () => turns.map((turn) => ({ role: turn.role, content: turn.content })),
    [turns],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, pending]);

  async function onSend(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || pending) return;

    setError(null);
    setPending(true);
    setInput("");
    const userTurn: ChatTurn = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setTurns((prev) => [...prev, userTurn]);

    try {
      const response = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertySlug,
          conversationId,
          provider,
          message,
          history,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error?.message || "Chat request failed");
      }

      setConversationId(payload.data.conversationId);
      setTurns((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.data.reply,
          provider: payload.data.provider,
          model: payload.data.model,
          usage: payload.data.usage,
          createdAt: payload.data.createdAt,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to get a response");
    } finally {
      setPending(false);
    }
  }

  function onNewConversation() {
    setConversationId(undefined);
    setTurns([]);
    setError(null);
    setInput("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-[18px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Provider</p>
        <div className="mt-3 space-y-2">
          {(
            [
              { id: "OPENAI", label: "OpenAI", hint: "OPENAI_API_KEY / OPENAI_MODEL" },
              { id: "OPENROUTER", label: "OpenRouter", hint: "OPENROUTER_API_KEY / OPENROUTER_MODEL" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setProvider(option.id)}
              className={cn(
                "w-full rounded-xl border px-3 py-3 text-left transition",
                provider === option.id
                  ? "border-primary bg-primary/5 ring-2 ring-focus"
                  : "border-border bg-background hover:border-primary/30",
              )}
            >
              <span className="block text-sm font-semibold text-text">{option.label}</span>
              <span className="mt-0.5 block text-[11px] text-text-muted">{option.hint}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNewConversation}
          className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-text hover:bg-surface-subtle"
        >
          New conversation
        </button>

        <p className="mt-4 text-xs leading-relaxed text-text-muted">
          Each turn is logged with request tokens, response tokens, total tokens, and datetime under{" "}
          <span className="font-semibold text-text">AI Logs</span>.
        </p>
      </aside>

      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-text">AI Conversation</h2>
            <p className="text-sm text-text-muted">
              Ask follow-ups in the same thread · {provider === "OPENAI" ? "OpenAI" : "OpenRouter"}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {turns.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-border bg-surface-subtle/50 px-5 py-10 text-center">
              <Bot className="mx-auto h-8 w-8 text-primary" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-text">Start a conversation</p>
              <p className="mt-1 text-sm text-text-muted">
                Ask about occupancy, rates, arrivals, or operational guidance.
              </p>
            </div>
          ) : null}

          {turns.map((turn) => (
            <div
              key={turn.id}
              className={cn(
                "flex gap-3",
                turn.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {turn.role === "assistant" ? (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal">
                  <Bot className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  turn.role === "user"
                    ? "bg-primary text-white"
                    : "border border-border bg-background",
                )}
              >
                {turn.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.content}</p>
                ) : (
                  <div>{formatReadable(turn.content)}</div>
                )}
                {turn.role === "assistant" && turn.usage ? (
                  <p className="mt-2 border-t border-border pt-2 text-[11px] text-text-muted">
                    {turn.model} · req {turn.usage.requestTokens} · resp {turn.usage.responseTokens} ·
                    total {turn.usage.totalTokens}
                  </p>
                ) : null}
              </div>
              {turn.role === "user" ? (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <UserRound className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
            </div>
          ))}

          {pending ? (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Thinking…
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={onSend} className="border-t border-border p-4 sm:p-5">
          {error ? (
            <p role="alert" className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Ask the hotel AI assistant…"
              className="min-h-[52px] flex-1 resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm text-text outline-none focus:ring-2 focus:ring-focus"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="inline-flex h-[52px] items-center gap-2 self-end rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
