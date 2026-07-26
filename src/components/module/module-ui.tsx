import { cn } from "@/lib/utils";

export type MetricTone = "default" | "success" | "warning" | "danger" | "info" | "premium";

const toneClass: Record<MetricTone, string> = {
  default: "text-text",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  premium: "text-primary",
};

export function MetricCards({
  items,
  className,
}: {
  items: Array<{
    label: string;
    value: string | number;
    hint?: string;
    tone?: MetricTone;
  }>;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[16px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            {item.label}
          </p>
          <p className={cn("mt-1.5 text-2xl font-bold tabular", toneClass[item.tone ?? "default"])}>
            {item.value}
          </p>
          {item.hint ? <p className="mt-0.5 text-xs text-text-muted">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function ModuleSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-base font-semibold text-text">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function EmptyModuleState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-border bg-surface-subtle/50 p-8 text-center">
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-1.5 text-sm text-text-muted">{description}</p>
    </div>
  );
}
