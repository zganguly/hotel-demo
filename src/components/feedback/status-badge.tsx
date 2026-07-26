import { cn } from "@/lib/utils";

const toneClasses = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-surface-subtle text-text-muted",
  premium: "bg-accent/15 text-primary",
} as const;

type StatusBadgeProps = {
  label: string;
  tone?: keyof typeof toneClasses;
  title?: string;
  className?: string;
};

export function StatusBadge({
  label,
  tone = "neutral",
  title,
  className,
}: StatusBadgeProps) {
  return (
    <span
      title={title ?? label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
