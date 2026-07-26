"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate, createScope, stagger } from "animejs";
import { Logo, LogoMark } from "@/components/brand/logo";

const ConnectedStayCanvas = dynamic(
  () =>
    import("@/components/three/connected-stay").then((m) => m.ConnectedStayCanvas),
  { ssr: false, loading: () => null },
);

const features = [
  { title: "Live arrivals", body: "See due-in guests, room readiness, and special requests in one board." },
  { title: "Room availability", body: "Protect inventory by room type before assigning physical rooms." },
  { title: "Housekeeping priority", body: "Turn over rooms with clear status, priority, and assignment." },
  { title: "Payment status", body: "Track deposits, folios, and cashier activity without spreadsheet drift." },
  { title: "Occupancy & RevPAR", body: "Operational and revenue metrics that stay property-aware." },
  { title: "Night audit calm", body: "Close the business day with blockers surfaced before posting." },
];

export function LandingPage() {
  const rootRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!rootRef.current || reducedMotion) return;
    const scope = createScope({ root: rootRef.current }).add(() => {
      animate(".hero-fade", {
        opacity: [0, 1],
        duration: 250,
        ease: "out(2)",
      });
      animate(".hero-eyebrow", {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 450,
        delay: 120,
        ease: "out(3)",
      });
      animate(".hero-word", {
        opacity: [0, 1],
        translateY: [14, 0],
        delay: stagger(45, { start: 220 }),
        duration: 700,
        ease: "out(3)",
      });
      animate(".hero-body", {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 450,
        delay: 700,
        ease: "out(3)",
      });
      animate(".hero-preview", {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 550,
        delay: 850,
        ease: "out(3)",
      });
    });
    return () => scope.revert();
  }, [reducedMotion]);

  const heading = "Run every room, guest and shift with calm precision.";

  return (
    <main ref={rootRef} className="bg-[#0B1420] text-nav-text">
      <header className="hero-fade sticky top-0 z-20 border-b border-white/5 bg-[#0B1420]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" aria-label="Hotel PMS home">
            <Logo markClassName="h-9 w-9" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-nav-muted md:flex" aria-label="Marketing">
            <a href="#product" className="hover:text-nav-text">Product</a>
            <a href="#solutions" className="hover:text-nav-text">Solutions</a>
            <a href="#security" className="hover:text-nav-text">Security</a>
            <Link href="/login" className="hover:text-nav-text">Sign in</Link>
            <Link
              href="/login"
              className="rounded-[10px] bg-accent px-4 py-2 font-semibold text-primary hover:brightness-105"
            >
              Book demo
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1D3449_0%,_#0B1420_55%,_#071018_100%)]" />
        <ConnectedStayCanvas reducedMotion={reducedMotion} />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.1fr_0.9fr] md:px-6 md:py-28">
          <div>
            <p className="hero-eyebrow text-sm font-medium uppercase tracking-[0.18em] text-teal">
              One operating system for every stay
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-[52px] leading-[1.05] font-semibold md:text-[72px]">
              {heading.split(" ").map((word, index) => (
                <span key={`${word}-${index}`} className="hero-word inline-block mr-[0.28em]">
                  {word}
                </span>
              ))}
            </h1>
            <p className="hero-body mt-6 max-w-xl text-lg text-nav-muted">
              Reservations, front desk, housekeeping, billing, and reporting in one calm
              property management system built for independent hotels and growing groups.
            </p>
            <div className="hero-body mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-[10px] bg-accent px-5 py-3 text-sm font-semibold text-primary"
              >
                Book a product demo
              </Link>
              <a
                href="#product"
                className="rounded-[10px] border border-white/20 px-5 py-3 text-sm font-semibold text-nav-text"
              >
                Explore the platform
              </a>
            </div>
            <p className="hero-body mt-4 text-sm text-nav-muted">
              Built for independent hotels and growing groups
            </p>
          </div>
          <div className="hero-preview rounded-[18px] border border-white/10 bg-white/5 p-5 shadow-[var(--shadow-float)] backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-nav-muted">Command center preview</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Arrivals today", "18"],
                ["Rooms ready", "42"],
                ["In house", "96"],
                ["RevPAR", "₹4,820"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#132131] p-4">
                  <p className="text-xs text-nav-muted">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="bg-background px-4 py-20 text-text md:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl font-semibold md:text-5xl">
            Operations that stay connected
          </h2>
          <p className="mt-3 max-w-2xl text-text-muted">
            From reservation to checkout, every room night, folio line, and housekeeping task
            shares the same property-aware source of truth.
          </p>
          <div id="solutions" className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="border-t border-border bg-surface px-4 py-16 text-text md:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl font-semibold">
            Security and reliability
          </h2>
          <p className="mt-3 max-w-2xl text-text-muted">
            Server-side authorization, audit events, idempotent bookings and payments, and
            Hostinger-ready deployment with protected cron jobs.
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex rounded-[10px] bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Sign in to the platform
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#071018] px-4 py-10 text-sm text-nav-muted md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            Hotel PMS · Midnight Hospitality
          </p>
          <p>Demo data is fictional. Never store real guest card data in source control.</p>
        </div>
      </footer>
    </main>
  );
}
