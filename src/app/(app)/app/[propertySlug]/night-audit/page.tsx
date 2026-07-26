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
import { RoomModel } from "@/modules/rooms/room.model";
import { FolioModel } from "@/modules/billing/billing.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function NightAuditPage({ params }: PageProps) {
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
        breadcrumb={["Finance", "Night Audit"]}
      >
        <PageHeader title="Night audit" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [
    arrivalsNotCheckedIn,
    departuresInHouse,
    openFoliosCount,
    dirtyOvernight,
    totalRoomsCount,
    unassignedNoShowCandidates,
  ] = await Promise.all([
    ReservationModel.countDocuments({
      propertyId: property._id,
      arrivalDate: businessDate,
      status: { $in: ["CONFIRMED", "OPTION"] },
    }),
    ReservationModel.countDocuments({
      propertyId: property._id,
      departureDate: businessDate,
      status: "CHECKED_IN",
    }),
    FolioModel.countDocuments({ propertyId: property._id, status: "OPEN" }),
    RoomModel.countDocuments({
      propertyId: property._id,
      housekeepingStatus: { $in: ["DIRTY", "PICKUP"] },
    }),
    RoomModel.countDocuments({ propertyId: property._id, status: "ACTIVE" }),
    ReservationModel.countDocuments({
      propertyId: property._id,
      arrivalDate: businessDate,
      status: "CONFIRMED",
    }),
  ]);

  const blockers = arrivalsNotCheckedIn > 0 || departuresInHouse > 0;

  const cards = [
    {
      label: "Arrivals not checked in",
      value: arrivalsNotCheckedIn,
      tone: arrivalsNotCheckedIn > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      label: "Departures still in-house",
      value: departuresInHouse,
      tone: departuresInHouse > 0 ? ("warning" as const) : ("success" as const),
    },
    { label: "Open folios", value: openFoliosCount, tone: "info" as const },
    {
      label: "Rooms dirty overnight",
      value: dirtyOvernight,
      tone: dirtyOvernight > 0 ? ("warning" as const) : ("success" as const),
    },
  ];

  type ChecklistRow = {
    step: string;
    detail: string;
    status: "success" | "warning" | "danger" | "info" | "neutral";
    statusLabel: string;
  };

  const checklist: ChecklistRow[] = [
    {
      step: "Post room & tax charges",
      detail: `Automatic nightly posting for ${totalRoomsCount - arrivalsNotCheckedIn} occupied room accounts.`,
      status: "success",
      statusLabel: "Ready",
    },
    {
      step: "Resolve unarrived reservations",
      detail: `${arrivalsNotCheckedIn} confirmed arrival(s) for ${businessDate} have not checked in yet.`,
      status: arrivalsNotCheckedIn > 0 ? "warning" : "success",
      statusLabel: arrivalsNotCheckedIn > 0 ? "Action needed" : "Clear",
    },
    {
      step: "Resolve pending departures",
      detail: `${departuresInHouse} reservation(s) due out today are still checked in.`,
      status: departuresInHouse > 0 ? "warning" : "success",
      statusLabel: departuresInHouse > 0 ? "Action needed" : "Clear",
    },
    {
      step: "Review open folio balances",
      detail: `${openFoliosCount} open folio(s) require settlement or carry-forward.`,
      status: openFoliosCount > 0 ? "info" : "success",
      statusLabel: openFoliosCount > 0 ? "Review" : "Clear",
    },
    {
      step: "Confirm housekeeping close-out",
      detail: `${dirtyOvernight} room(s) remain dirty or pending pickup overnight.`,
      status: dirtyOvernight > 0 ? "warning" : "success",
      statusLabel: dirtyOvernight > 0 ? "Follow up" : "Clear",
    },
    {
      step: "Mark unarrived reservations as no-show",
      detail: `${unassignedNoShowCandidates} confirmed booking(s) with no activity are eligible for no-show marking.`,
      status: unassignedNoShowCandidates > 0 ? "info" : "success",
      statusLabel: unassignedNoShowCandidates > 0 ? "Review" : "Clear",
    },
    {
      step: "Roll business date forward",
      detail: blockers
        ? "Blocked until arrivals and departures above are resolved."
        : `Ready to advance business date past ${businessDate}.`,
      status: blockers ? "danger" : "success",
      statusLabel: blockers ? "Blocked" : "Ready",
    },
  ];

  const rows = checklist.map((item) => ({
    step: <span className="font-semibold text-text">{item.step}</span>,
    detail: <span className="text-text-muted">{item.detail}</span>,
    status: <StatusCell label={item.statusLabel} tone={item.status} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Finance", "Night Audit"]}
    >
      <PageHeader
        title="Night audit"
        description={`Business-date close checklist and pre-audit blockers for ${businessDate}.`}
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Close-out checklist</h2>
        <DataTable
          columns={[
            { key: "step", header: "Step" },
            { key: "detail", header: "Detail" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="Checklist unavailable"
          emptyDescription="No audit steps could be computed."
        />
      </div>
    </AppShell>
  );
}
