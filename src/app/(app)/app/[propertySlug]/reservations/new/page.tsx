import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { NewReservationForm } from "@/components/reservations/new-reservation-form";
import {
  businessDateToday,
  getPropertyBySlug,
  propertyDisplayName,
} from "@/lib/property/get-property";
import { RoomModel, RoomTypeModel } from "@/modules/rooms/room.model";

type PageProps = {
  params: Promise<{ propertySlug: string }>;
};

const RATE_BY_CODE: Record<string, number> = {
  STD: 65000,
  DLX: 95000,
  SUITE: 185000,
};

const DEFAULT_AMENITIES: Record<string, string[]> = {
  STD: ["King bed", "City view", "Wi-Fi", "Work desk"],
  DLX: ["Twin beds", "Rain shower", "Mini bar", "Lounge access"],
  SUITE: ["Living room", "Bathtub", "Butler tray", "Harbour / garden view"],
};

export default async function NewReservationPage({ params }: PageProps) {
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
        breadcrumb={["Reservations", "New Reservation"]}
      >
        <PageHeader title="New reservation" description="Property not found. Run the demo seed." />
      </AppShell>
    );
  }

  const roomTypes = await RoomTypeModel.find({ propertyId: property._id, status: "ACTIVE" })
    .sort({ code: 1 })
    .lean();

  const roomCounts = await RoomModel.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        propertyId: property._id,
        status: "ACTIVE",
        maintenanceStatus: "OK",
      },
    },
    { $group: { _id: "$roomTypeId", count: { $sum: 1 } } },
  ]);
  const availableByType = new Map(
    roomCounts.map((row) => [String(row._id), row.count]),
  );

  const roomTypeOptions = roomTypes.map((type) => ({
    id: String(type._id),
    code: type.code,
    name: type.name,
    maxAdults: type.maxAdults,
    maxChildren: type.maxChildren ?? 0,
    maxOccupancy: type.maxOccupancy,
    available: availableByType.get(String(type._id)) ?? type.baseInventory,
    nightlyMinor: RATE_BY_CODE[type.code] ?? 65000,
    currency: property.currency,
    amenities: type.amenities?.length
      ? type.amenities
      : DEFAULT_AMENITIES[type.code] ?? ["Wi-Fi", "AC"],
  }));

  return (
    <AppShell
      propertySlug={propertySlug}
      propertyName={propertyName}
      businessDate={businessDate}
      breadcrumb={["Reservations", "New Reservation"]}
    >
      <PageHeader
        title="New reservation"
        description="Multi-room booking with required government ID upload. One confirmation covers every room on this stay."
      />
      <div className="mt-6">
        <NewReservationForm
          propertySlug={propertySlug}
          businessDate={businessDate}
          currency={property.currency}
          roomTypes={roomTypeOptions}
        />
      </div>
    </AppShell>
  );
}
