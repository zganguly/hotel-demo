import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { fail, ok, ERROR_CODES } from "@/lib/errors";
import { searchAvailability } from "@/modules/reservations/reservation.service";

const QuerySchema = z.object({
  propertyId: z.string().min(1),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.coerce.number().int().min(1),
  children: z.coerce.number().int().min(0).optional().default(0),
  currency: z.string().default("INR"),
});

export async function GET(request: NextRequest) {
  try {
    const parsed = QuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    if (!parsed.success) {
      return NextResponse.json(
        fail(ERROR_CODES.VALIDATION, "Invalid availability query", parsed.error.flatten()),
        { status: 400 },
      );
    }

    await connectDb();
    const offers = await searchAvailability(parsed.data);
    return NextResponse.json(ok({ offers }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Availability search failed";
    return NextResponse.json(fail(ERROR_CODES.INTERNAL, message), { status: 500 });
  }
}
