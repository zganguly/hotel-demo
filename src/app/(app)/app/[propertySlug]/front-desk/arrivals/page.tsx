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

export default async function ArrivalsPage({ params }: PageProps) {
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
        <PageHeader title="Arrivals" description="Property not found." />
      </AppShell>
    );
  }

  const arrivals = await ReservationModel.find({
    propertyId: property._id,
    arrivalDate: businessDate,
    status: { $in: ["CONFIRMED", "CHECKED_IN", "OPTION"] },
  })
    .sort({ confirmationNumber: 1 })
    .lean();

  const guests = await GuestModel.find({
    _id: { $in: arrivals.map((r) => r.guestId).filter(Boolean) },
  }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));

  const rows = arrivals.map((reservation) => {
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
      phone: guest?.phone || "—",
      status: (
        <StatusCell label={reservation.status} tone={reservationStatusTone(reservation.status)} />
      ),
      source: reservation.source,
      requests: reservation.specialRequests?.join(", ") || "—",
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Front Desk", "Arrivals"]}
    >
      <PageHeader
        title="Arrivals"
        description={`${arrivals.length} due-in reservations for ${businessDate}.`}
      />
      <div className="mt-6">
        <DataTable
          columns={[
            { key: "confirmation", header: "Confirmation" },
            { key: "guest", header: "Guest" },
            { key: "phone", header: "Phone" },
            { key: "status", header: "Status" },
            { key: "source", header: "Source" },
            { key: "requests", header: "Requests" },
          ]}
          rows={rows}
          emptyTitle="No arrivals today"
          emptyDescription="No due-in reservations for the current business date."
        />
      </div>
    </AppShell>
  );
}
