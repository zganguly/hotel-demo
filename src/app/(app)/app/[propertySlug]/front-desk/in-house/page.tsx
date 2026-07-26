import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  MoneyCell,
  StatusCell,
  reservationStatusTone,
} from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { GuestModel } from "@/modules/guests/guest.model";
import type { Money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function InHousePage({ params }: PageProps) {
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
        breadcrumb={["Front Desk"]}
      >
        <PageHeader title="In house" description="Property not found." />
      </AppShell>
    );
  }

  const stays = await ReservationModel.find({
    propertyId: property._id,
    status: "CHECKED_IN",
  })
    .sort({ departureDate: 1 })
    .lean();

  const guests = await GuestModel.find({
    _id: { $in: stays.map((r) => r.guestId).filter(Boolean) },
  }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));

  const rows = stays.map((reservation) => {
    const guest = reservation.guestId ? guestMap.get(String(reservation.guestId)) : undefined;
    const href = `/app/${propertySlug}/reservations/${reservation.publicId}`;
    return {
      confirmation: (
        <a href={href} className="font-semibold tabular text-primary hover:underline">
          {reservation.confirmationNumber}
        </a>
      ),
      guest: (
        <a href={href} className="hover:text-primary hover:underline">
          {guest ? `${guest.firstName} ${guest.lastName}` : "—"}
        </a>
      ),
      stay: (
        <span className="tabular">
          {reservation.arrivalDate} → {reservation.departureDate}
        </span>
      ),
      status: (
        <StatusCell label={reservation.status} tone={reservationStatusTone(reservation.status)} />
      ),
      total: <MoneyCell value={reservation.totals?.total as Money | undefined} />,
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Front Desk", "In House"]}
    >
      <PageHeader title="In house" description={`${stays.length} guests currently checked in.`} />
      <div className="mt-6">
        <DataTable
          columns={[
            { key: "confirmation", header: "Confirmation" },
            { key: "guest", header: "Guest" },
            { key: "stay", header: "Stay" },
            { key: "status", header: "Status" },
            { key: "total", header: "Folio total", align: "right" },
          ]}
          rows={rows}
          emptyTitle="No in-house guests"
          emptyDescription="Seed data includes checked-in stays for the current date window."
        />
      </div>
    </AppShell>
  );
}
