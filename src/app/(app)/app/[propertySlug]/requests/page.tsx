import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { GuestModel } from "@/modules/guests/guest.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

type RequestRow = {
  guest: string;
  reference: string;
  request: string;
  priority: "success" | "warning" | "danger" | "info" | "neutral";
  priorityLabel: string;
  status: "success" | "warning" | "danger" | "info" | "neutral";
  statusLabel: string;
};

const DEMO_REQUESTS: RequestRow[] = [
  {
    guest: "Front desk (walk-up)",
    reference: "Lobby",
    request: "Extra towels for room 214",
    priority: "info",
    priorityLabel: "Normal",
    status: "warning",
    statusLabel: "In progress",
  },
  {
    guest: "Housekeeping team",
    reference: "Floor 3",
    request: "Guest reported noisy AC unit",
    priority: "warning",
    priorityLabel: "High",
    status: "info",
    statusLabel: "Assigned",
  },
  {
    guest: "Concierge",
    reference: "Lobby",
    request: "Airport pickup confirmation needed",
    priority: "danger",
    priorityLabel: "Urgent",
    status: "warning",
    statusLabel: "Pending",
  },
];

export default async function RequestsPage({ params }: PageProps) {
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
        breadcrumb={["Rooms & Operations", "Guest Requests"]}
      >
        <PageHeader title="Guest requests" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const reservations = await ReservationModel.find({
    propertyId: property._id,
    status: { $in: ["CHECKED_IN", "CONFIRMED"] },
    specialRequests: { $exists: true, $not: { $size: 0 } },
  })
    .sort({ arrivalDate: 1 })
    .limit(60)
    .lean();

  const guests = await GuestModel.find({
    _id: { $in: reservations.map((r) => r.guestId).filter(Boolean) },
  }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));

  const derivedRows: RequestRow[] = reservations.flatMap((reservation) => {
    const guest = reservation.guestId ? guestMap.get(String(reservation.guestId)) : undefined;
    const guestName = guest ? `${guest.firstName} ${guest.lastName}` : "Guest";
    return (reservation.specialRequests ?? []).map((request: string) => ({
      guest: guestName,
      reference: reservation.confirmationNumber,
      request,
      priority: reservation.status === "CHECKED_IN" ? ("warning" as const) : ("info" as const),
      priorityLabel: reservation.status === "CHECKED_IN" ? "High" : "Normal",
      status: reservation.status === "CHECKED_IN" ? ("info" as const) : ("neutral" as const),
      statusLabel: reservation.status === "CHECKED_IN" ? "Open — guest in house" : "Noted at booking",
    }));
  });

  const allRows = [...derivedRows.slice(0, 30), ...DEMO_REQUESTS];

  const openCount = allRows.filter((r) => r.statusLabel !== "Resolved").length;
  const urgentCount = allRows.filter((r) => r.priorityLabel === "Urgent").length;
  const highCount = allRows.filter((r) => r.priorityLabel === "High").length;

  const cards = [
    { label: "Open requests", value: allRows.length, tone: "info" as const },
    { label: "Urgent", value: urgentCount, tone: urgentCount > 0 ? ("danger" as const) : ("default" as const) },
    { label: "High priority", value: highCount, tone: "warning" as const },
    { label: "Awaiting action", value: openCount, tone: "warning" as const },
  ];

  const rows = allRows.map((row) => ({
    guest: row.guest,
    reference: <span className="tabular text-text-muted">{row.reference}</span>,
    request: row.request,
    priority: <StatusCell label={row.priorityLabel} tone={row.priority} />,
    status: <StatusCell label={row.statusLabel} tone={row.status} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Rooms & Operations", "Guest Requests"]}
    >
      <PageHeader
        title="Guest requests"
        description="Service recovery, complaints, and requests derived from in-house and confirmed stays."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "guest", header: "Guest" },
            { key: "reference", header: "Room / confirmation" },
            { key: "request", header: "Request" },
            { key: "priority", header: "Priority" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No open requests"
          emptyDescription="No special requests found on current reservations."
        />
      </div>
    </AppShell>
  );
}
