import { Suspense } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  MoneyCell,
  StatusCell,
  reservationStatusTone,
} from "@/components/data-table/simple-table";
import { DateRangeFilter } from "@/components/reservations/date-range-filter";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { GuestModel } from "@/modules/guests/guest.model";
import type { Money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
  searchParams: Promise<{ from?: string; to?: string; q?: string }>;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string | undefined, fallback: string) {
  if (!value || !DATE_RE.test(value)) return fallback;
  if (Number.isNaN(parseISO(value).getTime())) return fallback;
  return value;
}

export default async function ReservationsPage({ params, searchParams }: PageProps) {
  const { propertySlug } = await params;
  const query = await searchParams;
  const property = await getPropertyBySlug(propertySlug);
  const businessDate = businessDateToday(property?.timezone);
  const propertyName = propertyDisplayName(propertySlug, property?.name);

  const defaultFrom = format(subDays(parseISO(businessDate), 7), "yyyy-MM-dd");
  const defaultTo = format(addDays(parseISO(businessDate), 30), "yyyy-MM-dd");
  let from = validDate(query.from, defaultFrom);
  let to = validDate(query.to, defaultTo);
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  const confirmationQuery = query.q?.trim();

  if (!property) {
    return (
      <AppShell
        propertySlug={propertySlug}
        propertyName={propertyName}
        businessDate={businessDate}
        breadcrumb={["Reservations"]}
      >
        <PageHeader title="Reservations" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const filter: Record<string, unknown> = {
    propertyId: property._id,
    arrivalDate: { $lte: to },
    departureDate: { $gt: from },
  };
  if (confirmationQuery) {
    filter.confirmationNumber = { $regex: confirmationQuery, $options: "i" };
  }

  const reservations = await ReservationModel.find(filter)
    .sort({ arrivalDate: 1, confirmationNumber: 1 })
    .limit(400)
    .lean();

  const guestIds = reservations.map((r) => r.guestId).filter(Boolean);
  const guests = await GuestModel.find({ _id: { $in: guestIds } }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));

  const rows = reservations.map((reservation) => {
    const guest = reservation.guestId ? guestMap.get(String(reservation.guestId)) : undefined;
    const href = `/app/${propertySlug}/reservations/${reservation.publicId}`;
    return {
      confirmation: (
        <a href={href} className="font-semibold tabular text-primary hover:underline">
          {reservation.confirmationNumber}
        </a>
      ),
      guest: (
        <a href={href} className="hover:text-primary hover:underline">
          {guest ? `${guest.firstName} ${guest.lastName}` : "—"}
        </a>
      ),
      stay: (
        <span className="tabular">
          {reservation.arrivalDate} → {reservation.departureDate}
        </span>
      ),
      status: (
        <StatusCell
          label={reservation.status}
          tone={reservationStatusTone(reservation.status)}
        />
      ),
      source: reservation.source,
      guests: (
        <span className="tabular">
          {reservation.adults}A{reservation.children ? ` · ${reservation.children}C` : ""}
        </span>
      ),
      total: <MoneyCell value={reservation.totals?.total as Money | undefined} />,
      open: (
        <a
          href={href}
          className="inline-flex rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-text transition hover:border-primary hover:text-primary"
        >
          Details
        </a>
      ),
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Reservations", "All Reservations"]}
    >
      <PageHeader
        title="Reservations"
        description={`Stays overlapping ${from} → ${to}${
          confirmationQuery ? ` · filtered by “${confirmationQuery}”` : ""
        }.`}
        primaryAction={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/app/${propertySlug}/calendar?month=${from.slice(0, 7)}`}
              className="rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-subtle"
            >
              Full calendar
            </a>
            <a
              href={`/app/${propertySlug}/reservations/new`}
              className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              New reservation
            </a>
          </div>
        }
        filters={
          <Suspense
            fallback={
              <div className="h-[92px] animate-pulse rounded-[16px] border border-border bg-surface" />
            }
          >
            <DateRangeFilter
              from={from}
              to={to}
              defaults={{ from: defaultFrom, to: defaultTo }}
            />
          </Suspense>
        }
      />
      <div className="mt-6">
        <DataTable
          columns={[
            { key: "confirmation", header: "Confirmation" },
            { key: "guest", header: "Guest" },
            { key: "stay", header: "Stay" },
            { key: "status", header: "Status" },
            { key: "source", header: "Source" },
            { key: "guests", header: "Occupancy" },
            { key: "total", header: "Total", align: "right" },
            { key: "open", header: "" },
          ]}
          rows={rows}
          emptyTitle="No reservations in this range"
          emptyDescription="Widen the date range or clear filters to see more bookings."
        />
      </div>
    </AppShell>
  );
}
