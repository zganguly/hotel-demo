"use client";

import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  /** Full viewport overlay (route transitions) vs content-area panel */
  variant?: "fullscreen" | "panel";
  label?: string;
  hint?: string;
  className?: string;
};

/**
 * Midnight Hospitality page loader — champagne progress, soft glow, branded mark.
 * Honors prefers-reduced-motion via CSS (see motion.css / globals).
 */
export function PageLoader({
  variant = "fullscreen",
  label = "Opening…",
  hint = "Preparing this view for your property",
  className,
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "page-loader flex flex-col items-center justify-center",
        variant === "fullscreen" &&
          "fixed inset-0 z-[90] bg-[radial-gradient(ellipse_at_center,_#1D3449_0%,_#0B1420_62%,_#071018_100%)]",
        variant === "panel" &&
          "min-h-[52vh] w-full rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {variant === "fullscreen" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,_rgba(214,174,115,0.14),_transparent_42%)]"
        />
      ) : null}

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="page-loader-orbit relative mb-7 flex h-24 w-24 items-center justify-center">
          <span
            aria-hidden
            className="page-loader-ring absolute inset-0 rounded-full border border-nav-active-accent/25"
          />
          <span
            aria-hidden
            className="page-loader-ring-delay absolute inset-2 rounded-full border border-teal/20"
          />
          <LogoMark className="page-loader-mark relative h-14 w-14 drop-shadow-[0_8px_24px_rgba(214,174,115,0.28)]" />
        </div>

        <p
          className={cn(
            "font-[family-name:var(--font-cormorant)] text-[28px] font-semibold leading-none tracking-wide",
            variant === "fullscreen" ? "text-nav-active-accent" : "text-primary",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-2.5 max-w-xs text-sm",
            variant === "fullscreen" ? "text-nav-muted" : "text-text-muted",
          )}
        >
          {hint}
        </p>

        <div
          aria-hidden
          className={cn(
            "page-loader-track relative mt-8 h-1 w-44 overflow-hidden rounded-full",
            variant === "fullscreen" ? "bg-white/10" : "bg-border",
          )}
        >
          <span className="page-loader-bar absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-[#A97F44] via-[#E7C990] to-[#C89B5D]" />
        </div>

        <span className="sr-only">Loading page content</span>
      </div>
    </div>
  );
}
