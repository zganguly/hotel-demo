import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCards } from "@/components/module/module-ui";
import { DataTable, StatusCell } from "@/components/data-table/simple-table";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

type StockItem = {
  category: string;
  item: string;
  unit: string;
  onHand: number;
  reorderPoint: number;
  store: string;
};

const STOCK_ITEMS: StockItem[] = [
  { category: "Linen", item: "King bedsheet set", unit: "set", onHand: 84, reorderPoint: 40, store: "Main linen room" },
  { category: "Linen", item: "Bath towel", unit: "pc", onHand: 210, reorderPoint: 150, store: "Main linen room" },
  { category: "Linen", item: "Pillow cover", unit: "pc", onHand: 58, reorderPoint: 80, store: "Main linen room" },
  { category: "Amenities", item: "Shampoo 30ml", unit: "pc", onHand: 620, reorderPoint: 300, store: "Housekeeping store" },
  { category: "Amenities", item: "Bath soap 25g", unit: "pc", onHand: 145, reorderPoint: 200, store: "Housekeeping store" },
  { category: "Amenities", item: "Guest slippers", unit: "pair", onHand: 96, reorderPoint: 60, store: "Housekeeping store" },
  { category: "F&B", item: "Instant coffee sachets", unit: "box", onHand: 34, reorderPoint: 20, store: "F&B store" },
  { category: "F&B", item: "Mineral water 500ml", unit: "case", onHand: 12, reorderPoint: 25, store: "F&B store" },
  { category: "F&B", item: "Breakfast eggs", unit: "tray", onHand: 18, reorderPoint: 15, store: "Kitchen store" },
  { category: "Housekeeping supplies", item: "Multi-surface cleaner", unit: "bottle", onHand: 41, reorderPoint: 20, store: "Housekeeping store" },
  { category: "Housekeeping supplies", item: "Trash liners", unit: "roll", onHand: 27, reorderPoint: 30, store: "Housekeeping store" },
  { category: "Engineering", item: "LED bulb 9W", unit: "pc", onHand: 65, reorderPoint: 40, store: "Engineering store" },
];

function stockStatus(item: StockItem) {
  if (item.onHand < item.reorderPoint) return { label: "Reorder now", tone: "danger" as const };
  if (item.onHand < item.reorderPoint * 1.3) return { label: "Watch", tone: "warning" as const };
  return { label: "Healthy", tone: "success" as const };
}

export default async function StockPage({ params }: PageProps) {
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
        breadcrumb={["Hotel Operations", "Stock & Purchasing"]}
      >
        <PageHeader title="Stock & purchasing" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const belowReorder = STOCK_ITEMS.filter((item) => item.onHand < item.reorderPoint).length;
  const watch = STOCK_ITEMS.filter(
    (item) => item.onHand >= item.reorderPoint && item.onHand < item.reorderPoint * 1.3,
  ).length;

  const cards = [
    { label: "Tracked items", value: STOCK_ITEMS.length },
    { label: "Below reorder point", value: belowReorder, tone: belowReorder > 0 ? ("danger" as const) : ("success" as const) },
    { label: "Watch list", value: watch, tone: "warning" as const },
    { label: "Store locations", value: new Set(STOCK_ITEMS.map((i) => i.store)).size },
  ];

  const rows = STOCK_ITEMS.map((item) => {
    const status = stockStatus(item);
    return {
      category: <span className="text-text-muted">{item.category}</span>,
      item: <span className="font-semibold text-text">{item.item}</span>,
      store: item.store,
      onHand: <span className="tabular">{item.onHand} {item.unit}</span>,
      reorder: <span className="tabular text-text-muted">{item.reorderPoint} {item.unit}</span>,
      status: <StatusCell label={status.label} tone={status.tone} />,
    };
  });

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Hotel Operations", "Stock & Purchasing"]}
    >
      <PageHeader
        title="Stock & purchasing"
        description={`Item master and reorder status for ${propertyName} stores.`}
      />
      <div className="mt-6">
        <MetricCards items={cards} />
      </div>
      <div className="mt-8">
        <DataTable
          columns={[
            { key: "category", header: "Category" },
            { key: "item", header: "Item" },
            { key: "store", header: "Store" },
            { key: "onHand", header: "On hand", align: "right" },
            { key: "reorder", header: "Reorder point", align: "right" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          emptyTitle="No stock items"
          emptyDescription="Item master has not been configured yet."
        />
      </div>
    </AppShell>
  );
}
