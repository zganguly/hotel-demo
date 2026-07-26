import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
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

type Agent = {
  name: string;
  contact: string;
  commissionPercent: number;
  market: string;
  status: "Active" | "Inactive";
};

const AGENTS: Agent[] = [
  { name: "Horizon Travel Consultants", contact: "Priya Nair", commissionPercent: 10, market: "Domestic leisure", status: "Active" },
  { name: "Global Wings Travel", contact: "Michael Tan", commissionPercent: 12, market: "International FIT", status: "Active" },
  { name: "Sunrise Holidays", contact: "Ayesha Khan", commissionPercent: 8, market: "Domestic corporate", status: "Active" },
  { name: "Voyage Elite", contact: "Carlos Duarte", commissionPercent: 15, market: "Luxury / MICE", status: "Inactive" },
];

export default async function AgentsPage({ params }: PageProps) {
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
        breadcrumb={["Guests & Accounts", "Travel Agents"]}
      >
        <PageHeader title="Travel agents" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const agentBookings = await ReservationModel.countDocuments({
    propertyId: property._id,
    source: "AGENT",
  });

  const active = AGENTS.filter((a) => a.status === "Active").length;
  const avgCommission = Math.round(
    AGENTS.reduce((sum, a) => sum + a.commissionPercent, 0) / AGENTS.length,
  );

  const cards = [
    { label: "Registered agents", value: AGENTS.length },
    { label: "Active agents", value: active, tone: "success" as const },
    { label: "Agent bookings on file", value: agentBookings, tone: "info" as const },
    { label: "Average commission", value: `${avgCommission}%` },
  ];

  const rows = AGENTS.map((agent) => ({
    name: <span className="font-semibold text-text">{agent.name}</span>,
    contact: agent.contact,
    market: agent.market,
    commission: <span className="tabular">{agent.commissionPercent}%</span>,
    status: <StatusCell label={agent.status} tone={agent.status === "Active" ? "success" : "neutral"} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Guests & Accounts", "Travel Agents"]}
    >
      <PageHeader
        title="Travel agents"
        description="Registered travel agent partners, commission terms, and booking volume."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "name", header: "Agent" },
            { key: "contact", header: "Contact" },
            { key: "market", header: "Market" },
            { key: "commission", header: "Commission", align: "right" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No travel agents"
          emptyDescription="No agent partners have been registered yet."
        />
      </div>
    </AppShell>
  );
}
