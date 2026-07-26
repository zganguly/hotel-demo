import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleSection } from "@/components/module/module-ui";
import { StatusBadge } from "@/components/feedback/status-badge";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { RoomModel, RoomTypeModel } from "@/modules/rooms/room.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-text">{value}</p>
    </div>
  );
}

export default async function PropertySetupPage({ params }: PageProps) {
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
        breadcrumb={["Administration", "Property Setup"]}
      >
        <PageHeader title="Property setup" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const [roomTypes, roomCount] = await Promise.all([
    RoomTypeModel.find({ propertyId: property._id, status: "ACTIVE" }).sort({ code: 1 }).lean(),
    RoomModel.countDocuments({ propertyId: property._id, status: "ACTIVE" }),
  ]);

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Administration", "Property Setup"]}
    >
      <PageHeader
        title="Property setup"
        description="Core configuration for this property record."
        primaryAction={<StatusBadge label={property.status} tone={property.status === "ACTIVE" ? "success" : "neutral"} />}
      />

      <div className="mt-6">
        <ModuleSection title="Identity">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Property name" value={property.name} />
            <Field label="Slug" value={<span className="tabular">{property.slug}</span>} />
            <Field label="Public ID" value={<span className="tabular text-xs">{property.publicId}</span>} />
            <Field label="Timezone" value={property.timezone} />
            <Field label="Currency" value={property.currency} />
            <Field label="Status" value={property.status} />
          </div>
        </ModuleSection>
      </div>

      <div className="mt-6">
        <ModuleSection title="Operating policy" description="Standard check-in/out and room configuration.">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Check-in time" value={<span className="tabular">{property.checkInTime}</span>} />
            <Field label="Check-out time" value={<span className="tabular">{property.checkOutTime}</span>} />
            <Field label="Room types" value={roomTypes.length} />
            <Field label="Active rooms" value={roomCount} />
            <Field
              label="Created"
              value={<span className="tabular">{new Date(property.createdAt).toLocaleDateString("en-IN")}</span>}
            />
            <Field
              label="Last updated"
              value={<span className="tabular">{new Date(property.updatedAt).toLocaleDateString("en-IN")}</span>}
            />
          </div>
        </ModuleSection>
      </div>

      <div className="mt-6">
        <ModuleSection title="Room types" description="Configured room categories and base inventory.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {roomTypes.map((type) => (
              <div key={String(type._id)} className="rounded-[12px] border border-border bg-background px-4 py-3.5">
                <p className="text-sm font-semibold text-text">
                  {type.code} · {type.name}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Max {type.maxOccupancy} guests · {type.baseInventory} rooms
                </p>
              </div>
            ))}
          </div>
        </ModuleSection>
      </div>
    </AppShell>
  );
}
