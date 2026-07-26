import { differenceInCalendarDays, parseISO } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards, ModuleSection } from "@/components/module/module-ui";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { RoomModel } from "@/modules/rooms/room.model";
import { FolioModel } from "@/modules/billing/billing.model";
import { formatMoney, money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function ReportsPage({ params }: PageProps) {
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
        breadcrumb={["Reports"]}
      >
        <PageHeader title="Reports" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const monthStart = `${businessDate.slice(0, 7)}-01`;
  const dayOfMonth = differenceInCalendarDays(parseISO(businessDate), parseISO(monthStart)) + 1;

  const [totalRooms, occupiedToday, arrivalsToday, inHouse, monthReservations, openFolioAgg] =
    await Promise.all([
      RoomModel.countDocuments({ propertyId: property._id, status: "ACTIVE" }),
      RoomModel.countDocuments({ propertyId: property._id, frontOfficeStatus: "OCCUPIED" }),
      ReservationModel.countDocuments({
        propertyId: property._id,
        arrivalDate: businessDate,
        status: { $in: ["CONFIRMED", "CHECKED_IN"] },
      }),
      ReservationModel.countDocuments({ propertyId: property._id, status: "CHECKED_IN" }),
      ReservationModel.find({
        propertyId: property._id,
        arrivalDate: { $gte: monthStart, $lte: businessDate },
        status: { $in: ["CHECKED_IN", "CHECKED_OUT"] },
      }).lean(),
      FolioModel.aggregate<{ total: number }>([
        { $match: { propertyId: property._id, status: "OPEN" } },
        { $group: { _id: null, total: { $sum: "$balance.amountMinor" } } },
      ]),
    ]);

  const occupancyToday = totalRooms > 0 ? Math.round((occupiedToday / totalRooms) * 100) : 0;

  let revenueMinor = 0;
  let roomNights = 0;
  for (const reservation of monthReservations) {
    revenueMinor += reservation.totals?.total?.amountMinor ?? 0;
    const nights = differenceInCalendarDays(
      parseISO(reservation.departureDate),
      parseISO(reservation.arrivalDate),
    );
    roomNights += Math.max(nights, 1);
  }
  const adrMinor = roomNights > 0 ? Math.round(revenueMinor / roomNights) : 0;
  const revparMinor =
    totalRooms > 0 && dayOfMonth > 0 ? Math.round(revenueMinor / (totalRooms * dayOfMonth)) : 0;
  const openFolioMinor = openFolioAgg[0]?.total ?? 0;

  const cards = [
    { label: "Occupancy today", value: `${occupancyToday}%`, tone: "info" as const },
    { label: "Arrivals today", value: arrivalsToday, tone: "success" as const },
    { label: "In house", value: inHouse, tone: "info" as const },
    {
      label: "Open folio balance",
      value: formatMoney(money(openFolioMinor, property.currency)),
      tone: openFolioMinor > 0 ? ("warning" as const) : ("success" as const),
    },
  ];

  const monthCards = [
    {
      label: "Month-to-date revenue",
      value: formatMoney(money(revenueMinor, property.currency)),
      tone: "success" as const,
    },
    {
      label: "ADR (average daily rate)",
      value: formatMoney(money(adrMinor, property.currency)),
      hint: `Across ${roomNights} room-nights`,
    },
    {
      label: "RevPAR",
      value: formatMoney(money(revparMinor, property.currency)),
      hint: `Across ${dayOfMonth} day(s) of ${businessDate.slice(0, 7)}`,
    },
    { label: "Stays counted", value: monthReservations.length },
  ];

  const links: Array<{ label: string; href: string; description: string }> = [
    { label: "Room status", href: "rooms/status", description: "Live front-office and housekeeping state." },
    { label: "Housekeeping", href: "housekeeping", description: "Room turnover priorities for today." },
    { label: "Folios & payments", href: "billing", description: "Open balances and settlement history." },
    { label: "Night audit", href: "night-audit", description: "Business-date close checklist." },
    { label: "Rates & inventory", href: "rates", description: "Sellable inventory and best available rates." },
    { label: "Groups", href: "groups", description: "Group blocks and rooming lists." },
  ];

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Reports"]}
    >
      <PageHeader
        title="Reports"
        description={`Operational and financial analytics for ${propertyName}, computed live from seeded stays and folios.`}
      />

      <div className="mt-6">
        <MetricCards items={cards} />
      </div>

      <div className="mt-8">
        <ModuleSection
          title="Month to date"
          description={`Revenue metrics for ${businessDate.slice(0, 7)}, day ${dayOfMonth}.`}
        >
          <MetricCards items={monthCards} />
        </ModuleSection>
      </div>

      <div className="mt-8">
        <ModuleSection title="Related modules" description="Jump to the operational area behind these numbers.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={`/app/${propertySlug}/${link.href}`}
                className="rounded-[12px] border border-border bg-background px-4 py-3.5 transition hover:border-primary/40 hover:bg-surface-subtle"
              >
                <p className="text-sm font-semibold text-text">{link.label}</p>
                <p className="mt-1 text-xs text-text-muted">{link.description}</p>
              </a>
            ))}
          </div>
        </ModuleSection>
      </div>
    </AppShell>
  );
}
