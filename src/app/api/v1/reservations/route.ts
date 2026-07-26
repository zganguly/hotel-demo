import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { fail, ok, ERROR_CODES } from "@/lib/errors";
import { money } from "@/lib/money";
import { nightCount } from "@/lib/dates";
import { PropertyModel } from "@/modules/properties/property.model";
import { RoomTypeModel } from "@/modules/rooms/room.model";
import { GuestModel } from "@/modules/guests/guest.model";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { FolioModel, FolioTransactionModel } from "@/modules/billing/billing.model";

export const runtime = "nodejs";

const RoomSelectionSchema = z.object({
  roomTypeId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  adults: z.number().int().min(1).max(12),
  children: z.number().int().min(0).max(12).default(0),
});

const PayloadSchema = z.object({
  propertySlug: z.string().min(1),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(["DIRECT", "WALK_IN", "PHONE", "CORPORATE", "AGENT", "GROUP", "OTA"]),
  specialRequests: z.string().trim().max(1000).optional().or(z.literal("")),
  documentType: z.enum(["AADHAAR", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "OTHER"]),
  documentNumber: z.string().trim().min(4).max(40),
  rooms: z.array(RoomSelectionSchema).min(1, "Select at least one room"),
});

const RATE_BY_CODE: Record<string, number> = {
  STD: 65000,
  DLX: 95000,
  SUITE: 185000,
};

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function last4(value: string) {
  const cleaned = value.replace(/\s+/g, "");
  return cleaned.slice(-4);
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const roomsRaw = String(form.get("rooms") ?? "[]");
    let roomsParsed: unknown;
    try {
      roomsParsed = JSON.parse(roomsRaw);
    } catch {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "Invalid rooms payload"),
        { status: 400 },
      );
    }

    const parsed = PayloadSchema.safeParse({
      propertySlug: form.get("propertySlug"),
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email") ?? "",
      phone: form.get("phone") ?? "",
      arrivalDate: form.get("arrivalDate"),
      departureDate: form.get("departureDate"),
      source: form.get("source"),
      specialRequests: form.get("specialRequests") ?? "",
      documentType: form.get("documentType"),
      documentNumber: form.get("documentNumber"),
      rooms: roomsParsed,
    });

    if (!parsed.success) {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "Invalid reservation payload", parsed.error.flatten()),
        { status: 400 },
      );
    }

    const data = parsed.data;
    if (data.departureDate <= data.arrivalDate) {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "Departure must be after arrival"),
        { status: 400 },
      );
    }

    const idFile = form.get("idDocument");
    if (!(idFile instanceof File) || idFile.size === 0) {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "Government ID card upload is required"),
        { status: 400 },
      );
    }
    if (!ALLOWED_MIME.has(idFile.type)) {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "ID must be JPG, PNG, WEBP, or PDF"),
        { status: 400 },
      );
    }
    if (idFile.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "ID file must be under 8 MB"),
        { status: 400 },
      );
    }

    await connectDb();
    const property = await PropertyModel.findOne({
      slug: data.propertySlug,
      status: "ACTIVE",
    }).lean();
    if (!property) {
      return NextResponse.json(fail(ERROR_CODES.NOT_FOUND, "Property not found"), {
        status: 404,
      });
    }

    const roomTypeIds = data.rooms.map((r) => r.roomTypeId);
    const roomTypes = await RoomTypeModel.find({
      propertyId: property._id,
      _id: { $in: roomTypeIds },
      status: "ACTIVE",
    }).lean();
    const typeMap = new Map(roomTypes.map((t) => [String(t._id), t]));

    if (roomTypes.length !== new Set(roomTypeIds).size) {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "One or more room types are invalid"),
        { status: 400 },
      );
    }

    const nights = nightCount(data.arrivalDate, data.departureDate);
    const currency = property.currency;
    const roomLines = data.rooms.map((selection) => {
      const type = typeMap.get(selection.roomTypeId)!;
      const nightlyMinor = RATE_BY_CODE[type.code] ?? 65000;
      return {
        roomTypeId: type._id,
        roomTypeCode: type.code,
        roomTypeName: type.name,
        quantity: selection.quantity,
        adults: selection.adults,
        children: selection.children,
        nightlyMinor,
      };
    });

    const adults = roomLines.reduce((sum, r) => sum + r.adults * r.quantity, 0);
    const children = roomLines.reduce((sum, r) => sum + r.children * r.quantity, 0);
    const grossMinor = roomLines.reduce(
      (sum, r) => sum + r.nightlyMinor * r.quantity * nights,
      0,
    );
    const taxMinor = Math.round(grossMinor * 0.18);
    const totalMinor = grossMinor + taxMinor;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "id-docs");
    await mkdir(uploadDir, { recursive: true });
    const ext =
      idFile.type === "application/pdf"
        ? "pdf"
        : idFile.type === "image/png"
          ? "png"
          : idFile.type === "image/webp"
            ? "webp"
            : "jpg";
    const storedName = `${randomUUID()}.${ext}`;
    const absolutePath = path.join(uploadDir, storedName);
    const bytes = Buffer.from(await idFile.arrayBuffer());
    await writeFile(absolutePath, bytes);
    const storagePath = `/uploads/id-docs/${storedName}`;

    const guest = await GuestModel.create({
      propertyId: property._id,
      publicId: randomUUID(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      createdBy: "front-desk",
      updatedBy: "front-desk",
    });

    const prefix = property.slug.slice(0, 3).toUpperCase();
    const confirmationNumber = `${prefix}-${Date.now().toString().slice(-6)}`;
    const specialRequests = data.specialRequests
      ? data.specialRequests
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const reservation = await ReservationModel.create({
      propertyId: property._id,
      publicId: randomUUID(),
      confirmationNumber,
      status: "CONFIRMED",
      source: data.source,
      arrivalDate: data.arrivalDate,
      departureDate: data.departureDate,
      guestId: guest._id,
      adults,
      children,
      rooms: roomLines,
      identityDocument: {
        documentType: data.documentType,
        holderName: `${data.firstName} ${data.lastName}`,
        documentNumberLast4: last4(data.documentNumber),
        fileName: idFile.name,
        mimeType: idFile.type,
        storagePath,
        fileSizeBytes: idFile.size,
        uploadedAt: new Date(),
      },
      specialRequests,
      rateSnapshot: {
        nights,
        rooms: roomLines.map((r) => ({
          code: r.roomTypeCode,
          name: r.roomTypeName,
          quantity: r.quantity,
          nightlyMinor: r.nightlyMinor,
        })),
        currency,
      },
      taxSnapshot: { gstPercent: 18 },
      policySnapshot: { cancellation: "Free until 24h before arrival", idRequired: true },
      totals: {
        gross: money(grossMinor, currency),
        discount: money(0, currency),
        net: money(grossMinor, currency),
        tax: money(taxMinor, currency),
        total: money(totalMinor, currency),
      },
      createdBy: "front-desk",
      updatedBy: "front-desk",
    });

    const folio = await FolioModel.create({
      propertyId: property._id,
      publicId: randomUUID(),
      reservationId: reservation._id,
      guestId: guest._id,
      status: "OPEN",
      balance: money(totalMinor, currency),
      createdBy: "front-desk",
      updatedBy: "front-desk",
    });

    await FolioTransactionModel.create({
      propertyId: property._id,
      folioId: folio._id,
      type: "CHARGE",
      description: `Room charge · ${roomLines.map((r) => `${r.quantity}× ${r.roomTypeName}`).join(", ")} · ${nights} night(s)`,
      amount: money(totalMinor, currency),
      businessDate: data.arrivalDate,
      createdBy: "front-desk",
    });

    return NextResponse.json(
      ok({
        publicId: reservation.publicId,
        confirmationNumber: reservation.confirmationNumber,
        guestName: `${guest.firstName} ${guest.lastName}`,
        roomCount: roomLines.reduce((sum, r) => sum + r.quantity, 0),
        total: money(totalMinor, currency),
      }),
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reservation create failed";
    return NextResponse.json(fail(ERROR_CODES.INTERNAL, message), { status: 500 });
  }
}
