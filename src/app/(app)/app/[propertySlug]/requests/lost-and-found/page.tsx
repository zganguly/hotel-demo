import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

type LostFoundItem = {
  item: string;
  location: string;
  foundDate: string;
  guest: string;
  status: "Stored" | "Returned" | "Awaiting pickup" | "Disposed";
};

const ITEMS: LostFoundItem[] = [
  { item: "Black leather wallet", location: "Room 214", foundDate: "2026-07-20", guest: "Unclaimed", status: "Stored" },
  { item: "Blue umbrella", location: "Lobby", foundDate: "2026-07-19", guest: "Unclaimed", status: "Stored" },
  { item: "Prescription glasses (case)", location: "Room 308", foundDate: "2026-07-18", guest: "R. Mehta", status: "Awaiting pickup" },
  { item: "Phone charger (USB-C)", location: "Room 112", foundDate: "2026-07-17", guest: "Unclaimed", status: "Stored" },
  { item: "Child's stuffed toy", location: "Restaurant", foundDate: "2026-07-15", guest: "S. Kapoor", status: "Returned" },
  { item: "Silver bracelet", location: "Pool deck", foundDate: "2026-07-12", guest: "Unclaimed", status: "Stored" },
  { item: "Laptop sleeve", location: "Business center", foundDate: "2026-07-08", guest: "Unclaimed", status: "Disposed" },
];

function tone(status: LostFoundItem["status"]) {
  if (status === "Returned") return "success" as const;
  if (status === "Awaiting pickup") return "warning" as const;
  if (status === "Disposed") return "neutral" as const;
  return "info" as const;
}

export default async function LostAndFoundPage({ params }: PageProps) {
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
        breadcrumb={["Rooms & Operations", "Lost & Found"]}
      >
        <PageHeader title="Lost & found" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const stored = ITEMS.filter((i) => i.status === "Stored" || i.status === "Awaiting pickup").length;
  const returned = ITEMS.filter((i) => i.status === "Returned").length;
  const awaitingPickup = ITEMS.filter((i) => i.status === "Awaiting pickup").length;

  const cards = [
    { label: "Items in storage", value: stored, tone: "info" as const },
    { label: "Awaiting guest pickup", value: awaitingPickup, tone: "warning" as const },
    { label: "Returned to guests", value: returned, tone: "success" as const },
    { label: "Total logged", value: ITEMS.length },
  ];

  const rows = ITEMS.map((entry) => ({
    item: <span className="font-semibold text-text">{entry.item}</span>,
    location: entry.location,
    found: <span className="tabular text-text-muted">{entry.foundDate}</span>,
    guest: entry.guest,
    status: <StatusCell label={entry.status} tone={tone(entry.status)} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Rooms & Operations", "Lost & Found"]}
    >
      <PageHeader
        title="Lost & found"
        description="Items reported found on property, tracked from discovery through return or disposal."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "item", header: "Item" },
            { key: "location", header: "Found at" },
            { key: "found", header: "Date found" },
            { key: "guest", header: "Guest" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No lost & found items"
          emptyDescription="Nothing has been logged yet."
        />
      </div>
    </AppShell>
  );
}
