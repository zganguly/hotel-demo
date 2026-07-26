import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, MoneyCell, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { FolioModel } from "@/modules/billing/billing.model";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { GuestModel } from "@/modules/guests/guest.model";
import type { Money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function AccountsReceivablePage({ params }: PageProps) {
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
        breadcrumb={["Finance", "Accounts Receivable"]}
      >
        <PageHeader title="Accounts receivable" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const openFolios = await FolioModel.find({
    propertyId: property._id,
    status: "OPEN",
    "balance.amountMinor": { $gt: 0 },
  })
    .sort({ "balance.amountMinor": -1 })
    .limit(50)
    .lean();

  const [reservations, guests, totalAgg] = await Promise.all([
    ReservationModel.find({ _id: { $in: openFolios.map((f) => f.reservationId) } }).lean(),
    GuestModel.find({ _id: { $in: openFolios.map((f) => f.guestId).filter(Boolean) } }).lean(),
    FolioModel.aggregate<{ total: number; count: number }>([
      { $match: { propertyId: property._id, status: "OPEN" } },
      { $group: { _id: null, total: { $sum: "$balance.amountMinor" }, count: { $sum: 1 } } },
    ]),
  ]);

  const reservationMap = new Map(reservations.map((r) => [String(r._id), r]));
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));
  const totalOutstanding = totalAgg[0]?.total ?? 0;
  const totalOpen = totalAgg[0]?.count ?? 0;

  const overdueCutoff = businessDate;
  const overdue = openFolios.filter((f) => {
    const reservation = reservationMap.get(String(f.reservationId));
    return reservation && reservation.departureDate < overdueCutoff;
  });

  const cards = [
    { label: "Open folios with balance", value: openFolios.length, tone: "info" as const },
    {
      label: "Total outstanding",
      value: new Intl.NumberFormat("en-IN", { style: "currency", currency: property.currency }).format(
        totalOutstanding / 100,
      ),
      tone: totalOutstanding > 0 ? ("warning" as const) : ("success" as const),
    },
    { label: "Past checkout, unpaid", value: overdue.length, tone: overdue.length > 0 ? ("danger" as const) : ("default" as const) },
    { label: "All open folios", value: totalOpen },
  ];

  const rows = openFolios.map((folio) => {
    const reservation = reservationMap.get(String(folio.reservationId));
    const guest = folio.guestId ? guestMap.get(String(folio.guestId)) : undefined;
    const isOverdue = reservation ? reservation.departureDate < overdueCutoff : false;
    return {
      folio: <span className="font-semibold tabular">{folio.publicId.slice(0, 8).toUpperCase()}</span>,
      guest: guest ? `${guest.firstName} ${guest.lastName}` : "—",
      reservation: reservation?.confirmationNumber || "—",
      departure: <span className="tabular text-text-muted">{reservation?.departureDate || "—"}</span>,
      balance: <MoneyCell value={folio.balance as Money | undefined} />,
      status: (
        <StatusCell label={isOverdue ? "Overdue" : "Current"} tone={isOverdue ? "danger" : "warning"} />
      ),
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Finance", "Accounts Receivable"]}
    >
      <PageHeader
        title="Accounts receivable"
        description="Open folio balances awaiting settlement, ranked by amount outstanding."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "folio", header: "Folio" },
            { key: "guest", header: "Guest" },
            { key: "reservation", header: "Reservation" },
            { key: "departure", header: "Departure" },
            { key: "balance", header: "Balance", align: "right" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No outstanding balances"
          emptyDescription="All open folios currently have a zero balance."
        />
      </div>
    </AppShell>
  );
}
