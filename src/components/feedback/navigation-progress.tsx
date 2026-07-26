"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/feedback/page-loader";
import { cn } from "@/lib/utils";

/**
 * Global route-change indicator:
 * - champagne progress bar immediately on navigation
 * - branded full-screen loader if the route takes longer than a beat
 *
 * Route `loading.tsx` files provide the same branded fallback for RSC suspense.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlKey = `${pathname}?${searchParams.toString()}`;
  const previousUrl = useRef(urlKey);

  const clearTimers = useCallback(() => {
    if (tickTimer.current) clearInterval(tickTimer.current);
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    tickTimer.current = null;
    overlayTimer.current = null;
    safetyTimer.current = null;
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setProgress(100);
    window.setTimeout(() => {
      setActive(false);
      setShowOverlay(false);
      setProgress(0);
    }, 220);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    setActive(true);
    setShowOverlay(false);
    setProgress(12);
    tickTimer.current = setInterval(() => {
      setProgress((value) => {
        if (value >= 88) return value;
        return value + Math.max(1.5, (90 - value) * 0.08);
      });
    }, 180);
    // Show the branded loader if navigation is still pending shortly after click.
    overlayTimer.current = setTimeout(() => setShowOverlay(true), 180);
    safetyTimer.current = setTimeout(() => finish(), 12000);
  }, [clearTimers, finish]);

  useEffect(() => {
    if (previousUrl.current !== urlKey) {
      previousUrl.current = urlKey;
      if (active) finish();
    }
  }, [urlKey, active, finish]);

  useEffect(() => {
    function isInternalNav(anchor: HTMLAnchorElement) {
      if (anchor.target && anchor.target !== "_self") return false;
      if (anchor.hasAttribute("download")) return false;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return false;
      }
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return false;
        const nextKey = `${url.pathname}?${url.searchParams.toString()}`;
        const currentKey = `${window.location.pathname}?${window.location.search.slice(1)}`;
        return nextKey !== currentKey;
      } catch {
        return false;
      }
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor || !isInternalNav(anchor)) return;
      start();
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, [start, clearTimers]);

  if (!active) return null;

  return (
    <>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Page loading"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden"
      >
        <div
          className={cn(
            "h-full origin-left rounded-r-full bg-gradient-to-r from-[#A97F44] via-[#E7C990] to-[#2dd4c8] shadow-[0_0_12px_rgba(214,174,115,0.55)] transition-[width] duration-200 ease-out",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {showOverlay ? (
        <div className="fixed inset-0 z-[95]">
          <PageLoader
            variant="fullscreen"
            label="Opening…"
            hint="Fetching the next desk view"
          />
        </div>
      ) : null}
    </>
  );
}
