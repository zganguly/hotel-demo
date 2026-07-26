import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  Gauge,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import { AI_ANALYSIS_STATIC, type InsightTone } from "@/modules/reports/ai-analysis.static";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

function toneToBadge(tone: InsightTone): "success" | "warning" | "danger" | "info" | "neutral" {
  if (tone === "positive") return "success";
  if (tone === "watch") return "warning";
  if (tone === "critical") return "danger";
  return "neutral";
}

function priorityTone(priority: "High" | "Medium" | "Low") {
  if (priority === "High") return "danger" as const;
  if (priority === "Medium") return "warning" as const;
  return "neutral" as const;
}

function severityTone(severity: "Critical" | "Elevated" | "Monitor") {
  if (severity === "Critical") return "danger" as const;
  if (severity === "Elevated") return "warning" as const;
  return "info" as const;
}

function Section({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">{eyebrow}</p>
          <h2 className="text-xl font-bold text-text md:text-2xl">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function AiAnalysisPage({ params }: PageProps) {
  const { propertySlug } = await params;
  const propertyName =
    propertySlug === "harbour-view" ? "Harbour View Hotel" : "Garden Court Residences";
  const data = AI_ANALYSIS_STATIC;

  const toc = [
    { href: "#brief", label: "Owner brief" },
    { href: "#scorecard", label: "Scorecard" },
    { href: "#demand", label: "Demand" },
    { href: "#revenue", label: "Revenue" },
    { href: "#operations", label: "Operations" },
    { href: "#guests", label: "Guests" },
    { href: "#channels", label: "Channels" },
    { href: "#finance", label: "Finance" },
    { href: "#risks", label: "Risks" },
    { href: "#playbook", label: "Playbook" },
  ];

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate="2026-07-24"
      breadcrumb={["Overview", "AI Analysis"]}
    >
      <PageHeader
        title="AI Analysis"
        description="Structured owner briefing: predictions, revenue levers, operations risks, and a clear action playbook. Static demo content for now."
        primaryAction={
          <span className="inline-flex items-center gap-2 rounded-[10px] border border-accent/40 bg-accent/15 px-3 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            {data.modelLabel}
          </span>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
        <StatusBadge label="Owner advisory" tone="premium" />
        <span>Updated {data.generatedAt}</span>
        <span aria-hidden>·</span>
        <span>{data.propertyFocus}</span>
      </div>

      <nav
        aria-label="AI Analysis sections"
        className="mt-6 flex gap-2 overflow-x-auto pb-1"
      >
        {toc.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary/30 hover:text-primary"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-12">
        <Section
          id="brief"
          eyebrow="01 · Executive brief"
          title="What the owner should know first"
          description="A plain-language summary of demand, money, and readiness — written for decisions, not dashboards."
          icon={BrainCircuit}
        >
          <div className="rounded-[14px] border border-accent/30 bg-[linear-gradient(135deg,#173B57_0%,#0F2D44_55%,#132131_100%)] p-6 text-nav-text shadow-[var(--shadow-card)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nav-active-accent">
              Priority insight
            </p>
            <h3 className="mt-3 max-w-3xl text-2xl font-bold leading-snug md:text-3xl">
              {data.executiveBrief.headline}
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-nav-muted md:text-base">
              {data.executiveBrief.summary}
            </p>
            <p className="mt-4 text-sm font-medium text-teal">{data.executiveBrief.confidence}</p>
            <ol className="mt-6 grid gap-3 md:grid-cols-3">
              {data.executiveBrief.topActions.map((action, index) => (
                <li
                  key={action}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <p className="text-xs font-semibold text-nav-active-accent">Action {index + 1}</p>
                  <p className="mt-2 text-nav-text">{action}</p>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        <Section
          id="scorecard"
          eyebrow="02 · Business scorecard"
          title="Health at a glance"
          description="Four owner-level metrics that explain whether the hotel is winning on pace, rate, channel mix, and risk."
          icon={Gauge}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.scorecard.map((metric) => (
              <article
                key={metric.label}
                className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-text-muted">{metric.label}</p>
                  <StatusBadge label={metric.tone} tone={toneToBadge(metric.tone)} />
                </div>
                <p className="mt-3 text-3xl font-bold tabular text-text">{metric.value}</p>
                <p
                  className={cn(
                    "mt-2 text-sm font-medium",
                    metric.tone === "positive" && "text-success",
                    metric.tone === "watch" && "text-warning",
                    (metric.tone as InsightTone) === "critical" && "text-danger",
                    (metric.tone as InsightTone) === "neutral" && "text-text-muted",
                  )}
                >
                  {metric.change}
                </p>
                <p className="mt-2 text-xs text-text-muted">{metric.detail}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="demand"
          eyebrow="03 · Demand predictions"
          title="What booking pace suggests next"
          description="Forward-looking occupancy and mix calls so you can protect rate early and stimulate soft nights intentionally."
          icon={TrendingUp}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {data.demandPredictions.map((item) => (
              <article
                key={item.title}
                className="flex flex-col rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-text">{item.title}</h3>
                  <StatusBadge label={item.tone} tone={toneToBadge(item.tone)} />
                </div>
                <p className="mt-2 text-xs font-medium text-text-muted">
                  {item.horizon} · {item.confidence}
                </p>
                <p className="mt-3 flex-1 text-sm text-text-muted">{item.summary}</p>
                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <p>
                    <span className="font-semibold text-text">Impact: </span>
                    <span className="text-text-muted">{item.impact}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-text">Do next: </span>
                    <span className="text-text-muted">{item.action}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="revenue"
          eyebrow="04 · Revenue & pricing"
          title="Levers that move net profit"
          description="Prioritized recommendations with expected lift — focused on owner decisions, not analyst jargon."
          icon={CircleDollarSign}
        >
          <div className="overflow-x-auto rounded-[14px] border border-border bg-surface shadow-[var(--shadow-card)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Recommendation</th>
                  <th className="px-4 py-3 font-semibold">Why it matters</th>
                  <th className="px-4 py-3 font-semibold">Expected lift</th>
                  <th className="px-4 py-3 font-semibold">Owner focus</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueInsights.map((row) => (
                  <tr key={row.title} className="border-b border-border last:border-0">
                    <td className="px-4 py-4 align-top">
                      <StatusBadge label={row.priority} tone={priorityTone(row.priority)} />
                    </td>
                    <td className="px-4 py-4 align-top font-semibold text-text">{row.title}</td>
                    <td className="px-4 py-4 align-top text-text-muted">{row.why}</td>
                    <td className="px-4 py-4 align-top font-medium tabular text-teal">
                      {row.expectedLift}
                    </td>
                    <td className="px-4 py-4 align-top text-text-muted">{row.ownerFocus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          id="operations"
          eyebrow="05 · Operations readiness"
          title="Where the house can lose money quietly"
          description="Housekeeping, maintenance, night audit, and staffing issues that block revenue even when demand is strong."
          icon={Wrench}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {data.operationsInsights.map((item) => (
              <article
                key={item.title}
                className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-text">{item.title}</h3>
                  <StatusBadge label={item.metric} tone={toneToBadge(item.tone)} />
                </div>
                <p className="mt-3 text-sm text-text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="guests"
          eyebrow="06 · Guest experience"
          title="Reputation and loyalty signals"
          description="What guests are feeling in arrivals, recovery, and F&B — and how to convert that into repeat revenue."
          icon={Users}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {data.guestExperience.map((item) => (
              <article
                key={item.theme}
                className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-teal">{item.theme}</p>
                <p className="mt-2 text-sm font-medium text-text">{item.signal}</p>
                <p className="mt-3 flex items-start gap-2 text-sm text-text-muted">
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {item.recommendation}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="channels"
          eyebrow="07 · Distribution mix"
          title="Where bookings come from — and what they cost"
          description="Channel share and trend notes so you can decide when to push direct versus accept OTA volume."
          icon={Building2}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.channelAndCompetition.map((channel) => (
              <article
                key={channel.channel}
                className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <p className="text-sm text-text-muted">{channel.channel}</p>
                <p className="mt-2 text-3xl font-bold tabular text-text">{channel.share}</p>
                <p className="mt-1 text-xs font-semibold text-primary">Trend: {channel.trend}</p>
                <p className="mt-3 text-sm text-text-muted">{channel.note}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="finance"
          eyebrow="08 · Financial pulse"
          title="Cash, commission, and collections"
          description="Owner-level money view: gross vs net after channel cost, ancillary weakness, and AR follow-ups."
          icon={CircleDollarSign}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.financialPulse.map((item) => (
              <article
                key={item.label}
                className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <p className="text-sm text-text-muted">{item.label}</p>
                <p className="mt-3 text-2xl font-bold tabular text-text">{item.value}</p>
                <p className="mt-2 text-xs text-text-muted">{item.note}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="risks"
          eyebrow="09 · Risk & compliance watch"
          title="Issues that need owner attention"
          description="Inventory, deposits, reputation, and compliance signals ranked by severity with concrete mitigations."
          icon={AlertTriangle}
        >
          <div className="space-y-3">
            {data.risks.map((risk) => (
              <article
                key={risk.area}
                className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)] md:grid md:grid-cols-[140px_1fr_1.1fr] md:gap-4"
              >
                <div>
                  <StatusBadge label={risk.severity} tone={severityTone(risk.severity)} />
                  <p className="mt-3 font-semibold text-text">{risk.area}</p>
                </div>
                <p className="mt-3 text-sm text-text-muted md:mt-0">
                  <span className="font-semibold text-text">Signal: </span>
                  {risk.signal}
                </p>
                <p className="mt-3 text-sm text-text-muted md:mt-0">
                  <span className="font-semibold text-text">Mitigation: </span>
                  {risk.mitigation}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="playbook"
          eyebrow="10 · Owner playbook"
          title="What to do today, this week, and this month"
          description="A practical checklist so the analysis turns into execution across the leadership team."
          icon={ClipboardCheck}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {data.ownerPlaybook.map((block) => (
              <article
                key={block.when}
                className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  {block.when}
                </p>
                <ul className="mt-4 space-y-3">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-text">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
