import { formatMoney, type Money } from "@/lib/money";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type ReceiptLine = {
  id: string;
  type: string;
  description: string;
  businessDate: string;
  amount: Money;
  createdAt?: Date | string;
};

export type MoneyReceiptProps = {
  propertyName: string;
  confirmationNumber: string;
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  arrivalDate: string;
  departureDate: string;
  folioPublicId?: string;
  folioStatus?: string;
  currency: string;
  lines: ReceiptLine[];
  balance?: Money | null;
  issuedAt?: Date | string;
  className?: string;
};

function signedAmount(type: string, amount: Money): Money {
  if (type === "PAYMENT" || type === "REFUND" || type === "VOID") {
    return { amountMinor: -Math.abs(amount.amountMinor), currency: amount.currency };
  }
  return amount;
}

export function MoneyReceipt({
  propertyName,
  confirmationNumber,
  guestName,
  guestEmail,
  guestPhone,
  arrivalDate,
  departureDate,
  folioPublicId,
  folioStatus,
  currency,
  lines,
  balance,
  issuedAt,
  className,
}: MoneyReceiptProps) {
  const charges = lines.filter((l) => l.type === "CHARGE" || l.type === "ADJUSTMENT");
  const payments = lines.filter((l) => l.type === "PAYMENT" || l.type === "REFUND");
  const chargeTotal = charges.reduce((sum, l) => sum + l.amount.amountMinor, 0);
  const paymentTotal = payments.reduce((sum, l) => sum + Math.abs(l.amount.amountMinor), 0);
  const computedBalance = balance?.amountMinor ?? chargeTotal - paymentTotal;
  const issued = issuedAt ? new Date(issuedAt) : new Date();

  return (
    <article
      id="money-receipt"
      className={cn(
        "overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)] print:rounded-none print:border print:shadow-none",
        className,
      )}
    >
      <header className="border-b border-border bg-[#0F1C2A] px-5 py-5 text-nav-text sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark className="h-11 w-11" />
            <div>
              <p className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-nav-active-accent">
                {propertyName}
              </p>
              <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-nav-muted">
                Guest money receipt
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold tabular text-nav-text">{confirmationNumber}</p>
            <p className="mt-1 text-nav-muted">
              Issued {format(issued, "dd MMM yyyy · HH:mm")}
            </p>
            {folioPublicId ? (
              <p className="mt-1 text-xs text-nav-muted">Folio {folioPublicId.slice(0, 8)}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-4 border-b border-border px-5 py-4 sm:grid-cols-2 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Guest</p>
          <p className="mt-1 text-base font-semibold text-text">{guestName}</p>
          {guestEmail ? <p className="mt-0.5 text-sm text-text-muted">{guestEmail}</p> : null}
          {guestPhone ? <p className="text-sm text-text-muted">{guestPhone}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Stay</p>
          <p className="mt-1 text-base font-semibold tabular text-text">
            {arrivalDate} → {departureDate}
          </p>
          <p className="mt-0.5 text-sm text-text-muted">
            Folio {folioStatus ? folioStatus.replace(/_/g, " ").toLowerCase() : "—"} · {currency}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-5 py-3 text-left font-semibold sm:px-6">Date</th>
              <th className="px-3 py-3 text-left font-semibold">Description</th>
              <th className="px-3 py-3 text-left font-semibold">Type</th>
              <th className="px-5 py-3 text-right font-semibold sm:px-6">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-text-muted sm:px-6">
                  No folio lines posted yet.
                </td>
              </tr>
            ) : (
              lines.map((line) => {
                const signed = signedAmount(line.type, line.amount);
                const isCredit =
                  line.type === "PAYMENT" || line.type === "REFUND" || line.type === "VOID";
                return (
                  <tr key={line.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 align-top tabular text-text-muted sm:px-6">
                      {line.businessDate}
                    </td>
                    <td className="px-3 py-3 align-top text-text">{line.description}</td>
                    <td className="px-3 py-3 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                          isCredit
                            ? "bg-success/10 text-success"
                            : "bg-primary/8 text-primary",
                        )}
                      >
                        {line.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right align-top font-semibold tabular sm:px-6",
                        isCredit ? "text-success" : "text-text",
                      )}
                    >
                      {isCredit ? "−" : ""}
                      {formatMoney({
                        amountMinor: Math.abs(signed.amountMinor),
                        currency: signed.currency,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-border bg-surface-subtle/60 px-5 py-4 sm:px-6">
        <div className="ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-text-muted">Charges</span>
            <span className="font-semibold tabular text-text">
              {formatMoney({ amountMinor: chargeTotal, currency })}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-text-muted">Payments</span>
            <span className="font-semibold tabular text-success">
              −{formatMoney({ amountMinor: paymentTotal, currency })}
            </span>
          </div>
          <div className="flex justify-between gap-6 border-t border-border pt-2">
            <span className="font-semibold text-text">Balance due</span>
            <span
              className={cn(
                "text-lg font-bold tabular",
                computedBalance > 0 ? "text-warning" : "text-success",
              )}
            >
              {formatMoney({ amountMinor: Math.max(computedBalance, 0), currency })}
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          This receipt reflects folio postings for the stay. Card numbers and CVV are never stored.
        </p>
      </footer>
    </article>
  );
}
