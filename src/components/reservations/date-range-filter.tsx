"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarRange, RotateCcw, Search } from "lucide-react";

type DateRangeFilterProps = {
  from: string;
  to: string;
  defaults?: { from: string; to: string };
  className?: string;
};

export function DateRangeFilter({
  from,
  to,
  defaults,
  className,
}: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextFrom) params.set("from", nextFrom);
    else params.delete("from");
    if (nextTo) params.set("to", nextTo);
    else params.delete("to");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextFrom = String(form.get("from") ?? "");
    const nextTo = String(form.get("to") ?? "");
    apply(nextFrom, nextTo);
  }

  function reset() {
    if (defaults) {
      apply(defaults.from, defaults.to);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        className ??
        "flex flex-col gap-3 rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row sm:flex-wrap sm:items-end"
      }
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
        <CalendarRange className="h-4 w-4" aria-hidden />
      </div>

      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-md">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            From
          </span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-focus"
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            To
          </span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-focus"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-70"
        >
          <Search className="h-4 w-4" aria-hidden />
          {pending ? "Searching…" : "Search stays"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-border bg-background px-4 text-sm font-semibold text-text transition hover:bg-surface-subtle disabled:opacity-70"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </button>
      </div>
    </form>
  );
}
