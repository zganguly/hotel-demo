import { cn } from "@/lib/utils";

/**
 * "Midnight Tower" brand mark: a hotel tower with lit windows under a
 * crescent moon, in the Midnight Hospitality palette (deep navy, champagne
 * brass). Pure SVG so it stays crisp at every size.
 */
export function LogoMark({
  className,
  title = "Hotel PMS",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("h-10 w-10", className)}
    >
      <defs>
        <linearGradient id="hp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1D3449" />
          <stop offset="1" stopColor="#0B1420" />
        </linearGradient>
        <linearGradient id="hp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E7C990" />
          <stop offset="0.55" stopColor="#C89B5D" />
          <stop offset="1" stopColor="#A97F44" />
        </linearGradient>
        <mask id="hp-moon">
          <rect width="64" height="64" fill="black" />
          <circle cx="45.5" cy="17.5" r="6.5" fill="white" />
          <circle cx="48.5" cy="15" r="5.6" fill="black" />
        </mask>
      </defs>

      {/* Tile */}
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="15"
        fill="url(#hp-bg)"
        stroke="#D6AE73"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />

      {/* Crescent moon */}
      <rect width="64" height="64" fill="url(#hp-gold)" mask="url(#hp-moon)" />

      {/* Stars */}
      <circle cx="17" cy="13.5" r="1.1" fill="#E7C990" opacity="0.75" />
      <circle cx="23.5" cy="9.5" r="0.8" fill="#E7C990" opacity="0.5" />

      {/* Tower */}
      <rect
        x="20"
        y="21"
        width="24"
        height="31"
        rx="3"
        fill="#16273C"
        stroke="url(#hp-gold)"
        strokeWidth="2"
      />

      {/* Lit windows */}
      <rect x="25.4" y="26" width="4.6" height="5.4" rx="1" fill="#E7C990" />
      <rect x="34" y="26" width="4.6" height="5.4" rx="1" fill="#E7C990" opacity="0.45" />
      <rect x="25.4" y="34" width="4.6" height="5.4" rx="1" fill="#E7C990" opacity="0.8" />
      <rect x="34" y="34" width="4.6" height="5.4" rx="1" fill="#E7C990" />

      {/* Entrance arch */}
      <path d="M28.6 52v-5.2a3.4 3.4 0 0 1 6.8 0V52Z" fill="url(#hp-gold)" />

      {/* Ground line */}
      <path
        d="M15 52h34"
        stroke="url(#hp-gold)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark (+ optional tagline). */
export function Logo({
  className,
  markClassName,
  showTagline = false,
}: {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold tracking-wide text-nav-active-accent">
          Hotel PMS
        </span>
        {showTagline ? (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-nav-muted">
            Midnight Hospitality
          </span>
        ) : null}
      </span>
    </span>
  );
}
