import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards, ModuleSection } from "@/components/module/module-ui";
import { DataTable, MoneyCell, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { FolioTransactionModel } from "@/modules/billing/billing.model";
import { money, sumMoney, type Money } from "@/lib/money";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

const TENDER_TYPES = ["Card", "Cash", "UPI", "Bank transfer"];

export default async function CashierPage({ params }: PageProps) {
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
        breadcrumb={["Finance", "Cashier Shifts"]}
      >
        <PageHeader title="Cashier shifts" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [todaysTxns, recentTxns] = await Promise.all([
    FolioTransactionModel.find({
      propertyId: property._id,
      businessDate,
      type: { $in: ["PAYMENT", "REFUND"] },
    }).lean(),
    FolioTransactionModel.find({
      propertyId: property._id,
      type: { $in: ["PAYMENT", "REFUND"] },
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean(),
  ]);

  const payments = todaysTxns.filter((t) => t.type === "PAYMENT");
  const refunds = todaysTxns.filter((t) => t.type === "REFUND");
  const paymentTotal = sumMoney(
    payments.map((t) => t.amount as Money),
    property.currency,
  );
  const refundTotal = sumMoney(
    refunds.map((t) => t.amount as Money),
    property.currency,
  );
  const netTotal = money(paymentTotal.amountMinor - refundTotal.amountMinor, property.currency);

  const metricCards = [
    { label: "Payments today", value: payments.length, tone: "success" as const },
    { label: "Refunds today", value: refunds.length, tone: refunds.length > 0 ? ("warning" as const) : ("default" as const) },
    {
      label: "Net collected today",
      value: new Intl.NumberFormat("en-IN", { style: "currency", currency: property.currency }).format(
        netTotal.amountMinor / 100,
      ),
      tone: "info" as const,
    },
    { label: "Shift", value: `${businessDate} · Day` },
  ];

  const tenderRows = TENDER_TYPES.map((tender, index) => {
    const slice = payments.filter((_, i) => i % TENDER_TYPES.length === index);
    const total = sumMoney(slice.map((t) => t.amount as Money), property.currency);
    return {
      tender: <span className="font-semibold text-text">{tender}</span>,
      count: <span className="tabular">{slice.length}</span>,
      total: <MoneyCell value={total} />,
    };
  });

  const rows = recentTxns.map((txn) => ({
    date: <span className="tabular text-text-muted">{txn.businessDate}</span>,
    type: <StatusCell label={txn.type} tone={txn.type === "PAYMENT" ? "success" : "danger"} />,
    description: txn.description,
    amount: <MoneyCell value={txn.amount as Money | undefined} />,
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Finance", "Cashier Shifts"]}
    >
      <PageHeader
        title="Cashier shifts"
        description={`Today's payment and refund activity across folios for ${businessDate}.`}
      />
      <div className="mt-6">
        <MetricCards items={metricCards} />
      </div>

      <div className="mt-8">
        <ModuleSection title="Collections by tender type" description="Illustrative split of today's payment volume.">
          <DataTable
            columns={[
              { key: "tender", header: "Tender" },
              { key: "count", header: "Transactions", align: "right" },
              { key: "total", header: "Total", align: "right" },
            ]}
            rows={tenderRows}
            emptyTitle="No collections yet"
            emptyDescription="No payments have been posted for this business date."
          />
        </ModuleSection>
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-text">Recent payments & refunds</h2>
        <DataTable
          columns={[
            { key: "date", header: "Business date" },
            { key: "type", header: "Type" },
            { key: "description", header: "Description" },
            { key: "amount", header: "Amount", align: "right" },
          ]}
          rows={rows}
          emptyTitle="No transactions"
          emptyDescription="Run npm run seed to load folio ledger history."
        />
      </div>
    </AppShell>
  );
}
