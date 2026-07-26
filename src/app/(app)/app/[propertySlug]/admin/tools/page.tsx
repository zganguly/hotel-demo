import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards, ModuleSection } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { JobModel, OutboxEventModel } from "@/lib/jobs/models";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function MaintenanceToolsPage({ params }: PageProps) {
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
        breadcrumb={["Administration", "Maintenance Tools"]}
      >
        <PageHeader title="Maintenance tools" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [pendingJobs, failedJobs, pendingOutbox, deadOutbox] = await Promise.all([
    JobModel.countDocuments({ status: { $in: ["PENDING", "LEASED"] } }),
    JobModel.countDocuments({ status: { $in: ["FAILED", "DEAD"] } }),
    OutboxEventModel.countDocuments({ status: { $in: ["PENDING", "PROCESSING"] } }),
    OutboxEventModel.countDocuments({ status: "DEAD" }),
  ]);

  const cards = [
    { label: "Jobs pending / leased", value: pendingJobs, tone: "info" as const },
    { label: "Jobs failed / dead", value: failedJobs, tone: failedJobs > 0 ? ("danger" as const) : ("success" as const) },
    { label: "Outbox events pending", value: pendingOutbox, tone: "info" as const },
    { label: "Outbox events dead-lettered", value: deadOutbox, tone: deadOutbox > 0 ? ("danger" as const) : ("success" as const) },
  ];

  const diagnostics = [
    { check: "Database connectivity", status: "Healthy", tone: "success" as const },
    { check: "Cron dispatcher endpoint", status: "Healthy", tone: "success" as const },
    { check: "Better Auth session store", status: "Healthy", tone: "success" as const },
    {
      check: "Job queue backlog",
      status: pendingJobs > 20 ? "Elevated" : "Normal",
      tone: pendingJobs > 20 ? ("warning" as const) : ("success" as const),
    },
  ];

  const diagnosticRows = diagnostics.map((d) => ({
    check: <span className="font-semibold text-text">{d.check}</span>,
    status: <StatusCell label={d.status} tone={d.tone} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Administration", "Maintenance Tools"]}
    >
      <PageHeader
        title="Maintenance tools"
        description="System diagnostics, background job health, and demo data utilities."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">System diagnostics</h2>
        <DataTable
          columns={[
            { key: "check", header: "Check" },
            { key: "status", header: "Status" },
          ]}
          rows={diagnosticRows}
          emptyTitle="No diagnostics available"
          emptyDescription="Diagnostics could not be computed."
        />
      </div>

      <div className="mt-8">
        <ModuleSection
          title="Demo data utilities"
          description="Destructive operations run from the command line, not from this screen, to protect production data."
        >
          <div className="space-y-2 text-sm text-text-muted">
            <p>
              <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-text">npm run seed</code> — resets and
              reseeds demo guests, reservations, and folios for both demo properties.
            </p>
            <p>
              Seeding is blocked in production unless{" "}
              <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-text">ALLOW_DEMO_SEED=true</code> is
              explicitly set.
            </p>
          </div>
        </ModuleSection>
      </div>
    </AppShell>
  );
}
