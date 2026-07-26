import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards, EmptyModuleState } from "@/components/module/module-ui";
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

const ISSUE_NOTES: Record<string, string[]> = {
  OUT_OF_ORDER: [
    "AC unit compressor fault reported by housekeeping",
    "Bathroom leak — plumbing team notified",
    "Electrical short in bedside panel",
    "Water heater not reaching temperature",
  ],
  OUT_OF_SERVICE: [
    "Scheduled deep-clean and repaint",
    "Furniture replacement pending delivery",
    "Carpet replacement in progress",
  ],
};

function pick(list: string[], seed: number) {
  return list[seed % list.length];
}

export default async function MaintenancePage({ params }: PageProps) {
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
        breadcrumb={["Rooms & Operations", "Maintenance"]}
      >
        <PageHeader title="Maintenance" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [rooms, roomTypes] = await Promise.all([
    RoomModel.find({ propertyId: property._id, status: "ACTIVE" }).lean(),
    RoomTypeModel.find({ propertyId: property._id }).lean(),
  ]);
  const typeMap = new Map(roomTypes.map((t) => [String(t._id), t]));

  const issues = rooms.filter((r) => r.maintenanceStatus !== "OK");
  const okCount = rooms.length - issues.length;
  const oooCount = rooms.filter((r) => r.maintenanceStatus === "OUT_OF_ORDER").length;
  const oosCount = rooms.filter((r) => r.maintenanceStatus === "OUT_OF_SERVICE").length;

  const cards = [
    { label: "In service (OK)", value: okCount, tone: "success" as const },
    { label: "Out of order", value: oooCount, tone: oooCount > 0 ? ("danger" as const) : ("default" as const) },
    { label: "Out of service", value: oosCount, tone: oosCount > 0 ? ("warning" as const) : ("default" as const) },
    { label: "Total rooms", value: rooms.length },
  ];

  const rows = issues.map((room, index) => {
    const type = typeMap.get(String(room.roomTypeId));
    const notes = ISSUE_NOTES[room.maintenanceStatus] ?? ["Engineering review pending"];
    return {
      number: <span className="font-semibold tabular">{room.number}</span>,
      floor: room.floor || "—",
      type: type?.code || "—",
      status: (
        <StatusCell
          label={room.maintenanceStatus}
          tone={room.maintenanceStatus === "OUT_OF_ORDER" ? "danger" : "warning"}
        />
      ),
      issue: <span className="text-text-muted">{pick(notes, index)}</span>,
      logged: <span className="tabular text-text-muted">{businessDate}</span>,
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Rooms & Operations", "Maintenance"]}
    >
      <PageHeader
        title="Maintenance"
        description={`Engineering tickets and out-of-order rooms as of ${businessDate}.`}
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Open issues</h2>
        {rows.length === 0 ? (
          <EmptyModuleState
            title="No open maintenance issues"
            description={`All ${rooms.length} rooms are in service (OK). Great work, engineering team.`}
          />
        ) : (
          <DataTable
            columns={[
              { key: "number", header: "Room" },
              { key: "floor", header: "Floor" },
              { key: "type", header: "Type" },
              { key: "status", header: "Status" },
              { key: "issue", header: "Issue" },
              { key: "logged", header: "Logged" },
            ]}
            rows={rows}
            emptyTitle="No open maintenance issues"
            emptyDescription="All rooms are currently in service."
          />
        )}
      </div>
    </AppShell>
  );
}
