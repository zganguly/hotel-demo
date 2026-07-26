"use client";

import { Printer } from "lucide-react";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text transition hover:bg-surface-subtle print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden />
      Print receipt
    </button>
  );
}
