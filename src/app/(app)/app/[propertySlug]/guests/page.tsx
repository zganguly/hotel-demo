import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  StatusCell,
} from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { GuestModel } from "@/modules/guests/guest.model";
import { ReservationModel } from "@/modules/reservations/reservation.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function GuestsPage({ params }: PageProps) {
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
        breadcrumb={["Guests"]}
      >
        <PageHeader title="Guest profiles" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const guests = await GuestModel.find({ propertyId: property._id })
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  const stayCounts = await ReservationModel.aggregate<{ _id: unknown; count: number }>([
    { $match: { propertyId: property._id } },
    { $group: { _id: "$guestId", count: { $sum: 1 } } },
  ]);
  const stayMap = new Map(stayCounts.map((row) => [String(row._id), row.count]));

  const rows = guests.map((guest) => ({
    name: (
      <div>
        <p className="font-semibold text-text">
          {guest.firstName} {guest.lastName}
        </p>
        {guest.vip ? <StatusCell label="VIP" tone="premium" /> : null}
      </div>
    ),
    email: <span className="text-text-muted">{guest.email || "—"}</span>,
    phone: <span className="tabular">{guest.phone || "—"}</span>,
    nationality: guest.nationality || "—",
    stays: <span className="tabular">{stayMap.get(String(guest._id)) ?? 0}</span>,
    notes: <span className="line-clamp-2 max-w-xs text-text-muted">{guest.notes || "—"}</span>,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Guests & Accounts", "Guest Profiles"]}
    >
      <PageHeader
        title="Guest profiles"
        description={`${guests.length} demo guest profiles with contact details and stay notes.`}
      />
      <div className="mt-6">
        <DataTable
          columns={[
            { key: "name", header: "Guest" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            { key: "nationality", header: "Market" },
            { key: "stays", header: "Stays", align: "right" },
            { key: "notes", header: "Notes" },
          ]}
          rows={rows}
          emptyTitle="No guests"
          emptyDescription="Run npm run seed to load demo guest profiles."
        />
      </div>
    </AppShell>
  );
}
