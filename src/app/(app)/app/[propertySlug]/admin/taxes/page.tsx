import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards, ModuleSection } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

type TaxRule = {
  name: string;
  appliesTo: string;
  rate: string;
  registration: string;
  status: "Active" | "Draft";
};

const TAX_RULES: TaxRule[] = [
  { name: "GST — Room tariff ≤ ₹7,500", appliesTo: "Room revenue", rate: "12%", registration: "GSTIN 19AAAAA0000A1Z5", status: "Active" },
  { name: "GST — Room tariff > ₹7,500", appliesTo: "Room revenue", rate: "18%", registration: "GSTIN 19AAAAA0000A1Z5", status: "Active" },
  { name: "GST — Food & beverage", appliesTo: "F&B revenue", rate: "5%", registration: "GSTIN 19AAAAA0000A1Z5", status: "Active" },
  { name: "Luxury tax (state)", appliesTo: "Room revenue", rate: "2%", registration: "State reg. WB-LT-4471", status: "Active" },
  { name: "TCS on OTA remittance", appliesTo: "OTA settlements", rate: "1%", registration: "TAN CALX12345B", status: "Draft" },
];

const DOCUMENT_TEMPLATES = [
  "Tax invoice (GST) — folio settlement",
  "Proforma invoice — advance booking",
  "Credit note — refund / adjustment",
  "Monthly GSTR-1 export",
];

function tone(status: TaxRule["status"]) {
  return status === "Active" ? ("success" as const) : ("neutral" as const);
}

export default async function TaxesPage({ params }: PageProps) {
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
        breadcrumb={["Administration", "Taxes & Documents"]}
      >
        <PageHeader title="Taxes & documents" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const active = TAX_RULES.filter((t) => t.status === "Active").length;

  const cards = [
    { label: "Tax rules configured", value: TAX_RULES.length },
    { label: "Active rules", value: active, tone: "success" as const },
    { label: "Registrations on file", value: new Set(TAX_RULES.map((t) => t.registration)).size },
    { label: "Document templates", value: DOCUMENT_TEMPLATES.length },
  ];

  const rows = TAX_RULES.map((rule) => ({
    name: <span className="font-semibold text-text">{rule.name}</span>,
    appliesTo: rule.appliesTo,
    rate: <span className="tabular">{rule.rate}</span>,
    registration: <span className="text-text-muted">{rule.registration}</span>,
    status: <StatusCell label={rule.status} tone={tone(rule.status)} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Administration", "Taxes & Documents"]}
    >
      <PageHeader
        title="Taxes & documents"
        description="Statutory tax rates, registrations, and document templates for this property."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Tax rules</h2>
        <DataTable
          columns={[
            { key: "name", header: "Rule" },
            { key: "appliesTo", header: "Applies to" },
            { key: "rate", header: "Rate" },
            { key: "registration", header: "Registration" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No tax rules configured"
          emptyDescription="No statutory tax rules have been set up yet."
        />
      </div>

      <div className="mt-8">
        <ModuleSection title="Statutory document templates" description="Used when generating guest and government-facing documents.">
          <div className="grid gap-3 sm:grid-cols-2">
            {DOCUMENT_TEMPLATES.map((template) => (
              <div key={template} className="rounded-[10px] border border-border bg-background px-4 py-3 text-sm text-text">
                {template}
              </div>
            ))}
          </div>
        </ModuleSection>
      </div>
    </AppShell>
  );
}
