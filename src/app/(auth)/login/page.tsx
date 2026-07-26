"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { animate, createScope, stagger } from "animejs";
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

const NightDeskCanvas = dynamic(
  () => import("@/components/three/night-desk").then((m) => m.NightDeskCanvas),
  { ssr: false, loading: () => null },
);

type LoginState =
  | "default"
  | "validation"
  | "invalid"
  | "rateLimited"
  | "suspended"
  | "loading";

// Seeded demo accounts (see scripts/seed/index.ts).
const DEMO_USERS = [
  {
    label: "Admin",
    detail: "All properties",
    email: "admin@aureliastay.example",
    slug: "harbour-view",
  },
  {
    label: "Hotel Manager",
    detail: "Harbour View Hotel",
    email: "manager.kolkata@aureliastay.example",
    slug: "harbour-view",
  },
] as const;

export default function LoginPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<LoginState>("default");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scope = createScope({ root: rootRef.current }).add(() => {
      animate(".login-visual", {
        opacity: [0, 1],
        duration: 450,
        ease: "out(2)",
      });
      animate(".login-card", {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 500,
        delay: 180,
        ease: "out(3)",
      });
      animate(".login-field", {
        opacity: [0, 1],
        translateY: [8, 0],
        delay: stagger(45, { start: 400 }),
        duration: 400,
        ease: "out(3)",
      });
    });
    return () => scope.revert();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      setState("validation");
      return;
    }
    setState("loading");
    // Auth wiring lands in later auth part; demo redirect for shell access.
    await new Promise((resolve) => setTimeout(resolve, 600));
    window.location.href = "/app/harbour-view/dashboard";
  }

  async function onDemoLogin(user: (typeof DEMO_USERS)[number]) {
    setEmail(user.email);
    setPassword("demo-password");
    setState("loading");
    await new Promise((resolve) => setTimeout(resolve, 600));
    window.location.href = `/app/${user.slug}/dashboard`;
  }

  const message =
    state === "validation"
      ? "Enter email and password to continue."
      : state === "invalid"
        ? "Unable to sign in with those credentials."
        : state === "rateLimited"
          ? "Too many attempts. Try again shortly."
          : state === "suspended"
            ? "This account is suspended. Contact an administrator."
            : null;

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1420] px-4 py-10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,_#1D3449,_#0B1420_65%)]" />
      <div className="login-visual absolute inset-0">
        <NightDeskCanvas reducedMotion={reducedMotion} />
      </div>
      {/* Soft veil so the centered card stays readable over the scene */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(7,16,24,0.45)_0%,_rgba(7,16,24,0.15)_45%,_transparent_72%)]" />

      <main className="relative z-10 w-full max-w-md">
        <div className="login-card mb-6 flex flex-col items-center text-center">
          <Link href="/" aria-label="Hotel PMS home" className="flex flex-col items-center gap-3">
            <LogoMark className="h-14 w-14 drop-shadow-[0_6px_20px_rgba(214,174,115,0.25)]" />
            <span className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold leading-none tracking-wide text-nav-active-accent">
              Hotel PMS
            </span>
          </Link>
          <p className="mt-2 text-sm text-nav-muted">
            The night desk, ready before the shift starts.
          </p>
        </div>

        <div className="login-card relative w-full">
          {/* Champagne glow behind the card */}
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(ellipse_at_top,_rgba(214,174,115,0.14),_transparent_65%)] blur-xl"
          />
          <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#0E1B2C]/85 p-6 shadow-[0_24px_80px_rgba(3,10,18,0.65)] backdrop-blur-xl sm:p-8">
            {/* Hairline top highlight */}
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-nav-active-accent/60 to-transparent"
            />

            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nav-active-accent/15 text-nav-active-accent ring-1 ring-nav-active-accent/30">
                <KeyRound className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] leading-none font-semibold text-nav-text">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-[13px] text-nav-muted">
                  Role and property access come from your account.
                </p>
              </div>
            </div>

          <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-nav-text">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-muted"
                  aria-hidden
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@property.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-nav-text placeholder:text-nav-muted/60 outline-none transition focus:border-nav-active-accent/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-nav-active-accent/25"
                />
              </div>
            </div>
            <div className="login-field">
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-nav-text">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-muted"
                  aria-hidden
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-11 text-sm text-nav-text placeholder:text-nav-muted/60 outline-none transition focus:border-nav-active-accent/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-nav-active-accent/25"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-nav-muted transition hover:text-nav-text"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="login-field flex items-center justify-between text-sm">
              <label className="inline-flex cursor-pointer items-center gap-2 text-nav-muted">
                <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#C89B5D]" />
                Remember this device
              </label>
              <Link
                href="/forgot-password"
                className="font-medium text-nav-active-accent hover:underline"
              >
                Forgot password
              </Link>
            </div>

            {message ? (
              <p
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger/15 px-3.5 py-2.5 text-sm text-[#f4a9a9]"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={state === "loading"}
              className="login-field inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C89B5D] via-[#D6AE73] to-[#C89B5D] text-sm font-bold text-[#0B1420] shadow-[0_8px_24px_rgba(200,155,93,0.35)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="login-field mt-7">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nav-muted">
                Demo accounts
              </p>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  disabled={state === "loading"}
                  onClick={() => onDemoLogin(user)}
                  className="group rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-left transition hover:border-nav-active-accent/50 hover:bg-nav-active-accent/10 active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-nav-text">
                    {user.label}
                    <span className="font-normal text-nav-muted transition group-hover:text-nav-text/80">
                      · {user.detail}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-nav-muted/80">
                    {user.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>

        <p className="login-card mt-5 text-center text-xs text-nav-muted/80">
          Protected area · Server-side authorization on every request
        </p>
      </main>
    </div>
  );
}
