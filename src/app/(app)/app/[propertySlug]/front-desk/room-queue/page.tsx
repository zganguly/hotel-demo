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
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { GuestModel } from "@/modules/guests/guest.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function RoomQueuePage({ params }: PageProps) {
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
        breadcrumb={["Front Desk", "Room Queue"]}
      >
        <PageHeader title="Room queue" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [pendingRooms, roomTypes, arrivals] = await Promise.all([
    RoomModel.find({
      propertyId: property._id,
      housekeepingStatus: { $in: ["DIRTY", "PICKUP"] },
    })
      .sort({ housekeepingStatus: 1, number: 1 })
      .lean(),
    RoomTypeModel.find({ propertyId: property._id }).lean(),
    ReservationModel.find({
      propertyId: property._id,
      arrivalDate: businessDate,
      status: { $in: ["CONFIRMED", "CHECKED_IN"] },
    })
      .sort({ confirmationNumber: 1 })
      .lean(),
  ]);

  const typeMap = new Map(roomTypes.map((t) => [String(t._id), t]));
  const guests = await GuestModel.find({
    _id: { $in: arrivals.map((r) => r.guestId).filter(Boolean) },
  }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));

  const waitingArrivals = arrivals.filter((r) => r.status === "CONFIRMED");
  const dirty = pendingRooms.filter((r) => r.housekeepingStatus === "DIRTY").length;
  const pickup = pendingRooms.filter((r) => r.housekeepingStatus === "PICKUP").length;

  const cards = [
    { label: "Rooms needing turnover", value: pendingRooms.length, tone: pendingRooms.length > 0 ? ("warning" as const) : ("success" as const) },
    { label: "Dirty", value: dirty, tone: dirty > 0 ? ("danger" as const) : ("default" as const) },
    { label: "Pickup / touch-up", value: pickup, tone: "warning" as const },
    { label: "Arrivals awaiting a room", value: waitingArrivals.length, tone: "info" as const },
  ];

  const roomRows = pendingRooms.map((room) => {
    const type = typeMap.get(String(room.roomTypeId));
    return {
      number: <span className="font-semibold tabular">{room.number}</span>,
      floor: room.floor || "—",
      type: type?.code || "—",
      status: (
        <StatusCell
          label={room.housekeepingStatus}
          tone={room.housekeepingStatus === "DIRTY" ? "danger" : "warning"}
        />
      ),
      priority: (
        <span className="text-text-muted">
          {room.housekeepingStatus === "DIRTY" ? "Assign to housekeeping now" : "Quick touch-up"}
        </span>
      ),
    };
  });

  const arrivalRows = waitingArrivals.map((reservation) => {
    const guest = reservation.guestId ? guestMap.get(String(reservation.guestId)) : undefined;
    return {
      confirmation: <span className="font-semibold tabular">{reservation.confirmationNumber}</span>,
      guest: guest ? `${guest.firstName} ${guest.lastName}` : "—",
      eta: <span className="text-text-muted">Due-in {businessDate}</span>,
      status: <StatusCell label="Awaiting room assignment" tone="info" />,
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Front Desk", "Room Queue"]}
    >
      <PageHeader
        title="Room queue"
        description="Rooms pending turnover and today's arrivals still needing a room assignment."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Rooms pending turnover</h2>
        <DataTable
          columns={[
            { key: "number", header: "Room" },
            { key: "floor", header: "Floor" },
            { key: "type", header: "Type" },
            { key: "status", header: "Housekeeping" },
            { key: "priority", header: "Next action" },
          ]}
          rows={roomRows}
          emptyTitle="No rooms pending turnover"
          emptyDescription="All rooms are clean or inspected."
        />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Arrivals needing a room</h2>
        <DataTable
          columns={[
            { key: "confirmation", header: "Confirmation" },
            { key: "guest", header: "Guest" },
            { key: "eta", header: "ETA" },
            { key: "status", header: "Status" },
          ]}
          rows={arrivalRows}
          emptyTitle="No arrivals waiting"
          emptyDescription="Every due-in reservation already has a room assigned."
        />
      </div>
    </AppShell>
  );
}
