import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards, ModuleSection } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

const CHANNEL_META: Record<string, { name: string; kind: string; status: "Connected" | "Not connected" }> = {
  DIRECT: { name: "Direct / website", kind: "Owned channel", status: "Connected" },
  WALK_IN: { name: "Walk-in / front desk", kind: "Owned channel", status: "Connected" },
  PHONE: { name: "Phone reservations", kind: "Owned channel", status: "Connected" },
  CORPORATE: { name: "Corporate accounts", kind: "Negotiated rate", status: "Connected" },
  AGENT: { name: "Travel agents", kind: "Indirect channel", status: "Connected" },
  GROUP: { name: "Group / MICE desk", kind: "Negotiated rate", status: "Connected" },
  OTA: { name: "OTA channel manager", kind: "Distribution", status: "Connected" },
};

export default async function ChannelsPage({ params }: PageProps) {
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
        breadcrumb={["Revenue", "Distribution Channels"]}
      >
        <PageHeader title="Distribution channels" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const bySource = await ReservationModel.aggregate<{ _id: string; count: number }>([
    { $match: { propertyId: property._id, status: { $ne: "CANCELLED" } } },
    { $group: { _id: "$source", count: { $sum: 1 } } },
  ]);

  const sourceCountMap = new Map(bySource.map((row) => [row._id, row.count]));
  const totalBookings = bySource.reduce((sum, row) => sum + row.count, 0);
  const connectedChannels = Object.keys(CHANNEL_META).length;

  const cards = [
    { label: "Connected channels", value: connectedChannels, tone: "success" as const },
    { label: "Bookings tracked", value: totalBookings },
    {
      label: "Top channel",
      value: bySource.length > 0
        ? CHANNEL_META[bySource.sort((a, b) => b.count - a.count)[0]!._id]?.name ?? "—"
        : "—",
    },
    { label: "Business date", value: businessDate, tone: "info" as const },
  ];

  const rows = Object.entries(CHANNEL_META).map(([source, meta]) => {
    const count = sourceCountMap.get(source) ?? 0;
    const share = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
    return {
      name: <span className="font-semibold text-text">{meta.name}</span>,
      kind: meta.kind,
      status: <StatusCell label={meta.status} tone="success" />,
      bookings: <span className="tabular">{count}</span>,
      share: <span className="tabular">{share}%</span>,
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Revenue", "Distribution Channels"]}
    >
      <PageHeader
        title="Distribution channels"
        description="Channel connectivity and live booking share across owned and third-party channels."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <ModuleSection title="Channel performance" description="Booking share computed from all non-cancelled reservations.">
          <DataTable
            columns={[
              { key: "name", header: "Channel" },
              { key: "kind", header: "Type" },
              { key: "status", header: "Connectivity" },
              { key: "bookings", header: "Bookings", align: "right" },
              { key: "share", header: "Share", align: "right" },
            ]}
            rows={rows}
            emptyTitle="No channel data"
            emptyDescription="Run npm run seed to populate booking sources."
          />
        </ModuleSection>
      </div>
    </AppShell>
  );
}
