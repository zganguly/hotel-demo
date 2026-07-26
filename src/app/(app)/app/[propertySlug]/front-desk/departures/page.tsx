import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
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

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function DeparturesPage({ params }: PageProps) {
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
        <PageHeader title="Departures" description="Property not found." />
      </AppShell>
    );
  }

  const departures = await ReservationModel.find({
    propertyId: property._id,
    departureDate: businessDate,
    status: { $in: ["CHECKED_IN", "CONFIRMED", "CHECKED_OUT"] },
  })
    .sort({ confirmationNumber: 1 })
    .lean();

  const guests = await GuestModel.find({
    _id: { $in: departures.map((r) => r.guestId).filter(Boolean) },
  }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));

  const rows = departures.map((reservation) => {
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
      source: reservation.source,
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Front Desk", "Departures"]}
    >
      <PageHeader
        title="Departures"
        description={`${departures.length} expected checkouts for ${businessDate}.`}
      />
      <div className="mt-6">
        <DataTable
          columns={[
            { key: "confirmation", header: "Confirmation" },
            { key: "guest", header: "Guest" },
            { key: "stay", header: "Stay" },
            { key: "status", header: "Status" },
            { key: "source", header: "Source" },
          ]}
          rows={rows}
          emptyTitle="No departures today"
          emptyDescription="No checkouts scheduled for the current business date."
        />
      </div>
    </AppShell>
  );
}
