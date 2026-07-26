import Link from "next/link";
import { addDays, endOfMonth, format, parseISO, startOfMonth, subDays } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  Brush,
  CalendarCheck,
  DoorOpen,
  HandCoins,
  MoonStar,
  Sparkles,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import { ModuleSection } from "@/components/module/module-ui";
import {
  DataTable,
  MoneyCell,
  StatusCell,
  reservationStatusTone,
} from "@/components/data-table/simple-table";
import {
  OccupancyTrendChart,
  RevenueBarChart,
  SourceMixChart,
  StatusDonutChart,
  RoomTypeOccupancyChart,
  type OccupancyPoint,
  type RevenuePoint,
} from "@/components/dashboard/dashboard-charts";
import { MiniMonthCalendar } from "@/components/dashboard/mini-month-calendar";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { formatMoney } from "@/lib/money";
import type { Money } from "@/lib/money";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { GuestModel } from "@/modules/guests/guest.model";
import { RoomModel, RoomTypeModel } from "@/modules/rooms/room.model";
import { FolioModel, FolioTransactionModel } from "@/modules/billing/billing.model";

type DashboardPageProps = {
  params: Promise<{ propertySlug: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "#0F766E",
  CHECKED_IN: "#173B57",
  CHECKED_OUT: "#64748B",
  OPTION: "#C89B5D",
  WAITLIST: "#B7791F",
  INQUIRY: "#8A5A12",
  CANCELLED: "#B91C1C",
  NO_SHOW: "#7F1D1D",
};

function staysOn(reservation: { arrivalDate: string; departureDate: string }, day: string) {
  return reservation.arrivalDate <= day && reservation.departureDate > day;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { propertySlug } = await params;
  const property = await getPropertyBySlug(propertySlug);
  const businessDate = businessDateToday(property?.timezone);
  const propertyName = propertyDisplayName(propertySlug, property?.name);

  if (!property) {
    return (
      <AppShell
        propertySlug={propertySlug}
        propertyName={propertyName}
        businessDate={businessDate}
        breadcrumb={["Overview", "Dashboard"]}
      >
        <PageHeader
          title="Hotel Command Center"
          description="Property not found. Configure MongoDB and run npm run seed."
        />
      </AppShell>
    );
  }

  const today = parseISO(businessDate);
  const windowStart = format(subDays(today, 14), "yyyy-MM-dd");
  const windowEnd = format(addDays(today, 14), "yyyy-MM-dd");
  const revenueStart = format(subDays(today, 13), "yyyy-MM-dd");
  const calendarMonthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const calendarMonthEnd = format(endOfMonth(today), "yyyy-MM-dd");

  const [
    windowReservations,
    monthReservations,
    calendarMonthBookings,
    rooms,
    roomTypes,
    transactions,
    openFolioAgg,
    upcoming,
  ] = await Promise.all([
    ReservationModel.find({
      propertyId: property._id,
      arrivalDate: { $lte: windowEnd },
      departureDate: { $gt: windowStart },
      status: { $in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
    })
      .select("arrivalDate departureDate status source totals rateSnapshot rooms")
      .lean(),
    ReservationModel.find({
      propertyId: property._id,
      arrivalDate: { $gte: format(subDays(today, 30), "yyyy-MM-dd"), $lte: windowEnd },
    })
      .select("status source")
      .lean(),
    ReservationModel.find({
      propertyId: property._id,
      arrivalDate: { $gte: calendarMonthStart, $lte: calendarMonthEnd },
      status: { $nin: ["CANCELLED", "NO_SHOW"] },
    })
      .select("arrivalDate")
      .lean(),
    RoomModel.find({ propertyId: property._id, status: "ACTIVE" })
      .select("roomTypeId frontOfficeStatus housekeepingStatus maintenanceStatus")
      .lean(),
    RoomTypeModel.find({ propertyId: property._id, status: "ACTIVE" }).sort({ code: 1 }).lean(),
    FolioTransactionModel.find({
      propertyId: property._id,
      businessDate: { $gte: revenueStart, $lte: businessDate },
    })
      .select("type amount businessDate description createdAt")
      .sort({ businessDate: -1, createdAt: -1 })
      .lean(),
    FolioModel.aggregate<{ total: number; count: number }>([
      { $match: { propertyId: property._id, status: "OPEN" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$balance.amountMinor" },
          count: { $sum: 1 },
        },
      },
    ]),
    ReservationModel.find({
      propertyId: property._id,
      arrivalDate: { $gte: businessDate },
      status: { $in: ["CONFIRMED", "OPTION"] },
    })
      .sort({ arrivalDate: 1 })
      .limit(8)
      .lean(),
  ]);

  const totalRooms = rooms.length;
  const currency = property.currency;

  // ---- Today counts
  const arrivalsToday = windowReservations.filter(
    (r) => r.arrivalDate === businessDate && r.status !== "CHECKED_OUT",
  ).length;
  const departuresToday = windowReservations.filter(
    (r) => r.departureDate === businessDate,
  ).length;
  const inHouseToday = windowReservations.filter(
    (r) => r.status === "CHECKED_IN",
  ).length;
  const occupiedTonight = windowReservations.filter((r) => staysOn(r, businessDate)).length;
  const occupancyPct = totalRooms
    ? Math.min(100, Math.round((occupiedTonight / totalRooms) * 100))
    : 0;

  // ---- Room ops
  const roomsReady = rooms.filter(
    (r) =>
      ["CLEAN", "INSPECTED"].includes(r.housekeepingStatus) && r.maintenanceStatus === "OK",
  ).length;
  const roomsDirty = rooms.filter((r) => r.housekeepingStatus === "DIRTY").length;
  const roomsPickup = rooms.filter((r) => r.housekeepingStatus === "PICKUP").length;
  const roomsOOO = rooms.filter((r) => r.maintenanceStatus !== "OK").length;

  // ---- Revenue estimates for tonight
  let roomRevenueTonightMinor = 0;
  for (const reservation of windowReservations) {
    if (!staysOn(reservation, businessDate)) continue;
    const roomsArr = (reservation.rooms ?? []) as Array<{
      nightlyMinor: number;
      quantity: number;
    }>;
    if (roomsArr.length > 0) {
      roomRevenueTonightMinor += roomsArr.reduce(
        (sum, r) => sum + r.nightlyMinor * r.quantity,
        0,
      );
    } else {
      const nightly = (reservation.rateSnapshot as { nightlyMinor?: number } | undefined)
        ?.nightlyMinor;
      roomRevenueTonightMinor += nightly ?? 0;
    }
  }
  const adrMinor = occupiedTonight ? Math.round(roomRevenueTonightMinor / occupiedTonight) : 0;
  const revparMinor = totalRooms ? Math.round(roomRevenueTonightMinor / totalRooms) : 0;

  // ---- Occupancy trend (−14d → +14d)
  const occupancyTrend: OccupancyPoint[] = [];
  for (let offset = -14; offset <= 14; offset += 1) {
    const date = format(addDays(today, offset), "yyyy-MM-dd");
    const occupied = windowReservations.filter((r) => staysOn(r, date)).length;
    occupancyTrend.push({
      date,
      label: format(addDays(today, offset), "dd MMM"),
      occupancy: totalRooms ? Math.min(100, Math.round((occupied / totalRooms) * 100)) : 0,
      rooms: occupied,
      isToday: offset === 0,
    });
  }

  // ---- Revenue last 14 days
  const revenueByDay = new Map<string, { payments: number; charges: number }>();
  for (let offset = 13; offset >= 0; offset -= 1) {
    revenueByDay.set(format(subDays(today, offset), "yyyy-MM-dd"), {
      payments: 0,
      charges: 0,
    });
  }
  let paymentsTodayMinor = 0;
  for (const txn of transactions) {
    const bucket = revenueByDay.get(txn.businessDate);
    if (!bucket) continue;
    const amount = (txn.amount as Money | undefined)?.amountMinor ?? 0;
    if (txn.type === "PAYMENT") {
      bucket.payments += amount;
      if (txn.businessDate === businessDate) paymentsTodayMinor += amount;
    } else if (txn.type === "CHARGE") {
      bucket.charges += amount;
    }
  }
  const revenueSeries: RevenuePoint[] = Array.from(revenueByDay.entries()).map(
    ([date, value]) => ({
      date,
      label: format(parseISO(date), "dd MMM"),
      payments: Math.round(value.payments / 100),
      charges: Math.round(value.charges / 100),
    }),
  );
  const payments14dMinor = Array.from(revenueByDay.values()).reduce(
    (sum, v) => sum + v.payments,
    0,
  );

  // ---- Status + source mix (last 30d arrivals window)
  const statusCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  for (const reservation of monthReservations) {
    statusCounts.set(reservation.status, (statusCounts.get(reservation.status) ?? 0) + 1);
    sourceCounts.set(reservation.source, (sourceCounts.get(reservation.source) ?? 0) + 1);
  }
  const statusSlices = Array.from(statusCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
      color: STATUS_COLORS[name] ?? "#94A3B8",
    }));
  const sourceSlices = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  // ---- Room type occupancy tonight
  const roomsByType = new Map<string, number>();
  for (const room of rooms) {
    const key = String(room.roomTypeId);
    roomsByType.set(key, (roomsByType.get(key) ?? 0) + 1);
  }
  const occupiedByTypeTonight = new Map<string, number>();
  for (const reservation of windowReservations) {
    if (!staysOn(reservation, businessDate)) continue;
    const code = (reservation.rateSnapshot as { roomTypeCode?: string } | undefined)
      ?.roomTypeCode;
    if (code) occupiedByTypeTonight.set(code, (occupiedByTypeTonight.get(code) ?? 0) + 1);
  }
  const roomTypeOccupancy = roomTypes.map((type) => {
    const total = roomsByType.get(String(type._id)) ?? type.baseInventory;
    const occupied = Math.min(total, occupiedByTypeTonight.get(type.code) ?? 0);
    return {
      name: type.code,
      occupied,
      available: Math.max(total - occupied, 0),
    };
  });

  // ---- Mini calendar: booking count per day (arrivals this month)
  const bookingsByDate: Record<string, number> = {};
  for (const reservation of calendarMonthBookings) {
    bookingsByDate[reservation.arrivalDate] =
      (bookingsByDate[reservation.arrivalDate] ?? 0) + 1;
  }

  // ---- Upcoming arrivals table
  const guestIds = upcoming.map((r) => r.guestId).filter(Boolean);
  const guests = await GuestModel.find({ _id: { $in: guestIds } }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));
  const upcomingRows = upcoming.map((reservation) => {
    const guest = reservation.guestId ? guestMap.get(String(reservation.guestId)) : undefined;
    const href = `/app/${propertySlug}/reservations/${reservation.publicId}`;
    return {
      confirmation: (
        <a href={href} className="font-semibold tabular text-primary hover:underline">
          {reservation.confirmationNumber}
        </a>
      ),
      guest: guest ? `${guest.firstName} ${guest.lastName}` : "—",
      stay: (
        <span className="tabular">
          {reservation.arrivalDate} → {reservation.departureDate}
        </span>
      ),
      status: (
        <StatusCell label={reservation.status} tone={reservationStatusTone(reservation.status)} />
      ),
      total: <MoneyCell value={reservation.totals?.total as Money | undefined} />,
    };
  });

  // ---- Recent payments list
  const recentPayments = transactions
    .filter((txn) => txn.type === "PAYMENT")
    .slice(0, 6)
    .map((txn) => ({
      description: txn.description,
      date: txn.businessDate,
      amount: txn.amount as Money | undefined,
    }));

  const openFolios = openFolioAgg[0] ?? { total: 0, count: 0 };

  const heroStats = [
    {
      label: "Occupancy tonight",
      value: `${occupancyPct}%`,
      sub: `${occupiedTonight} of ${totalRooms} rooms`,
      icon: MoonStar,
      trendUp: occupancyPct >= 60,
    },
    {
      label: "ADR",
      value: formatMoney({ amountMinor: adrMinor, currency }),
      sub: "Average daily rate",
      icon: HandCoins,
      trendUp: true,
    },
    {
      label: "RevPAR",
      value: formatMoney({ amountMinor: revparMinor, currency }),
      sub: "Revenue per available room",
      icon: Sparkles,
      trendUp: revparMinor > adrMinor / 2,
    },
    {
      label: "Collected (14d)",
      value: formatMoney({ amountMinor: payments14dMinor, currency }),
      sub: `${formatMoney({ amountMinor: paymentsTodayMinor, currency })} today`,
      icon: CalendarCheck,
      trendUp: true,
    },
  ];

  const opsCards = [
    {
      label: "Arrivals today",
      value: arrivalsToday,
      icon: DoorOpen,
      href: `/app/${propertySlug}/front-desk/arrivals`,
      tone: "text-teal",
      bg: "bg-teal/10",
    },
    {
      label: "Departures today",
      value: departuresToday,
      icon: ArrowUpRight,
      href: `/app/${propertySlug}/front-desk/departures`,
      tone: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "In house",
      value: inHouseToday,
      icon: BedDouble,
      href: `/app/${propertySlug}/front-desk/in-house`,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Rooms ready",
      value: roomsReady,
      icon: Sparkles,
      href: `/app/${propertySlug}/rooms/status`,
      tone: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Dirty / pickup",
      value: roomsDirty + roomsPickup,
      icon: Brush,
      href: `/app/${propertySlug}/housekeeping`,
      tone: "text-danger",
      bg: "bg-danger/10",
    },
    {
      label: "Out of order",
      value: roomsOOO,
      icon: Wrench,
      href: `/app/${propertySlug}/maintenance`,
      tone: "text-text-muted",
      bg: "bg-surface-subtle",
    },
  ];

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Overview", "Dashboard"]}
    >
      <PageHeader
        title="Hotel Command Center"
        description={`Live position for ${propertyName} · business date ${businessDate}.`}
        primaryAction={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/app/${propertySlug}/calendar`}
              className="rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-subtle"
            >
              Full calendar
            </Link>
            <Link
              href={`/app/${propertySlug}/reservations/new`}
              className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              New reservation
            </Link>
          </div>
        }
      />

      {/* Hero KPI band */}
      <div className="mt-6 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0B1420] via-[#132C44] to-[#173B57] shadow-[var(--shadow-float)]">
        <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
          {heroStats.map((stat) => (
            <div key={stat.label} className="px-6 py-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-nav-muted">
                  {stat.label}
                </p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-nav-active-accent">
                  <stat.icon className="h-4.5 w-4.5" aria-hidden />
                </span>
              </div>
              <p className="mt-3 font-[family-name:var(--font-cormorant)] text-[34px] leading-none font-semibold text-nav-text">
                {stat.value}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-nav-muted">
                {stat.trendUp ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-teal" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-warning" aria-hidden />
                )}
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Operational counts */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {opsCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-[16px] border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bg} ${card.tone}`}>
              <card.icon className="h-4.5 w-4.5" aria-hidden />
            </span>
            <p className="mt-3 text-2xl font-bold tabular text-text">{card.value}</p>
            <p className="mt-0.5 text-xs font-medium text-text-muted group-hover:text-primary">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Trend + revenue graphs */}
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <ModuleSection
          title="Occupancy trend"
          description="Past 14 days and the 14 nights ahead"
          action={<StatusBadge label={`Tonight ${occupancyPct}%`} tone="info" />}
        >
          <OccupancyTrendChart data={occupancyTrend} />
        </ModuleSection>
        <ModuleSection
          title="Charges vs payments"
          description="Folio activity across the last 14 business dates"
          action={
            <StatusBadge
              label={`Open balance ${formatMoney({ amountMinor: openFolios.total, currency })}`}
              tone="warning"
            />
          }
        >
          <RevenueBarChart data={revenueSeries} />
        </ModuleSection>
      </div>

      {/* Mix + calendar row */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <ModuleSection title="Booking status mix" description="Reservations arriving in the last 30 days onward">
          <StatusDonutChart data={statusSlices} />
          <div className="mt-2 flex flex-wrap gap-2">
            {statusSlices.slice(0, 5).map((slice) => (
              <span key={slice.name} className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: slice.color }} />
                {slice.name} · {slice.value}
              </span>
            ))}
          </div>
        </ModuleSection>

        <ModuleSection title="Booking sources" description="Where demand is coming from">
          <SourceMixChart data={sourceSlices} />
        </ModuleSection>

        <ModuleSection title="This month" description="Booking count shown on each day">
          <MiniMonthCalendar
            propertySlug={propertySlug}
            businessDate={businessDate}
            bookingsByDate={bookingsByDate}
          />
        </ModuleSection>
      </div>

      {/* Room types + housekeeping snapshot */}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ModuleSection title="Room type occupancy tonight" description="Occupied vs open rooms by category">
          <RoomTypeOccupancyChart data={roomTypeOccupancy} />
        </ModuleSection>

        <ModuleSection
          title="Recent payments"
          description="Latest folio settlements and deposits"
          action={
            <Link
              href={`/app/${propertySlug}/billing`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open billing
            </Link>
          }
        >
          {recentPayments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
              No payments recorded in the current window.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentPayments.map((payment, index) => (
                <li key={index} className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{payment.description}</p>
                    <p className="mt-0.5 text-xs tabular text-text-muted">{payment.date}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular text-success">
                    +{payment.amount ? formatMoney(payment.amount) : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ModuleSection>
      </div>

      {/* Upcoming arrivals */}
      <div className="mt-5">
        <ModuleSection
          title="Next arrivals"
          description="Confirmed and option stays due in soonest"
          action={
            <Link
              href={`/app/${propertySlug}/front-desk/arrivals`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Arrivals board
            </Link>
          }
        >
          <DataTable
            columns={[
              { key: "confirmation", header: "Confirmation" },
              { key: "guest", header: "Guest" },
              { key: "stay", header: "Stay" },
              { key: "status", header: "Status" },
              { key: "total", header: "Total", align: "right" },
            ]}
            rows={upcomingRows}
            emptyTitle="No upcoming arrivals"
            emptyDescription="Seed the database to populate the command center."
          />
        </ModuleSection>
      </div>
    </AppShell>
  );
}
