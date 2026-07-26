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

type Shift = {
  name: string;
  role: string;
  shift: "Morning" | "Evening" | "Night";
  status: "On duty" | "Off duty" | "On leave";
};

const ROSTER: Shift[] = [
  { name: "Ananya Roy", role: "Front Office Manager", shift: "Morning", status: "On duty" },
  { name: "Rohan Ghosh", role: "Front Desk Agent", shift: "Morning", status: "On duty" },
  { name: "Priya Das", role: "Housekeeping Supervisor", shift: "Morning", status: "On duty" },
  { name: "Vikram Sen", role: "Front Desk Agent", shift: "Evening", status: "Off duty" },
  { name: "Meera Iyer", role: "Guest Relations", shift: "Evening", status: "Off duty" },
  { name: "Kabir Khan", role: "Night Auditor", shift: "Night", status: "Off duty" },
  { name: "Nisha Patel", role: "Housekeeping Attendant", shift: "Morning", status: "On leave" },
];

const HANDOVER_NOTES = [
  "Room 214 guest requested late checkout to 2 PM — approved, folio noted.",
  "VIP arrival at 6 PM (Kapoor family) — upgrade to suite confirmed, amenities set.",
  "Minor AC issue in room 308 escalated to engineering, guest informed of ETA.",
  "Two rooms on floor 2 held for group arrival tomorrow — do not release.",
];

export default async function StaffPage({ params }: PageProps) {
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
        breadcrumb={["Hotel Operations", "Staff & Handover"]}
      >
        <PageHeader title="Staff & handover" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const onDuty = ROSTER.filter((s) => s.status === "On duty").length;
  const onLeave = ROSTER.filter((s) => s.status === "On leave").length;

  const cards = [
    { label: "Staff on roster", value: ROSTER.length },
    { label: "On duty now", value: onDuty, tone: "success" as const },
    { label: "On leave", value: onLeave, tone: onLeave > 0 ? ("warning" as const) : ("default" as const) },
    { label: "Shift", value: `${businessDate} · Morning` },
  ];

  const rows = ROSTER.map((person) => ({
    name: <span className="font-semibold text-text">{person.name}</span>,
    role: person.role,
    shift: person.shift,
    status: (
      <StatusCell
        label={person.status}
        tone={person.status === "On duty" ? "success" : person.status === "On leave" ? "warning" : "neutral"}
      />
    ),
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Hotel Operations", "Staff & Handover"]}
    >
      <PageHeader
        title="Staff & handover"
        description="Shift roster and end-of-shift notes for continuity between teams."
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Shift roster</h2>
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "role", header: "Role" },
            { key: "shift", header: "Shift" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No roster configured"
          emptyDescription="Staff roster has not been set up yet."
        />
      </div>

      <div className="mt-8">
        <ModuleSection title="Handover notes" description="Passed to the next shift.">
          <ul className="space-y-2.5">
            {HANDOVER_NOTES.map((note, index) => (
              <li key={index} className="flex gap-3 rounded-[10px] border border-border bg-background px-4 py-3 text-sm text-text">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {note}
              </li>
            ))}
          </ul>
        </ModuleSection>
      </div>
    </AppShell>
  );
}
