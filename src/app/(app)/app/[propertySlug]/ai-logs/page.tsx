import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AiLogsPanel } from "@/components/ai/ai-logs-panel";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function AiLogsPage({ params }: PageProps) {
  const { propertySlug } = await params;
  const property = await getPropertyBySlug(propertySlug);
  const businessDate = businessDateToday(property?.timezone);
  const propertyName = propertyDisplayName(propertySlug, property?.name);

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["AI", "AI Logs"]}
    >
      <PageHeader
        title="AI Logs"
        description="Request and response history with request tokens, response tokens, total tokens, and datetime."
        primaryAction={
          <a
            href={`/app/${propertySlug}/ai-conversation`}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            New conversation
          </a>
        }
      />
      <div className="mt-6">
        <AiLogsPanel propertySlug={propertySlug} />
      </div>
    </AppShell>
  );
}
