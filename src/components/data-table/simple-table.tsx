import { formatMoney, type Money } from "@/lib/money";
import { StatusBadge } from "@/components/feedback/status-badge";
import { cn } from "@/lib/utils";

export function reservationStatusTone(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" | "premium" {
  switch (status) {
    case "CONFIRMED":
    case "CHECKED_OUT":
      return "success";
    case "CHECKED_IN":
      return "info";
    case "OPTION":
    case "WAITLIST":
    case "INQUIRY":
      return "warning";
    case "CANCELLED":
    case "NO_SHOW":
      return "danger";
    default:
      return "neutral";
  }
}

export function folioStatusTone(status: string) {
  if (status === "OPEN") return "warning" as const;
  if (status === "CLOSED") return "success" as const;
  return "neutral" as const;
}

type Column = {
  key: string;
  header: string;
  className?: string;
  align?: "left" | "right";
};

export function DataTable({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  columns: Column[];
  rows: Array<Record<string, React.ReactNode>>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-border bg-surface p-8">
        <h2 className="text-lg font-semibold text-text">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-text-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-border bg-surface shadow-[var(--shadow-card)]">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-text-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 font-semibold",
                  col.align === "right" && "text-right",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-0">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 align-top text-text",
                    col.align === "right" && "text-right tabular",
                    col.className,
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MoneyCell({ value }: { value?: Money | null }) {
  if (!value) return <span className="text-text-muted">—</span>;
  return <span className="tabular">{formatMoney(value)}</span>;
}

export function StatusCell({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral" | "premium";
}) {
  return <StatusBadge label={label.replace(/_/g, " ")} tone={tone} />;
}
