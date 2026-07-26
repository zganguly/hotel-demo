import Link from "next/link";
import { addDays, endOfMonth, format, getDay, parseISO, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type MiniMonthCalendarProps = {
  propertySlug: string;
  businessDate: string;
  /** date (YYYY-MM-DD) -> booking count */
  bookingsByDate: Record<string, number>;
};

export function MiniMonthCalendar({
  propertySlug,
  businessDate,
  bookingsByDate,
}: MiniMonthCalendarProps) {
  const month = businessDate.slice(0, 7);
  const monthStart = startOfMonth(parseISO(`${month}-01`));
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = Number(format(monthEnd, "d"));
  const startPad = getDay(monthStart);
  const monthTotal = Object.values(bookingsByDate).reduce((sum, n) => sum + n, 0);

  const cells: Array<string | null> = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(format(addDays(monthStart, d - 1), "yyyy-MM-dd"));
  }

  const maxBookings = Math.max(1, ...Object.values(bookingsByDate));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-text">
            {format(monthStart, "MMMM yyyy")}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            <span className="font-semibold tabular text-text">{monthTotal}</span> bookings this month
          </p>
        </div>
        <Link
          href={`/app/${propertySlug}/calendar?month=${month}`}
          className="shrink-0 text-xs font-semibold text-primary hover:underline"
        >
          Full calendar
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-text-muted">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {cells.map((date, index) => {
          if (!date) return <span key={`pad-${index}`} />;
          const count = bookingsByDate[date] ?? 0;
          const intensity = count / maxBookings;
          const isToday = date === businessDate;
          return (
            <Link
              key={date}
              href={`/app/${propertySlug}/reservations?from=${date}&to=${date}`}
              title={`${date} · ${count} booking${count === 1 ? "" : "s"}`}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center rounded-[10px] px-0.5 py-1 transition hover:ring-2 hover:ring-focus",
                isToday
                  ? "bg-primary text-white shadow-[0_4px_12px_rgba(23,59,87,0.35)]"
                  : count > 0
                    ? "text-text"
                    : "bg-surface-subtle/60 text-text-muted",
              )}
              style={
                !isToday && count > 0
                  ? {
                      background: `rgba(15, 118, 110, ${0.1 + intensity * 0.32})`,
                    }
                  : undefined
              }
            >
              <span
                className={cn(
                  "text-[11px] font-semibold leading-none",
                  isToday ? "text-white/80" : "text-text-muted",
                )}
              >
                {Number(date.slice(8))}
              </span>
              <span
                className={cn(
                  "mt-1 text-sm font-bold tabular leading-none",
                  isToday
                    ? "text-white"
                    : count > 0
                      ? "text-teal"
                      : "text-text-muted/50",
                )}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-text-muted">
        <span className="h-2.5 w-2.5 rounded-sm bg-teal/30" />
        Number = bookings arriving that day
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Today
        </span>
      </div>
    </div>
  );
}
