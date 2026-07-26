import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, MoneyCell, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

type Company = {
  name: string;
  contact: string;
  email: string;
  creditTermsDays: number;
  outstandingMinor: number;
  status: "Active" | "On hold";
};

const COMPANIES: Company[] = [
  { name: "Bengal Steel & Alloys Ltd.", contact: "Rina Bose", email: "travel@bengalsteel.example", creditTermsDays: 30, outstandingMinor: 128000, status: "Active" },
  { name: "TechConnect Solutions", contact: "Arjun Mehta", email: "admin@techconnect.example", creditTermsDays: 15, outstandingMinor: 46000, status: "Active" },
  { name: "Coastal Traders Association", contact: "Farah Sheikh", email: "events@coastaltraders.example", creditTermsDays: 30, outstandingMinor: 0, status: "Active" },
  { name: "Meridian Consulting Group", contact: "David Lin", email: "ops@meridianconsulting.example", creditTermsDays: 45, outstandingMinor: 214000, status: "On hold" },
];

export default async function CompaniesPage({ params }: PageProps) {
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
        breadcrumb={["Guests & Accounts", "Companies"]}
      >
        <PageHeader title="Companies" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const corporateBookings = await ReservationModel.countDocuments({
    propertyId: property._id,
    source: "CORPORATE",
  });

  const outstandingTotal = COMPANIES.reduce((sum, c) => sum + c.outstandingMinor, 0);
  const onHold = COMPANIES.filter((c) => c.status === "On hold").length;

  const cards = [
    { label: "Corporate accounts", value: COMPANIES.length },
    { label: "Corporate bookings on file", value: corporateBookings, tone: "info" as const },
    {
      label: "Outstanding balance",
      value: new Intl.NumberFormat("en-IN", { style: "currency", currency: property.currency }).format(
        outstandingTotal / 100,
      ),
      tone: outstandingTotal > 0 ? ("warning" as const) : ("success" as const),
    },
    { label: "Accounts on hold", value: onHold, tone: onHold > 0 ? ("danger" as const) : ("default" as const) },
  ];

  const rows = COMPANIES.map((company) => ({
    name: <span className="font-semibold text-text">{company.name}</span>,
    contact: company.contact,
    email: <span className="text-text-muted">{company.email}</span>,
    terms: <span className="tabular">{company.creditTermsDays} days</span>,
    outstanding: <MoneyCell value={money(company.outstandingMinor, property.currency)} />,
    status: <StatusCell label={company.status} tone={company.status === "Active" ? "success" : "danger"} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Guests & Accounts", "Companies"]}
    >
      <PageHeader
        title="Companies"
        description="Corporate accounts with negotiated rates, credit terms, and billing contacts."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "name", header: "Company" },
            { key: "contact", header: "Contact" },
            { key: "email", header: "Email" },
            { key: "terms", header: "Credit terms" },
            { key: "outstanding", header: "Outstanding", align: "right" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No company accounts"
          emptyDescription="No corporate accounts have been set up yet."
        />
      </div>
    </AppShell>
  );
}
