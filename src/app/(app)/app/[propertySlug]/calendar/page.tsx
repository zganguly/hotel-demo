import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ReservationMonthCalendar } from "@/components/reservations/month-calendar";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { GuestModel } from "@/modules/guests/guest.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
  searchParams: Promise<{ month?: string }>;
};

const MONTH_RE = /^\d{4}-\d{2}$/;

function resolveMonth(value: string | undefined, businessDate: string) {
  if (value && MONTH_RE.test(value)) {
    const parsed = parseISO(`${value}-01`);
    if (!Number.isNaN(parsed.getTime())) return value;
  }
  return businessDate.slice(0, 7);
}

export default async function ReservationCalendarPage({ params, searchParams }: PageProps) {
  const { propertySlug } = await params;
  const query = await searchParams;
  const property = await getPropertyBySlug(propertySlug);
  const businessDate = businessDateToday(property?.timezone);
  const propertyName = propertyDisplayName(propertySlug, property?.name);
  const month = resolveMonth(query.month, businessDate);

  if (!property) {
    return (
      <AppShell
        propertySlug={propertySlug}
        propertyName={propertyName}
        businessDate={businessDate}
        breadcrumb={["Reservations", "Full Calendar"]}
      >
        <PageHeader title="Full Calendar" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const monthStart = startOfMonth(parseISO(`${month}-01`));
  const monthEnd = endOfMonth(monthStart);
  const from = format(monthStart, "yyyy-MM-dd");
  const to = format(monthEnd, "yyyy-MM-dd");

  const reservations = await ReservationModel.find({
    propertyId: property._id,
    arrivalDate: { $lte: to },
    departureDate: { $gt: from },
    status: { $nin: ["CANCELLED"] },
  })
    .sort({ arrivalDate: 1 })
    .lean();

  const guestIds = reservations.map((r) => r.guestId).filter(Boolean);
  const guests = await GuestModel.find({ _id: { $in: guestIds } }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));

  const calendarRows = reservations.map((reservation) => {
    const guest = reservation.guestId ? guestMap.get(String(reservation.guestId)) : undefined;
    return {
      publicId: reservation.publicId,
      confirmationNumber: reservation.confirmationNumber,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : "Guest",
      arrivalDate: reservation.arrivalDate,
      departureDate: reservation.departureDate,
      status: reservation.status,
      source: reservation.source,
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Reservations", "Full Calendar"]}
    >
      <PageHeader
        title="Full Calendar"
        description="Month-by-month reservation view. Navigate one month at a time to review arrivals, in-house stays, and departures."
        primaryAction={
          <a
            href={`/app/${propertySlug}/reservations/new`}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            New reservation
          </a>
        }
      />
      <div className="mt-6">
        <ReservationMonthCalendar
          propertySlug={propertySlug}
          month={month}
          businessDate={businessDate}
          reservations={calendarRows}
        />
      </div>
    </AppShell>
  );
}
