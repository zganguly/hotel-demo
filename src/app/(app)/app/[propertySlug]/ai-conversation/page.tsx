import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AiConversationPanel } from "@/components/ai/ai-conversation-panel";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

export default async function AiConversationPage({ params }: PageProps) {
  const { propertySlug } = await params;
  const property = await getPropertyBySlug(propertySlug);
  const businessDate = businessDateToday(property?.timezone);
  const propertyName = propertyDisplayName(propertySlug, property?.name);

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["AI", "AI Conversation"]}
    >
      <PageHeader
        title="AI Conversation"
        description="Chat with OpenAI or OpenRouter. Follow-up messages stay in the same thread and every turn is logged."
        primaryAction={
          <a
            href={`/app/${propertySlug}/ai-logs`}
            className="rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-subtle"
          >
            Open AI Logs
          </a>
        }
      />
      <div className="mt-6">
        <AiConversationPanel propertySlug={propertySlug} />
      </div>
    </AppShell>
  );
}
