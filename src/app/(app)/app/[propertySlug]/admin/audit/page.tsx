import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { AuditEventModel } from "@/lib/jobs/models";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

type DemoAuditRow = {
  action: string;
  actor: string;
  target: string;
  reasonCode: string;
  when: string;
};

const DEMO_AUDIT: DemoAuditRow[] = [
  { action: "RESERVATION_DISCOUNT_APPLIED", actor: "manager.kolkata@aureliastay.example", target: "Reservation HAR-2041", reasonCode: "LOYALTY_RATE", when: "Today, 09:14" },
  { action: "FOLIO_REFUND_ISSUED", actor: "finance.manager@aureliastay.example", target: "Folio 8f2c1a", reasonCode: "SERVICE_RECOVERY", when: "Today, 08:47" },
  { action: "RATE_OVERRIDE", actor: "ops.manager@aureliastay.example", target: "Room type DLX", reasonCode: "COMPETITIVE_MATCH", when: "Yesterday, 21:03" },
  { action: "USER_PERMISSION_UPDATED", actor: "admin@aureliastay.example", target: "User ops.manager@aureliastay.example", reasonCode: "ROLE_CHANGE", when: "Yesterday, 15:22" },
  { action: "CHECK_IN_OVERRIDE", actor: "manager.kolkata@aureliastay.example", target: "Reservation HAR-1998", reasonCode: "EARLY_ARRIVAL", when: "2 days ago" },
  { action: "VOID_TRANSACTION", actor: "finance.manager@aureliastay.example", target: "Folio 3d91ee", reasonCode: "POSTING_ERROR", when: "3 days ago" },
];

function actionTone(action: string) {
  if (action.includes("REFUND") || action.includes("VOID")) return "danger" as const;
  if (action.includes("OVERRIDE") || action.includes("DISCOUNT")) return "warning" as const;
  return "info" as const;
}

export default async function AuditLogPage({ params }: PageProps) {
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
        breadcrumb={["Administration", "Audit Log"]}
      >
        <PageHeader title="Audit log" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const liveEvents = await AuditEventModel.find({ propertyId: property._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const usingDemo = liveEvents.length === 0;
  const sensitiveActions = usingDemo
    ? DEMO_AUDIT.length
    : liveEvents.filter((e) => actionTone(e.action) !== "info").length;

  const cards = [
    { label: "Events logged", value: usingDemo ? DEMO_AUDIT.length : liveEvents.length, tone: "info" as const },
    { label: "Sensitive / high-risk", value: sensitiveActions, tone: "warning" as const },
    { label: "Distinct actors", value: usingDemo ? new Set(DEMO_AUDIT.map((e) => e.actor)).size : new Set(liveEvents.map((e) => e.actorUserId)).size },
    { label: "Source", value: usingDemo ? "Illustrative" : "Live audit trail" },
  ];

  const rows = usingDemo
    ? DEMO_AUDIT.map((event) => ({
        action: <StatusCell label={event.action.replace(/_/g, " ")} tone={actionTone(event.action)} />,
        actor: <span className="text-text-muted">{event.actor}</span>,
        target: event.target,
        reason: <span className="tabular text-text-muted">{event.reasonCode}</span>,
        when: <span className="text-text-muted">{event.when}</span>,
      }))
    : liveEvents.map((event) => ({
        action: <StatusCell label={event.action.replace(/_/g, " ")} tone={actionTone(event.action)} />,
        actor: <span className="text-text-muted">{event.actorUserId || "system"}</span>,
        target: `${event.targetType || "—"} ${event.targetId || ""}`.trim(),
        reason: <span className="tabular text-text-muted">{event.reasonCode || "—"}</span>,
        when: <span className="text-text-muted">{new Date(event.createdAt).toLocaleString("en-IN")}</span>,
      }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Administration", "Audit Log"]}
    >
      <PageHeader
        title="Audit log"
        description={
          usingDemo
            ? "Illustrative sensitive and high-risk action history — connect live actions to populate this trail."
            : "Sensitive and high-risk action history for this property."
        }
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "action", header: "Action" },
            { key: "actor", header: "Actor" },
            { key: "target", header: "Target" },
            { key: "reason", header: "Reason code" },
            { key: "when", header: "When" },
          ]}
          rows={rows}
          emptyTitle="No audit events"
          emptyDescription="No sensitive or high-risk actions have been recorded yet."
        />
      </div>
    </AppShell>
  );
}
