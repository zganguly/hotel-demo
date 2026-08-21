"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/feedback/status-badge";
import { cn } from "@/lib/utils";

type AiLog = {
  publicId: string;
  conversationId: string;
  provider: "OPENAI" | "OPENROUTER";
  model: string;
  requestText: string;
  responseText: string;
  requestTokens: number;
  responseTokens: number;
  totalTokens: number;
  status: "SUCCESS" | "ERROR";
  errorMessage?: string;
  createdAt: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export function AiLogsPanel({ propertySlug }: { propertySlug: string }) {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/ai/logs?propertySlug=${encodeURIComponent(propertySlug)}&limit=100`);
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error?.message || "Failed to load logs");
      }
      setLogs(payload.data.logs);
      setSelectedId((current) => current ?? payload.data.logs[0]?.publicId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [propertySlug]);

  const selected = useMemo(
    () => logs.find((log) => log.publicId === selectedId) ?? null,
    [logs, selectedId],
  );

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc.request += log.requestTokens;
        acc.response += log.responseTokens;
        acc.total += log.totalTokens;
        return acc;
      },
      { request: 0, response: 0, total: 0 },
    );
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Request tokens</p>
          <p className="mt-1 text-2xl font-bold tabular text-text">{totals.request}</p>
        </div>
        <div className="rounded-[16px] border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Response tokens</p>
          <p className="mt-1 text-2xl font-bold tabular text-text">{totals.response}</p>
        </div>
        <div className="rounded-[16px] border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Total tokens</p>
          <p className="mt-1 text-2xl font-bold tabular text-primary">{totals.total}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{logs.length} logged turns</p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text hover:bg-surface-subtle"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
          Refresh
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {loading && logs.length === 0 ? (
        <div className="flex items-center gap-2 rounded-[16px] border border-border bg-surface px-4 py-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading AI logs…
        </div>
      ) : null}

      {!loading && logs.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          No AI conversation logs yet. Send a message from AI Conversation.
        </div>
      ) : null}

      {logs.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <ul className="max-h-[70vh] space-y-2 overflow-y-auto rounded-[16px] border border-border bg-surface p-3 shadow-[var(--shadow-card)]">
            {logs.map((log) => (
              <li key={log.publicId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(log.publicId)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition",
                    selectedId === log.publicId
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge
                      label={log.provider}
                      tone={log.provider === "OPENAI" ? "info" : "premium"}
                    />
                    <StatusBadge
                      label={log.status}
                      tone={log.status === "SUCCESS" ? "success" : "danger"}
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-text">{log.requestText}</p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {formatDateTime(log.createdAt)} · total {log.totalTokens}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <article className="rounded-[16px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={selected.provider} tone="info" />
                <StatusBadge
                  label={selected.status}
                  tone={selected.status === "SUCCESS" ? "success" : "danger"}
                />
                <span className="text-xs text-text-muted">{selected.model}</span>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Date / time
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-text">
                    {formatDateTime(selected.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Request tokens
                  </dt>
                  <dd className="mt-1 text-sm font-semibold tabular text-text">
                    {selected.requestTokens}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Response tokens
                  </dt>
                  <dd className="mt-1 text-sm font-semibold tabular text-text">
                    {selected.responseTokens}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Total tokens
                  </dt>
                  <dd className="mt-1 text-sm font-semibold tabular text-primary">
                    {selected.totalTokens}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 space-y-4">
                <section>
                  <h3 className="text-sm font-semibold text-text">Request</h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-text">
                    {selected.requestText}
                  </p>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-text">Response</h3>
                  {selected.status === "ERROR" ? (
                    <p className="mt-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                      {selected.errorMessage || "Provider error"}
                    </p>
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-text">
                      {selected.responseText}
                    </p>
                  )}
                </section>
                <p className="text-xs text-text-muted">
                  Conversation ID: <span className="font-mono">{selected.conversationId}</span>
                </p>
              </div>
            </article>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
