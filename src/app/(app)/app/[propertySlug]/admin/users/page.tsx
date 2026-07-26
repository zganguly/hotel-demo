import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { UserAccessModel } from "@/modules/properties/property.model";
import { formatMoney, money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function UsersPage({ params }: PageProps) {
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
        breadcrumb={["Administration", "Users & Permissions"]}
      >
        <PageHeader title="Users & permissions" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const users = await UserAccessModel.find({ propertyIds: property._id })
    .sort({ accountType: 1, displayName: 1 })
    .lean();

  const admins = users.filter((u) => u.accountType === "ADMIN").length;
  const managers = users.filter((u) => u.accountType === "MANAGER").length;
  const twoFactor = users.filter((u) => u.requireTwoFactor).length;

  const cards = [
    { label: "Total users", value: users.length },
    { label: "Admins", value: admins, tone: "premium" as const },
    { label: "Managers", value: managers, tone: "info" as const },
    { label: "2FA enforced", value: twoFactor, tone: twoFactor > 0 ? ("success" as const) : ("default" as const) },
  ];

  const rows = users.map((user) => ({
    name: (
      <div>
        <p className="font-semibold text-text">{user.displayName}</p>
        <p className="text-xs text-text-muted">{user.email}</p>
      </div>
    ),
    role: <StatusCell label={user.accountType} tone={user.accountType === "ADMIN" ? "premium" : "info"} />,
    status: (
      <StatusCell
        label={user.status}
        tone={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "danger" : "warning"}
      />
    ),
    permissions: (
      <span className="text-text-muted">
        {user.permissionPreset || `${user.permissions?.length ?? 0} permission(s)`}
      </span>
    ),
    limits: (
      <span className="tabular text-text-muted">
        {formatMoney(money(user.approvalLimits?.maxRefundMinor ?? 0, property.currency))} refund cap
      </span>
    ),
    twoFactor: user.requireTwoFactor ? (
      <StatusCell label="Required" tone="success" />
    ) : (
      <StatusCell label="Optional" tone="neutral" />
    ),
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Administration", "Users & Permissions"]}
    >
      <PageHeader
        title="Users & permissions"
        description={`Account types, property scope, and approval limits for ${propertyName}.`}
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "name", header: "User" },
            { key: "role", header: "Account type" },
            { key: "status", header: "Status" },
            { key: "permissions", header: "Permission preset" },
            { key: "limits", header: "Approval limit" },
            { key: "twoFactor", header: "2FA" },
          ]}
          rows={rows}
          emptyTitle="No users assigned"
          emptyDescription="Run npm run seed to load demo admin and manager accounts."
        />
      </div>
    </AppShell>
  );
}
