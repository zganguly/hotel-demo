import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards, ModuleSection } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { UserAccessModel } from "@/modules/properties/property.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function AdminOverviewPage({ params }: PageProps) {
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
        breadcrumb={["Administration"]}
      >
        <PageHeader title="Administration" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const users = await UserAccessModel.find({ propertyIds: property._id })
    .sort({ accountType: 1, displayName: 1 })
    .lean();

  const admins = users.filter((u) => u.accountType === "ADMIN").length;
  const managers = users.filter((u) => u.accountType === "MANAGER").length;
  const active = users.filter((u) => u.status === "ACTIVE").length;

  const cards = [
    { label: "Users with access", value: users.length, tone: "info" as const },
    { label: "Admins", value: admins },
    { label: "Managers", value: managers },
    { label: "Active accounts", value: active, tone: "success" as const },
  ];

  const panels: Array<{ label: string; href: string; description: string }> = [
    { label: "Property setup", href: "admin/property", description: "Timezone, currency, check-in/out policy." },
    { label: "Users & permissions", href: "admin/users", description: "Account types, property scope, approval limits." },
    { label: "Staff & handover", href: "admin/staff", description: "Shift roster and end-of-shift notes." },
    { label: "Taxes & documents", href: "admin/taxes", description: "Tax rates, registrations, and statutory templates." },
    { label: "Integrations", href: "admin/integrations", description: "Channel manager, payment gateway, and OTA connections." },
    { label: "Audit log", href: "admin/audit", description: "Sensitive and high-risk action history." },
    { label: "Maintenance tools", href: "admin/tools", description: "System diagnostics and seed/reset utilities." },
  ];

  const rows = users.slice(0, 8).map((user) => ({
    name: <span className="font-semibold text-text">{user.displayName}</span>,
    email: <span className="text-text-muted">{user.email}</span>,
    role: <StatusCell label={user.accountType} tone={user.accountType === "ADMIN" ? "premium" : "info"} />,
    status: (
      <StatusCell
        label={user.status}
        tone={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "danger" : "warning"}
      />
    ),
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Administration"]}
    >
      <PageHeader
        title="Administration"
        description="Property setup, users, taxes, integrations, and audit for this property."
      />

      <div className="mt-6">
        <MetricCards items={cards} />
      </div>

      <div className="mt-8">
        <ModuleSection title="Administration areas" description="Jump straight to a setup panel.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {panels.map((panel) => (
              <a
                key={panel.href}
                href={`/app/${propertySlug}/${panel.href}`}
                className="rounded-[12px] border border-border bg-background px-4 py-3.5 transition hover:border-primary/40 hover:bg-surface-subtle"
              >
                <p className="text-sm font-semibold text-text">{panel.label}</p>
                <p className="mt-1 text-xs text-text-muted">{panel.description}</p>
              </a>
            ))}
          </div>
        </ModuleSection>
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Users with access to {propertyName}</h2>
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "role", header: "Account type" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No users assigned"
          emptyDescription="Run npm run seed to load demo admin and manager accounts."
        />
      </div>
    </AppShell>
  );
}
