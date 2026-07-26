"use client";

import { Menu, Bell, HelpCircle, Plus, Search } from "lucide-react";

type AppTopBarProps = {
  businessDate: string;
  propertyName: string;
  breadcrumb: string[];
  onMenuClick?: () => void;
};

export function AppTopBar({
  businessDate,
  propertyName,
  breadcrumb,
  onMenuClick,
}: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        className="rounded-lg p-2 text-text-muted hover:bg-surface-subtle lg:hidden"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="truncate text-xs text-text-muted">
          {breadcrumb.join(" / ")}
        </nav>
        <p className="truncate text-sm font-medium text-text">{propertyName}</p>
      </div>

      <div className="hidden items-center gap-2 rounded-xl border border-border bg-surface-subtle px-3 py-1.5 md:flex">
        <span className="text-[11px] uppercase tracking-wide text-text-muted">
          Business date
        </span>
        <span className="text-sm font-semibold tabular text-primary">{businessDate}</span>
      </div>

      <label className="relative hidden max-w-xs flex-1 md:block">
        <span className="sr-only">Global search</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          placeholder="Search guests, reservations, rooms…"
          className="w-full rounded-[10px] border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
      </label>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
      >
        <Plus className="h-4 w-4" aria-hidden />
        New
      </button>
      <button type="button" className="rounded-lg p-2 text-text-muted hover:bg-surface-subtle" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </button>
      <button type="button" className="rounded-lg p-2 text-text-muted hover:bg-surface-subtle" aria-label="Help">
        <HelpCircle className="h-5 w-5" />
      </button>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
        AD
      </div>
    </header>
  );
}
