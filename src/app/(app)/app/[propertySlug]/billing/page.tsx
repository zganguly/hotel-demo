import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  MoneyCell,
  StatusCell,
  folioStatusTone,
} from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { FolioModel, FolioTransactionModel } from "@/modules/billing/billing.model";
import { GuestModel } from "@/modules/guests/guest.model";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { formatMoney, type Money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function BillingPage({ params }: PageProps) {
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
        breadcrumb={["Finance"]}
      >
        <PageHeader title="Folios & payments" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const folios = await FolioModel.find({ propertyId: property._id })
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();

  const guestIds = folios.map((f) => f.guestId).filter(Boolean);
  const reservationIds = folios.map((f) => f.reservationId);
  const [guests, reservations, recentTxns, openBalance] = await Promise.all([
    GuestModel.find({ _id: { $in: guestIds } }).lean(),
    ReservationModel.find({ _id: { $in: reservationIds } }).lean(),
    FolioTransactionModel.find({ propertyId: property._id })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean(),
    FolioModel.aggregate<{ total: number }>([
      { $match: { propertyId: property._id, status: "OPEN" } },
      { $group: { _id: null, total: { $sum: "$balance.amountMinor" } } },
    ]),
  ]);

  const guestMap = new Map(guests.map((g) => [String(g._id), g]));
  const reservationMap = new Map(reservations.map((r) => [String(r._id), r]));

  const folioRows = folios.map((folio) => {
    const guest = folio.guestId ? guestMap.get(String(folio.guestId)) : undefined;
    const reservation = reservationMap.get(String(folio.reservationId));
    const href = reservation
      ? `/app/${propertySlug}/reservations/${reservation.publicId}`
      : undefined;
    return {
      folio: <span className="font-semibold tabular">{folio.publicId.slice(0, 8).toUpperCase()}</span>,
      guest: guest ? `${guest.firstName} ${guest.lastName}` : "—",
      reservation: href ? (
        <a href={href} className="font-semibold tabular text-primary hover:underline">
          {reservation?.confirmationNumber}
        </a>
      ) : (
        "—"
      ),
      status: <StatusCell label={folio.status} tone={folioStatusTone(folio.status)} />,
      balance: <MoneyCell value={folio.balance as Money | undefined} />,
      stay: reservation ? (
        <span className="tabular">
          {reservation.arrivalDate} → {reservation.departureDate}
        </span>
      ) : (
        "—"
      ),
    };
  });

  const txnRows = recentTxns.map((txn) => ({
    date: <span className="tabular">{txn.businessDate}</span>,
    type: <StatusCell label={txn.type} tone={txn.type === "PAYMENT" ? "success" : "info"} />,
    description: txn.description,
    amount: <MoneyCell value={txn.amount as Money | undefined} />,
  }));

  const openMinor = openBalance[0]?.total ?? 0;

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Finance", "Folios & Payments"]}
    >
      <PageHeader
        title="Folios & payments"
        description="Historical settlements and open balances from the demo ledger."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm text-text-muted">Folios loaded</p>
          <p className="mt-2 text-3xl font-bold tabular">{folios.length}</p>
        </div>
        <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm text-text-muted">Open folio balance</p>
          <p className="mt-2 text-3xl font-bold tabular">
            {formatMoney({ amountMinor: openMinor, currency: property.currency })}
          </p>
        </div>
        <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm text-text-muted">Recent ledger lines</p>
          <p className="mt-2 text-3xl font-bold tabular">{recentTxns.length}</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Folios</h2>
        <DataTable
          columns={[
            { key: "folio", header: "Folio" },
            { key: "guest", header: "Guest" },
            { key: "reservation", header: "Reservation" },
            { key: "stay", header: "Stay" },
            { key: "status", header: "Status" },
            { key: "balance", header: "Balance", align: "right" },
          ]}
          rows={folioRows}
          emptyTitle="No folios"
          emptyDescription="Run npm run seed to load billing history."
        />
      </div>

      <div className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-text">Recent charges & payments</h2>
        <DataTable
          columns={[
            { key: "date", header: "Business date" },
            { key: "type", header: "Type" },
            { key: "description", header: "Description" },
            { key: "amount", header: "Amount", align: "right" },
          ]}
          rows={txnRows}
          emptyTitle="No transactions"
          emptyDescription="Run npm run seed to load folio history."
        />
      </div>
    </AppShell>
  );
}
