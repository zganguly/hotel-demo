import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, MoneyCell, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

type PackageRow = {
  name: string;
  description: string;
  addOnMinor: number;
  validity: string;
  status: "Active" | "Seasonal" | "Draft";
};

const PACKAGES: PackageRow[] = [
  { name: "Romance Getaway", description: "Sparkling wine, rose petals, late checkout", addOnMinor: 350000, validity: "Year-round", status: "Active" },
  { name: "Business Essentials", description: "Breakfast, laundry credit, airport transfer", addOnMinor: 220000, validity: "Weekdays only", status: "Active" },
  { name: "Family Fun Pack", description: "Kids stay free, pool cabana, welcome hamper", addOnMinor: 180000, validity: "Year-round", status: "Active" },
  { name: "Monsoon Escape", description: "20% dining credit, spa voucher", addOnMinor: 275000, validity: "Jul – Sep", status: "Seasonal" },
  { name: "Long Stay Comfort", description: "Weekly housekeeping upgrade, grocery delivery", addOnMinor: 150000, validity: "7+ nights", status: "Draft" },
];

function tone(status: PackageRow["status"]) {
  if (status === "Active") return "success" as const;
  if (status === "Seasonal") return "info" as const;
  return "neutral" as const;
}

export default async function PackagesPage({ params }: PageProps) {
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
        breadcrumb={["Revenue", "Packages & Promotions"]}
      >
        <PageHeader title="Packages & promotions" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const active = PACKAGES.filter((p) => p.status === "Active").length;
  const seasonal = PACKAGES.filter((p) => p.status === "Seasonal").length;

  const cards = [
    { label: "Packages configured", value: PACKAGES.length },
    { label: "Active", value: active, tone: "success" as const },
    { label: "Seasonal", value: seasonal, tone: "info" as const },
    { label: "Drafts", value: PACKAGES.filter((p) => p.status === "Draft").length },
  ];

  const rows = PACKAGES.map((pkg) => ({
    name: <span className="font-semibold text-text">{pkg.name}</span>,
    description: <span className="text-text-muted">{pkg.description}</span>,
    addOn: <MoneyCell value={money(pkg.addOnMinor, property.currency)} />,
    validity: pkg.validity,
    status: <StatusCell label={pkg.status} tone={tone(pkg.status)} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Revenue", "Packages & Promotions"]}
    >
      <PageHeader
        title="Packages & promotions"
        description="Bundled rate plans and promotional add-ons available for booking."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "name", header: "Package" },
            { key: "description", header: "Inclusions" },
            { key: "addOn", header: "Add-on rate", align: "right" },
            { key: "validity", header: "Validity" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No packages configured"
          emptyDescription="No promotional packages have been set up yet."
        />
      </div>
    </AppShell>
  );
}
