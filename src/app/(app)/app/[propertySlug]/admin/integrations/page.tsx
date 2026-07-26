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

type Integration = {
  name: string;
  category: string;
  status: "Connected" | "Not connected" | "Needs attention";
  lastSync: string;
};

const INTEGRATIONS: Integration[] = [
  { name: "Channel manager (OTA sync)", category: "Distribution", status: "Connected", lastSync: "12 minutes ago" },
  { name: "Payment gateway", category: "Payments", status: "Connected", lastSync: "3 minutes ago" },
  { name: "Better Auth (identity)", category: "Identity", status: "Connected", lastSync: "Live" },
  { name: "Email delivery (confirmations)", category: "Guest communication", status: "Connected", lastSync: "1 minute ago" },
  { name: "SMS gateway", category: "Guest communication", status: "Not connected", lastSync: "Never" },
  { name: "Accounting export", category: "Finance", status: "Needs attention", lastSync: "2 days ago" },
];

function tone(status: Integration["status"]) {
  if (status === "Connected") return "success" as const;
  if (status === "Needs attention") return "warning" as const;
  return "neutral" as const;
}

export default async function IntegrationsPage({ params }: PageProps) {
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
        breadcrumb={["Administration", "Integrations"]}
      >
        <PageHeader title="Integrations" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const connected = INTEGRATIONS.filter((i) => i.status === "Connected").length;
  const attention = INTEGRATIONS.filter((i) => i.status === "Needs attention").length;
  const notConnected = INTEGRATIONS.filter((i) => i.status === "Not connected").length;

  const cards = [
    { label: "Integrations", value: INTEGRATIONS.length },
    { label: "Connected", value: connected, tone: "success" as const },
    { label: "Needs attention", value: attention, tone: attention > 0 ? ("warning" as const) : ("default" as const) },
    { label: "Not connected", value: notConnected },
  ];

  const rows = INTEGRATIONS.map((integration) => ({
    name: <span className="font-semibold text-text">{integration.name}</span>,
    category: integration.category,
    status: <StatusCell label={integration.status} tone={tone(integration.status)} />,
    lastSync: <span className="text-text-muted">{integration.lastSync}</span>,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Administration", "Integrations"]}
    >
      <PageHeader
        title="Integrations"
        description="Channel manager, payment gateway, and third-party connections for this property."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "name", header: "Integration" },
            { key: "category", header: "Category" },
            { key: "status", header: "Status" },
            { key: "lastSync", header: "Last sync" },
          ]}
          rows={rows}
          emptyTitle="No integrations configured"
          emptyDescription="No third-party integrations have been set up yet."
        />
      </div>
    </AppShell>
  );
}
