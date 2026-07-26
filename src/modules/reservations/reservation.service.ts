import { occupiedNights } from "@/lib/dates";
import { money, type Money } from "@/lib/money";
import {
  RoomInventoryDayModel,
  RoomTypeModel,
  sellableRemaining,
} from "@/modules/rooms/room.model";

export type AvailabilitySearchInput = {
  propertyId: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children?: number;
  currency: string;
};

export type AvailabilityOffer = {
  roomTypeId: string;
  roomTypeCode: string;
  roomTypeName: string;
  maxSellable: number;
  nightlyRate: Money;
  nights: number;
  total: Money;
};

export async function searchAvailability(
  input: AvailabilitySearchInput,
): Promise<AvailabilityOffer[]> {
  const nights = occupiedNights(input.arrivalDate, input.departureDate);
  const roomTypes = await RoomTypeModel.find({
    propertyId: input.propertyId,
    status: "ACTIVE",
    maxOccupancy: { $gte: input.adults + (input.children ?? 0) },
  }).lean();

  const offers: AvailabilityOffer[] = [];

  for (const roomType of roomTypes) {
    const days = await RoomInventoryDayModel.find({
      propertyId: input.propertyId,
      roomTypeId: roomType._id,
      date: { $in: nights },
    }).lean();

    if (days.length !== nights.length) {
      continue;
    }

    const remaining = days.map((day) => sellableRemaining(day));
    const maxSellable = Math.min(...remaining);
    if (maxSellable <= 0) continue;

    // Demo base rates by code until rate calendar is fully wired
    const baseMinor =
      roomType.code === "SUITE" ? 185000 : roomType.code === "DLX" ? 95000 : 65000;
    const nightlyRate = money(baseMinor, input.currency);
    const total = money(baseMinor * nights.length, input.currency);

    offers.push({
      roomTypeId: String(roomType._id),
      roomTypeCode: roomType.code,
      roomTypeName: roomType.name,
      maxSellable,
      nightlyRate,
      nights: nights.length,
      total,
    });
  }

  return offers;
}
