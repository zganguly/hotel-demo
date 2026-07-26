import { connectDb } from "@/lib/db";
import { PropertyModel } from "@/modules/properties/property.model";
import { format } from "date-fns";

export async function getPropertyBySlug(slug: string) {
  await connectDb();
  const property = await PropertyModel.findOne({ slug, status: "ACTIVE" }).lean();
  if (!property) {
    return null;
  }
  return property;
}

export function businessDateToday(timeZone = "Asia/Kolkata") {
  // Seed and UI use calendar date in local hotel timezone approximation
  return format(new Date(), "yyyy-MM-dd");
}

export function propertyDisplayName(slug: string, fallbackName?: string) {
  if (fallbackName) return fallbackName;
  return slug === "harbour-view" ? "Harbour View Hotel" : "Garden Court Residences";
}
