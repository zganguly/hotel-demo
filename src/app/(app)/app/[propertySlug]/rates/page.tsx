import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, MoneyCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import {
  RoomInventoryDayModel,
  RoomModel,
  RoomTypeModel,
  sellableRemaining,
} from "@/modules/rooms/room.model";
import { money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

const RATE_BY_CODE: Record<string, number> = {
  STD: 65000,
  DLX: 95000,
  SUITE: 185000,
};

export default async function RatesPage({ params }: PageProps) {
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
        breadcrumb={["Revenue", "Rates & Inventory"]}
      >
        <PageHeader title="Rates & inventory" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [roomTypes, inventoryDays, rooms] = await Promise.all([
    RoomTypeModel.find({ propertyId: property._id, status: "ACTIVE" }).sort({ code: 1 }).lean(),
    RoomInventoryDayModel.find({ propertyId: property._id, date: businessDate }).lean(),
    RoomModel.find({ propertyId: property._id, status: "ACTIVE" }).lean(),
  ]);

  const inventoryMap = new Map(inventoryDays.map((d) => [String(d.roomTypeId), d]));
  const roomCountByType = new Map<string, number>();
  const occupiedByType = new Map<string, number>();
  for (const room of rooms) {
    const key = String(room.roomTypeId);
    roomCountByType.set(key, (roomCountByType.get(key) ?? 0) + 1);
    if (room.frontOfficeStatus === "OCCUPIED") {
      occupiedByType.set(key, (occupiedByType.get(key) ?? 0) + 1);
    }
  }

  let totalPhysical = 0;
  let totalSellable = 0;

  const rows = roomTypes.map((type) => {
    const day = inventoryMap.get(String(type._id));
    const physical = day?.physicalTotal ?? type.baseInventory;
    const occupied = occupiedByType.get(String(type._id)) ?? 0;
    const sellable = day
      ? sellableRemaining(day)
      : Math.max(physical - occupied, 0);
    totalPhysical += physical;
    totalSellable += Math.max(sellable, 0);
    const nightly = RATE_BY_CODE[type.code] ?? 65000;

    return {
      code: <span className="font-semibold tabular">{type.code}</span>,
      name: type.name,
      base: <span className="tabular">{physical}</span>,
      confirmed: <span className="tabular">{day?.confirmed ?? occupied}</span>,
      sellable: (
        <span className={`tabular font-semibold ${sellable <= 2 ? "text-warning" : "text-success"}`}>
          {Math.max(sellable, 0)}
        </span>
      ),
      rate: <MoneyCell value={money(nightly, property.currency)} />,
    };
  });

  const cards = [
    { label: "Room types", value: roomTypes.length },
    { label: "Physical inventory", value: totalPhysical },
    { label: "Sellable today", value: totalSellable, tone: "success" as const },
    { label: "Business date", value: businessDate, tone: "info" as const },
  ];

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Revenue", "Rates & Inventory"]}
    >
      <PageHeader
        title="Rates & inventory"
        description={`Rate plans, base inventory, and sellable rooms remaining for ${businessDate}.`}
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "code", header: "Type" },
            { key: "name", header: "Name" },
            { key: "base", header: "Base inventory", align: "right" },
            { key: "confirmed", header: "Confirmed", align: "right" },
            { key: "sellable", header: "Sellable remaining", align: "right" },
            { key: "rate", header: "Best available rate", align: "right" },
          ]}
          rows={rows}
          emptyTitle="No room types configured"
          emptyDescription="Run npm run seed to load room types and inventory."
        />
      </div>
    </AppShell>
  );
}
