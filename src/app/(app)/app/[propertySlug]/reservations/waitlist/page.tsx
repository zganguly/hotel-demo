import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
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

export default async function WaitlistPage({ params }: PageProps) {
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
        breadcrumb={["Reservations", "Waitlist & Quotes"]}
      >
        <PageHeader title="Waitlist & quotes" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const entries = await ReservationModel.find({
    propertyId: property._id,
    status: { $in: ["WAITLIST", "OPTION", "INQUIRY"] },
    arrivalDate: { $gte: businessDate },
  })
    .sort({ arrivalDate: 1 })
    .limit(150)
    .lean();

  const guests = await GuestModel.find({
    _id: { $in: entries.map((r) => r.guestId).filter(Boolean) },
  }).lean();
  const guestMap = new Map(guests.map((g) => [String(g._id), g]));

  const waitlist = entries.filter((r) => r.status === "WAITLIST").length;
  const options = entries.filter((r) => r.status === "OPTION").length;
  const inquiries = entries.filter((r) => r.status === "INQUIRY").length;

  const cards = [
    { label: "Waitlisted", value: waitlist, tone: "warning" as const },
    { label: "Options held", value: options, tone: "info" as const },
    { label: "Open inquiries", value: inquiries },
    { label: "Total pipeline", value: entries.length, tone: "premium" as const },
  ];

  const rows = entries.map((reservation) => {
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
      status: <StatusCell label={reservation.status} tone={reservationStatusTone(reservation.status)} />,
      source: reservation.source,
      total: <MoneyCell value={reservation.totals?.total as Money | undefined} />,
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Reservations", "Waitlist & Quotes"]}
    >
      <PageHeader
        title="Waitlist & quotes"
        description="Unconfirmed demand — waitlisted stays, held options, and open inquiries awaiting response."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "confirmation", header: "Reference" },
            { key: "guest", header: "Guest" },
            { key: "stay", header: "Requested stay" },
            { key: "status", header: "Status" },
            { key: "source", header: "Source" },
            { key: "total", header: "Quoted total", align: "right" },
          ]}
          rows={rows}
          emptyTitle="No waitlist or quote activity"
          emptyDescription="No upcoming waitlist, option, or inquiry records were found."
        />
      </div>
    </AppShell>
  );
}
