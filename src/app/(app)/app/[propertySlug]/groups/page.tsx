import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, MoneyCell, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { sumMoney, type Money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

const GROUP_NAMES = [
  "Bengal Chamber of Commerce Summit",
  "Sharma–Iyer Wedding Party",
  "TechConnect Annual Offsite",
  "Coastal Traders Association",
  "Kapoor Family Reunion",
];

export default async function GroupsPage({ params }: PageProps) {
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
        breadcrumb={["Reservations", "Groups"]}
      >
        <PageHeader title="Groups" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const explicitGroupReservations = await ReservationModel.find({
    propertyId: property._id,
    $or: [{ source: "GROUP" }, { groupId: { $exists: true, $ne: null } }],
  }).lean();

  const upcoming = await ReservationModel.find({
    propertyId: property._id,
    arrivalDate: { $gte: businessDate },
    status: { $in: ["CONFIRMED", "OPTION", "CHECKED_IN"] },
  })
    .sort({ arrivalDate: 1 })
    .limit(200)
    .lean();

  const byArrivalDate = new Map<string, typeof upcoming>();
  for (const reservation of upcoming) {
    const list = byArrivalDate.get(reservation.arrivalDate) ?? [];
    list.push(reservation);
    byArrivalDate.set(reservation.arrivalDate, list);
  }

  const demoBlocks = [...byArrivalDate.entries()]
    .filter(([, list]) => list.length >= 3)
    .slice(0, GROUP_NAMES.length)
    .map(([arrivalDate, list], index) => {
      const departureDate = list.reduce(
        (max, r) => (r.departureDate > max ? r.departureDate : max),
        list[0]!.departureDate,
      );
      const total = sumMoney(
        list.map((r) => (r.totals?.total as Money | undefined) ?? { amountMinor: 0, currency: property.currency }),
        property.currency,
      );
      return {
        name: GROUP_NAMES[index]!,
        arrivalDate,
        departureDate,
        rooms: list.length,
        status: index === 0 ? "CONFIRMED" : index === 1 ? "OPTION" : "CONFIRMED",
        total,
      };
    });

  const cards = [
    { label: "Active group blocks", value: demoBlocks.length + explicitGroupReservations.length, tone: "info" as const },
    {
      label: "Rooms in group blocks",
      value: demoBlocks.reduce((sum, b) => sum + b.rooms, 0) + explicitGroupReservations.length,
    },
    { label: "Confirmed blocks", value: demoBlocks.filter((b) => b.status === "CONFIRMED").length, tone: "success" as const },
    { label: "Tentative blocks", value: demoBlocks.filter((b) => b.status === "OPTION").length, tone: "warning" as const },
  ];

  const rows = [
    ...explicitGroupReservations.map((r) => ({
      name: <span className="font-semibold text-text">Group booking · {r.confirmationNumber}</span>,
      stay: (
        <span className="tabular">
          {r.arrivalDate} → {r.departureDate}
        </span>
      ),
      rooms: <span className="tabular">1</span>,
      status: <StatusCell label={r.status} tone="info" />,
      total: <MoneyCell value={r.totals?.total as Money | undefined} />,
    })),
    ...demoBlocks.map((block) => ({
      name: <span className="font-semibold text-text">{block.name}</span>,
      stay: (
        <span className="tabular">
          {block.arrivalDate} → {block.departureDate}
        </span>
      ),
      rooms: <span className="tabular">{block.rooms} rooms</span>,
      status: (
        <StatusCell label={block.status} tone={block.status === "CONFIRMED" ? "success" : "warning"} />
      ),
      total: <MoneyCell value={block.total} />,
    })),
  ];

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Reservations", "Groups"]}
    >
      <PageHeader
        title="Groups"
        description="Group blocks, allotments, and rooming lists derived from upcoming demand clusters."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "name", header: "Group / block" },
            { key: "stay", header: "Stay" },
            { key: "rooms", header: "Rooms" },
            { key: "status", header: "Status" },
            { key: "total", header: "Block value", align: "right" },
          ]}
          rows={rows}
          emptyTitle="No group blocks"
          emptyDescription="No upcoming demand clusters large enough to form a group block yet."
        />
      </div>
    </AppShell>
  );
}
