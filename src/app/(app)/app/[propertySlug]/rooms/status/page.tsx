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

function foStatusTone(status: string) {
  if (status === "VACANT") return "success" as const;
  if (status === "OCCUPIED") return "info" as const;
  return "warning" as const;
}

function hkStatusTone(status: string) {
  if (status === "CLEAN" || status === "INSPECTED") return "success" as const;
  if (status === "PICKUP") return "warning" as const;
  return "danger" as const;
}

function maintStatusTone(status: string) {
  if (status === "OK") return "success" as const;
  if (status === "OUT_OF_SERVICE") return "warning" as const;
  return "danger" as const;
}

export default async function RoomStatusPage({ params }: PageProps) {
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
        breadcrumb={["Rooms & Operations", "Room Status"]}
      >
        <PageHeader title="Room status" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [rooms, roomTypes] = await Promise.all([
    RoomModel.find({ propertyId: property._id, status: "ACTIVE" })
      .sort({ number: 1 })
      .lean(),
    RoomTypeModel.find({ propertyId: property._id }).lean(),
  ]);

  const typeMap = new Map(roomTypes.map((t) => [String(t._id), t]));

  const counts = {
    vacant: 0,
    occupied: 0,
    reserved: 0,
    clean: 0,
    dirty: 0,
    ooo: 0,
  };
  for (const room of rooms) {
    if (room.frontOfficeStatus === "VACANT") counts.vacant += 1;
    if (room.frontOfficeStatus === "OCCUPIED") counts.occupied += 1;
    if (room.frontOfficeStatus === "RESERVED") counts.reserved += 1;
    if (room.housekeepingStatus === "CLEAN" || room.housekeepingStatus === "INSPECTED") {
      counts.clean += 1;
    }
    if (room.housekeepingStatus === "DIRTY" || room.housekeepingStatus === "PICKUP") {
      counts.dirty += 1;
    }
    if (room.maintenanceStatus !== "OK") counts.ooo += 1;
  }

  const cards = [
    { label: "Vacant", value: counts.vacant, tone: "success" as const },
    { label: "Occupied", value: counts.occupied, tone: "info" as const },
    { label: "Reserved", value: counts.reserved, tone: "warning" as const },
    { label: "Clean / dirty", value: `${counts.clean} / ${counts.dirty}` },
    { label: "Out of order or service", value: counts.ooo, tone: counts.ooo > 0 ? ("danger" as const) : ("default" as const) },
  ];

  const rows = rooms.map((room) => {
    const type = typeMap.get(String(room.roomTypeId));
    return {
      number: <span className="font-semibold tabular">{room.number}</span>,
      floor: room.floor || "—",
      type: type ? `${type.code} · ${type.name}` : "—",
      fo: <StatusCell label={room.frontOfficeStatus} tone={foStatusTone(room.frontOfficeStatus)} />,
      hk: <StatusCell label={room.housekeepingStatus} tone={hkStatusTone(room.housekeepingStatus)} />,
      maintenance: (
        <StatusCell label={room.maintenanceStatus} tone={maintStatusTone(room.maintenanceStatus)} />
      ),
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Rooms & Operations", "Room Status"]}
    >
      <PageHeader
        title="Room status"
        description={`Front-office, housekeeping, and maintenance state across ${rooms.length} rooms for ${businessDate}.`}
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
            { key: "maintenance", header: "Maintenance" },
          ]}
          rows={rows}
          emptyTitle="No rooms configured"
          emptyDescription="Run npm run seed to load the room inventory."
        />
      </div>
    </AppShell>
  );
}
