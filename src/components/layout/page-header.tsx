import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  filters,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-tight text-text md:text-[32px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-text-muted">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction}
        </div>
      </div>
      {filters}
    </div>
  );
}
