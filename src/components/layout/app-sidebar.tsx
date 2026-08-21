"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_GROUPS, appHref } from "@/config/navigation";
import { LogoMark } from "@/components/brand/logo";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

type Badges = Partial<Record<"arrivals" | "roomQueue" | "maintenance" | "approvals", number>>;

type AppSidebarProps = {
  propertySlug: string;
  propertyName: string;
  badges?: Badges;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function AppSidebar({
  propertySlug,
  propertyName,
  badges = {},
  mobileOpen = false,
  onMobileClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem("sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      const routeActive = group.items.some((item) =>
        pathname.startsWith(appHref(propertySlug, item.href)),
      );
      next[group.id] = group.highlighted ? true : routeActive;
    }
    setExpanded((prev) => ({ ...prev, ...next }));
  }, [pathname, propertySlug]);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function onSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-nav-bg text-nav-text transition-[width,transform] duration-200",
          collapsed ? "w-20" : "w-[272px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <LogoMark className="h-10 w-10 shrink-0" />
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Hotel PMS</p>
              <p className="truncate text-xs text-nav-muted">{propertyName}</p>
            </div>
          ) : null}
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = expanded[group.id] ?? false;
            const groupHighlighted = Boolean(group.highlighted);

            if (groupHighlighted && group.items.length === 1) {
              const item = group.items[0];
              const href = appHref(propertySlug, item.href);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <div key={group.id} className="mb-2">
                  <Link
                    href={href}
                    title={collapsed ? group.label : undefined}
                    aria-current={active ? "page" : undefined}
                    onClick={onMobileClose}
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      "bg-gradient-to-r from-[#1D3449] via-[#243f58] to-[#2a4a42] text-nav-text",
                      "ring-1 ring-nav-active-accent/50 shadow-[0_0_0_1px_rgba(214,174,115,0.15)]",
                      active &&
                        "before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-nav-active-accent",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nav-active-accent/20 text-nav-active-accent">
                      <GroupIcon className="h-4 w-4" aria-hidden />
                    </span>
                    {!collapsed ? (
                      <>
                        <span className="flex-1">{group.label}</span>
                        <span className="rounded-full bg-nav-active-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          AI
                        </span>
                      </>
                    ) : null}
                  </Link>
                </div>
              );
            }

            if (groupHighlighted) {
              return (
                <div
                  key={group.id}
                  className="mb-2 rounded-xl bg-gradient-to-r from-[#1D3449] via-[#243f58] to-[#2a4a42] p-1.5 ring-1 ring-nav-active-accent/40"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    title={collapsed ? group.label : undefined}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold text-nav-text"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                    }
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nav-active-accent/20 text-nav-active-accent">
                      <GroupIcon className="h-4 w-4" aria-hidden />
                    </span>
                    {!collapsed ? (
                      <>
                        <span className="flex-1">{group.label}</span>
                        <span className="rounded-full bg-nav-active-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          AI
                        </span>
                        <ChevronDown
                          className={cn("h-4 w-4 transition", isOpen && "rotate-180")}
                          aria-hidden
                        />
                      </>
                    ) : null}
                  </button>
                  {isOpen && !collapsed ? (
                    <ul className="mt-1 space-y-0.5 px-1 pb-1">
                      {group.items.map((item) => {
                        const href = appHref(propertySlug, item.href);
                        const active = pathname === href || pathname.startsWith(`${href}/`);
                        const ItemIcon = item.icon;
                        return (
                          <li key={item.href}>
                            <Link
                              href={href}
                              aria-current={active ? "page" : undefined}
                              onClick={onMobileClose}
                              className={cn(
                                "relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                                active
                                  ? "bg-nav-active-accent/20 text-nav-text"
                                  : "text-nav-muted hover:bg-white/5 hover:text-nav-text",
                              )}
                            >
                              {ItemIcon ? <ItemIcon className="h-4 w-4 shrink-0" aria-hidden /> : null}
                              <span>{item.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            }

            return (
              <div key={group.id} className="mb-1">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  title={collapsed ? group.label : undefined}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-nav-muted hover:bg-nav-surface hover:text-nav-text"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                  }
                >
                  <GroupIcon className="h-5 w-5 shrink-0" aria-hidden />
                  {!collapsed ? (
                    <>
                      <span className="flex-1 font-medium">{group.label}</span>
                      <ChevronDown
                        className={cn("h-4 w-4 transition", isOpen && "rotate-180")}
                        aria-hidden
                      />
                    </>
                  ) : null}
                </button>
                {isOpen && !collapsed ? (
                  <ul className="mt-1 space-y-0.5 pl-2">
                    {group.items.map((item) => {
                      const href = appHref(propertySlug, item.href);
                      const active = pathname === href || pathname.startsWith(`${href}/`);
                      const count = item.badgeKey ? badges[item.badgeKey] : undefined;
                      return (
                        <li key={item.href}>
                          <Link
                            href={href}
                            aria-current={active ? "page" : undefined}
                            onClick={onMobileClose}
                            className={cn(
                              "relative flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                              active
                                ? "bg-nav-active-bg text-nav-text before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-nav-active-accent"
                                : "text-nav-muted hover:bg-nav-surface hover:text-nav-text",
                            )}
                          >
                            <span>{item.label}</span>
                            {count && count > 0 ? (
                              <span className="rounded-full bg-teal px-2 py-0.5 text-[11px] font-semibold text-white tabular">
                                {count}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-nav-muted hover:bg-nav-surface hover:text-nav-text lg:flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden />
            )}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-nav-muted hover:bg-nav-surface hover:text-nav-text"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            {!collapsed ? <span>Sign out</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}
