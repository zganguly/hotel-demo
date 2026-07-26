export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-border bg-surface p-8">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="max-w-lg text-sm text-text-muted">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-[14px] border border-danger/30 bg-danger/5 p-6 text-danger"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-[10px] bg-danger px-3 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function PermissionDenied({
  description = "You do not have permission to view this module.",
}: {
  description?: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-text">Permission required</h2>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
    </div>
  );
}
