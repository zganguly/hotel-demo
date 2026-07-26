import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { RoomModel, RoomTypeModel } from "@/modules/rooms/room.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

const HK_PRIORITY: Record<string, number> = {
  DIRTY: 0,
  PICKUP: 1,
  CLEAN: 2,
  INSPECTED: 3,
};

function hkStatusTone(status: string) {
  if (status === "CLEAN" || status === "INSPECTED") return "success" as const;
  if (status === "PICKUP") return "warning" as const;
  return "danger" as const;
}

function foStatusTone(status: string) {
  if (status === "VACANT") return "success" as const;
  if (status === "OCCUPIED") return "info" as const;
  return "warning" as const;
}

function suggestedAction(hk: string, fo: string) {
  if (hk === "DIRTY" && fo === "VACANT") return "Clean now — sellable once done";
  if (hk === "DIRTY") return "Clean when guest is out";
  if (hk === "PICKUP") return "Touch-up / turn-down service";
  if (hk === "CLEAN") return "Awaiting inspection";
  return "Ready to sell";
}

export default async function HousekeepingPage({ params }: PageProps) {
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
        breadcrumb={["Rooms & Operations", "Housekeeping"]}
      >
        <PageHeader title="Housekeeping" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [rooms, roomTypes] = await Promise.all([
    RoomModel.find({ propertyId: property._id, status: "ACTIVE" }).lean(),
    RoomTypeModel.find({ propertyId: property._id }).lean(),
  ]);

  const typeMap = new Map(roomTypes.map((t) => [String(t._id), t]));

  const sorted = [...rooms].sort((a, b) => {
    const priorityDiff =
      (HK_PRIORITY[a.housekeepingStatus] ?? 9) - (HK_PRIORITY[b.housekeepingStatus] ?? 9);
    if (priorityDiff !== 0) return priorityDiff;
    return a.number.localeCompare(b.number);
  });

  const counts = { DIRTY: 0, PICKUP: 0, CLEAN: 0, INSPECTED: 0 };
  for (const room of rooms) {
    counts[room.housekeepingStatus as keyof typeof counts] =
      (counts[room.housekeepingStatus as keyof typeof counts] ?? 0) + 1;
  }

  const cards = [
    { label: "Dirty", value: counts.DIRTY, tone: counts.DIRTY > 0 ? ("danger" as const) : ("default" as const) },
    { label: "Pickup / touch-up", value: counts.PICKUP, tone: "warning" as const },
    { label: "Clean", value: counts.CLEAN, tone: "success" as const },
    { label: "Inspected", value: counts.INSPECTED, tone: "success" as const },
  ];

  const rows = sorted.map((room) => {
    const type = typeMap.get(String(room.roomTypeId));
    return {
      number: <span className="font-semibold tabular">{room.number}</span>,
      floor: room.floor || "—",
      type: type?.code || "—",
      fo: <StatusCell label={room.frontOfficeStatus} tone={foStatusTone(room.frontOfficeStatus)} />,
      hk: <StatusCell label={room.housekeepingStatus} tone={hkStatusTone(room.housekeepingStatus)} />,
      action: (
        <span className="text-text-muted">
          {suggestedAction(room.housekeepingStatus, room.frontOfficeStatus)}
        </span>
      ),
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Rooms & Operations", "Housekeeping"]}
    >
      <PageHeader
        title="Housekeeping"
        description={`Room turnover board for ${businessDate} — sorted by priority, dirty rooms first.`}
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "number", header: "Room" },
            { key: "floor", header: "Floor" },
            { key: "type", header: "Type" },
            { key: "fo", header: "Front office" },
            { key: "hk", header: "Housekeeping" },
            { key: "action", header: "Suggested action" },
          ]}
          rows={rows}
          emptyTitle="No rooms configured"
          emptyDescription="Run npm run seed to load the room inventory."
        />
      </div>
    </AppShell>
  );
}
