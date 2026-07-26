import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/feedback/status-badge";
import { reservationStatusTone } from "@/components/data-table/simple-table";

export type CalendarReservation = {
  publicId: string;
  confirmationNumber: string;
  guestName: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  source: string;
};

type MonthCalendarProps = {
  propertySlug: string;
  month: string; // YYYY-MM
  businessDate: string;
  reservations: CalendarReservation[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthLabel(month: string) {
  return format(parseISO(`${month}-01`), "MMMM yyyy");
}

function shiftMonth(month: string, delta: number) {
  const base = parseISO(`${month}-01`);
  const next = delta < 0 ? subMonths(base, Math.abs(delta)) : addMonths(base, delta);
  return format(next, "yyyy-MM");
}

function staysOnDay(reservation: CalendarReservation, day: string) {
  return reservation.arrivalDate <= day && reservation.departureDate > day;
}

function arrivesOnDay(reservation: CalendarReservation, day: string) {
  return reservation.arrivalDate === day;
}

function departsOnDay(reservation: CalendarReservation, day: string) {
  return reservation.departureDate === day;
}

export function ReservationMonthCalendar({
  propertySlug,
  month,
  businessDate,
  reservations,
}: MonthCalendarProps) {
  const monthStart = startOfMonth(parseISO(`${month}-01`));
  const monthEnd = endOfMonth(monthStart);
  const startPad = getDay(monthStart);
  const daysInMonth = Number(format(monthEnd, "d"));

  const cells: Array<{ date: string | null; dayNumber: number | null }> = [];
  for (let i = 0; i < startPad; i += 1) {
    cells.push({ date: null, dayNumber: null });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = format(addDays(monthStart, d - 1), "yyyy-MM-dd");
    cells.push({ date, dayNumber: d });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dayNumber: null });
  }

  const monthFrom = format(monthStart, "yyyy-MM-dd");
  const monthTo = format(monthEnd, "yyyy-MM-dd");
  const overlapping = reservations.filter(
    (r) => r.arrivalDate <= monthTo && r.departureDate > monthFrom,
  );

  const arrivals = overlapping.filter(
    (r) => r.arrivalDate >= monthFrom && r.arrivalDate <= monthTo,
  ).length;
  const departures = overlapping.filter(
    (r) => r.departureDate >= monthFrom && r.departureDate <= monthTo,
  ).length;
  const inHousePeak = Math.max(
    0,
    ...cells
      .filter((c) => c.date)
      .map((c) => overlapping.filter((r) => staysOnDay(r, c.date!)).length),
  );

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const baseHref = `/app/${propertySlug}/calendar`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[18px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <Link
            href={`${baseHref}?month=${prev}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-text transition hover:bg-surface-subtle"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] leading-none font-semibold text-text">
              {monthLabel(month)}
            </h2>
            <p className="mt-1.5 text-xs text-text-muted">
              One month at a time · stays overlapping this calendar month
            </p>
          </div>
          <Link
            href={`${baseHref}?month=${next}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-text transition hover:bg-surface-subtle"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${baseHref}?month=${businessDate.slice(0, 7)}`}
            className="rounded-[10px] border border-border bg-background px-3.5 py-2 text-sm font-semibold text-text transition hover:bg-surface-subtle"
          >
            This month
          </Link>
          <Link
            href={`/app/${propertySlug}/reservations?from=${monthFrom}&to=${monthTo}`}
            className="rounded-[10px] bg-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Open as list
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Arrivals", value: arrivals, hint: "Check-ins this month" },
          { label: "Departures", value: departures, hint: "Check-outs this month" },
          { label: "Peak in-house", value: inHousePeak, hint: "Highest overnight count" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[16px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              {stat.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular text-text">{stat.value}</p>
            <p className="mt-0.5 text-xs text-text-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-7 border-b border-border bg-[#0F1C2A] text-[11px] font-semibold uppercase tracking-[0.14em] text-nav-muted">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-3 text-center sm:px-3">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {cells.map((cell, index) => {
            if (!cell.date) {
              return (
                <div
                  key={`pad-${index}`}
                  className="min-h-[118px] border-b border-r border-border bg-surface-subtle/40"
                />
              );
            }

            const dayReservations = overlapping
              .filter(
                (r) =>
                  staysOnDay(r, cell.date!) ||
                  arrivesOnDay(r, cell.date!) ||
                  departsOnDay(r, cell.date!),
              )
              .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate));
            const isToday = cell.date === businessDate;
            const weekend = index % 7 === 0 || index % 7 === 6;
            const visible = dayReservations.slice(0, 3);
            const extra = dayReservations.length - visible.length;

            return (
              <div
                key={cell.date}
                className={cn(
                  "flex min-h-[118px] flex-col border-b border-r border-border p-2 sm:min-h-[132px] sm:p-2.5",
                  weekend && "bg-[#F8FAFC]",
                  isToday && "bg-[#EEF6F4]",
                )}
              >
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "inline-flex h-7 min-w-7 items-center justify-center rounded-full text-sm font-semibold tabular",
                      isToday
                        ? "bg-primary text-white"
                        : "text-text",
                    )}
                  >
                    {cell.dayNumber}
                  </span>
                  {dayReservations.length > 0 ? (
                    <span className="rounded-full bg-primary/8 px-1.5 py-0.5 text-[10px] font-bold tabular text-primary">
                      {dayReservations.length}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  {visible.map((reservation) => {
                    const arriving = arrivesOnDay(reservation, cell.date!);
                    const departing = departsOnDay(reservation, cell.date!);
                    const tag = arriving ? "In" : departing ? "Out" : "Stay";
                    return (
                      <Link
                        key={`${reservation.publicId}-${cell.date}`}
                        href={`/app/${propertySlug}/reservations/${reservation.publicId}`}
                        className={cn(
                          "block truncate rounded-lg border px-1.5 py-1 text-[11px] leading-tight transition hover:brightness-95",
                          arriving && "border-teal/30 bg-teal/10 text-[#0F5C56]",
                          departing && "border-warning/30 bg-warning/10 text-[#8A5A12]",
                          !arriving &&
                            !departing &&
                            "border-primary/15 bg-primary/6 text-primary",
                        )}
                        title={`${reservation.guestName} · ${reservation.confirmationNumber} · ${reservation.status}`}
                      >
                        <span className="font-bold">{tag}</span>
                        <span className="mx-1 opacity-50">·</span>
                        <span className="font-medium">{reservation.guestName}</span>
                      </Link>
                    );
                  })}
                  {extra > 0 ? (
                    <Link
                      href={`/app/${propertySlug}/reservations?from=${cell.date}&to=${cell.date}`}
                      className="px-1 text-[10px] font-semibold text-text-muted hover:text-primary"
                    >
                      +{extra} more
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-surface px-4 py-3 text-xs text-text-muted shadow-[var(--shadow-card)]">
        <span className="font-semibold uppercase tracking-[0.12em] text-text">Legend</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal/70" /> Arrival
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/50" /> In-house
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-warning/70" /> Departure
        </span>
        <span className="ml-auto hidden items-center gap-2 sm:inline-flex">
          <StatusBadge label="Confirmed" tone={reservationStatusTone("CONFIRMED")} />
          <StatusBadge label="In house" tone={reservationStatusTone("CHECKED_IN")} />
        </span>
      </div>
    </div>
  );
}
