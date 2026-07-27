import { randomUUID } from "crypto";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { PropertyModel, UserAccessModel } from "@/modules/properties/property.model";
import {
  RoomInventoryDayModel,
  RoomModel,
  RoomTypeModel,
} from "@/modules/rooms/room.model";
import { GuestModel } from "@/modules/guests/guest.model";
import { ReservationModel } from "@/modules/reservations/reservation.model";
import { FolioModel, FolioTransactionModel } from "@/modules/billing/billing.model";
import {
  BROAD_MANAGER_PERMISSIONS,
  FINANCE_MANAGER_PERMISSIONS,
  OPS_MANAGER_PERMISSIONS,
  PERMISSIONS,
} from "@/config/permissions";
import { money } from "@/lib/money";

/** Deterministic PRNG so re-seeds stay stable for demos */
function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function hotelDate(base: Date, offsetDays: number) {
  return format(addDays(base, offsetDays), "yyyy-MM-dd");
}

const FIRST_NAMES = [
  "Aarav", "Ananya", "Rohan", "Ishita", "Kabir", "Meera", "Dev", "Priya", "Arjun", "Sneha",
  "Vikram", "Nisha", "Aditya", "Kavya", "Rahul", "Pooja", "Siddharth", "Anika", "Harsh", "Diya",
  "Nikhil", "Shreya", "Yash", "Riya", "Kunal", "Tanvi", "Aman", "Neha", "Rajat", "Simran",
  "James", "Emily", "Oliver", "Sophia", "Liam", "Ava", "Noah", "Mia", "Ethan", "Chloe",
  "Hiroshi", "Yuki", "Wei", "Mei", "Omar", "Layla", "Hassan", "Fatima", "Carlos", "Sofia",
];

const LAST_NAMES = [
  "Sharma", "Sen", "Mukherjee", "Banerjee", "Patel", "Singh", "Gupta", "Iyer", "Nair", "Reddy",
  "Das", "Chatterjee", "Joshi", "Kapoor", "Mehta", "Malhotra", "Rao", "Pillai", "Verma", "Khan",
  "Anderson", "Brown", "Chen", "Park", "Nguyen", "Garcia", "Silva", "Rossi", "Müller", "Kim",
];

const CITIES = [
  "Kolkata", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Ahmedabad",
  "Singapore", "Dubai", "London", "Tokyo", "Bangkok", "Sydney",
];

const SOURCES = ["DIRECT", "WALK_IN", "PHONE", "CORPORATE", "AGENT", "OTA"] as const;
const REQUESTS = [
  "High floor",
  "Late checkout",
  "Extra pillows",
  "Airport pickup",
  "Quiet room",
  "Connecting rooms",
  "Baby cot",
  "Vegetarian meals",
];

const RATE_BY_CODE: Record<string, number> = {
  STD: 65000,
  DLX: 95000,
  SUITE: 185000,
};

type RoomTypeSeed = {
  _id: Types.ObjectId;
  code: string;
  name: string;
  baseInventory: number;
};

async function seedPropertyDemo(opts: {
  propertyId: Types.ObjectId;
  propertySlug: string;
  currency: string;
  today: Date;
  seedKey: number;
}) {
  const rng = createRng(opts.seedKey);
  const prefix = opts.propertySlug.slice(0, 3).toUpperCase();

  const types = (await RoomTypeModel.find({ propertyId: opts.propertyId }).lean()) as RoomTypeSeed[];
  const rooms = await RoomModel.find({ propertyId: opts.propertyId }).lean();

  // Guests
  const guestDocs = Array.from({ length: 90 }, (_, index) => {
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const city = pick(rng, CITIES);
    return {
      propertyId: opts.propertyId,
      publicId: randomUUID(),
      firstName,
      lastName,
      email: `${firstName}.${lastName}.${index}@example.com`.toLowerCase(),
      phone: `+91-9${String(100000000 + Math.floor(rng() * 899999999)).slice(0, 9)}`,
      nationality: city.includes(" ") || ["Singapore", "Dubai", "London", "Tokyo", "Bangkok", "Sydney"].includes(city)
        ? "International"
        : "IN",
      vip: rng() < 0.12,
      notes: `Prefers ${pick(rng, ["city view", "garden view", "early check-in", "email invoices"])}. From ${city}.`,
      status: "ACTIVE" as const,
      createdBy: "seed",
      updatedBy: "seed",
      createdAt: addDays(opts.today, -Math.floor(rng() * 120)),
      updatedAt: opts.today,
    };
  });
  const guests = await GuestModel.insertMany(guestDocs);

  // Inventory window: 25 days back → 45 days ahead
  const inventoryDocs = [];
  for (const type of types) {
    for (let d = -25; d <= 45; d += 1) {
      inventoryDocs.push({
        propertyId: opts.propertyId,
        roomTypeId: type._id,
        date: hotelDate(opts.today, d),
        physicalTotal: type.baseInventory,
        outOfOrder: d % 17 === 0 ? 1 : 0,
        protected: 0,
        groupHeld: 0,
        groupPickedUp: 0,
        confirmed: 0,
        tentative: 0,
        activeHolds: 0,
        overbookingLimit: 0,
        version: 1,
      });
    }
  }
  await RoomInventoryDayModel.insertMany(inventoryDocs);

  const inventoryBump = new Map<string, number>();
  const bump = (roomTypeId: string, date: string, qty = 1) => {
    const key = `${roomTypeId}|${date}`;
    inventoryBump.set(key, (inventoryBump.get(key) ?? 0) + qty);
  };

  const reservationDocs: Record<string, unknown>[] = [];
  const folioDocs: Record<string, unknown>[] = [];
  const txnDocs: Record<string, unknown>[] = [];
  let confSeq = 2000;

  const createStay = (params: {
    arrivalOffset: number;
    nights: number;
    status: string;
    source?: (typeof SOURCES)[number];
  }) => {
    const roomType = pick(rng, types);
    const guest = pick(rng, guests);
    const arrivalDate = hotelDate(opts.today, params.arrivalOffset);
    const departureDate = hotelDate(opts.today, params.arrivalOffset + params.nights);
    const nightly = RATE_BY_CODE[roomType.code] ?? 65000;
    const weekendBoost =
      [5, 6].includes(parseISO(arrivalDate).getDay()) ||
      [5, 6].includes(parseISO(departureDate).getDay())
        ? 1.12
        : 1;
    const grossMinor = Math.round(nightly * params.nights * weekendBoost);
    const discountMinor = rng() < 0.18 ? Math.round(grossMinor * 0.08) : 0;
    const netMinor = grossMinor - discountMinor;
    const taxMinor = Math.round(netMinor * 0.18);
    const totalMinor = netMinor + taxMinor;
    const confirmationNumber = `${prefix}-${confSeq++}`;
    const reservationId = new Types.ObjectId();
    const folioId = new Types.ObjectId();
    const adults = roomType.code === "SUITE" ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2);
    const children = rng() < 0.25 ? 1 : 0;
    const source = params.source ?? pick(rng, [...SOURCES]);
    const specialRequests =
      rng() < 0.35 ? [pick(rng, REQUESTS), ...(rng() < 0.3 ? [pick(rng, REQUESTS)] : [])] : [];

    for (let n = 0; n < params.nights; n += 1) {
      bump(String(roomType._id), hotelDate(opts.today, params.arrivalOffset + n));
    }

    reservationDocs.push({
      _id: reservationId,
      propertyId: opts.propertyId,
      publicId: randomUUID(),
      confirmationNumber,
      status: params.status,
      source,
      arrivalDate,
      departureDate,
      guestId: guest._id,
      adults,
      children,
      notes: rng() < 0.2 ? "Corporate billing to company account." : undefined,
      specialRequests,
      rateSnapshot: {
        roomTypeCode: roomType.code,
        roomTypeName: roomType.name,
        nightlyMinor: nightly,
        currency: opts.currency,
      },
      taxSnapshot: { gstPercent: 18 },
      policySnapshot: { cancellation: "Free until 24h before arrival" },
      totals: {
        gross: money(grossMinor, opts.currency),
        discount: money(discountMinor, opts.currency),
        net: money(netMinor, opts.currency),
        tax: money(taxMinor, opts.currency),
        total: money(totalMinor, opts.currency),
      },
      createdBy: "seed",
      updatedBy: "seed",
      createdAt: addDays(parseISO(arrivalDate), -Math.floor(rng() * 20) - 1),
      updatedAt: opts.today,
      version: 1,
    });

    const closed = params.status === "CHECKED_OUT";
    const cancelled = params.status === "CANCELLED" || params.status === "NO_SHOW";
    const paidMinor = cancelled
      ? Math.round(totalMinor * (params.status === "NO_SHOW" ? 0.4 : 0.1))
      : closed
        ? totalMinor
        : params.status === "CHECKED_IN"
          ? Math.round(totalMinor * 0.5)
          : Math.round(totalMinor * (0.2 + rng() * 0.3));
    const balanceMinor = cancelled ? 0 : Math.max(totalMinor - paidMinor, 0);

    folioDocs.push({
      _id: folioId,
      propertyId: opts.propertyId,
      publicId: randomUUID(),
      reservationId,
      guestId: guest._id,
      status: closed || cancelled ? "CLOSED" : "OPEN",
      balance: money(balanceMinor, opts.currency),
      createdBy: "seed",
      updatedBy: "seed",
      createdAt: parseISO(arrivalDate),
      updatedAt: opts.today,
      version: 1,
    });

    if (!cancelled) {
      txnDocs.push({
        propertyId: opts.propertyId,
        folioId,
        type: "CHARGE",
        description: `Room charge · ${roomType.name} · ${params.nights} night(s)`,
        amount: money(totalMinor, opts.currency),
        businessDate: arrivalDate,
        createdBy: "seed",
        createdAt: parseISO(arrivalDate),
      });
    }

    if (paidMinor > 0) {
      txnDocs.push({
        propertyId: opts.propertyId,
        folioId,
        type: "PAYMENT",
        description: closed
          ? "Settlement payment · card"
          : cancelled
            ? "Cancellation / no-show fee"
            : "Advance deposit",
        amount: money(paidMinor, opts.currency),
        businessDate: closed
          ? departureDate
          : hotelDate(opts.today, Math.min(params.arrivalOffset, 0)),
        createdBy: "seed",
        createdAt: addDays(parseISO(arrivalDate), closed ? params.nights : -1),
      });
    }

    if (closed && rng() < 0.45) {
      const miniBar = 15000 + Math.floor(rng() * 35000);
      txnDocs.push({
        propertyId: opts.propertyId,
        folioId,
        type: "CHARGE",
        description: pick(rng, ["Minibar", "Laundry", "Breakfast upgrade", "Late checkout fee"]),
        amount: money(miniBar, opts.currency),
        businessDate: hotelDate(opts.today, params.arrivalOffset + Math.max(params.nights - 1, 0)),
        createdBy: "seed",
        createdAt: parseISO(departureDate),
      });
      txnDocs.push({
        propertyId: opts.propertyId,
        folioId,
        type: "PAYMENT",
        description: "Ancillary settlement",
        amount: money(miniBar, opts.currency),
        businessDate: departureDate,
        createdBy: "seed",
        createdAt: parseISO(departureDate),
      });
    }
  };

  // Past 20 days history (departures ending in the past window)
  for (let day = -20; day <= -1; day += 1) {
    const arrivalsToday = 3 + Math.floor(rng() * 5);
    for (let i = 0; i < arrivalsToday; i += 1) {
      const roll = rng();
      const status =
        roll < 0.08 ? "CANCELLED" : roll < 0.12 ? "NO_SHOW" : "CHECKED_OUT";
      createStay({
        arrivalOffset: day,
        nights: 1 + Math.floor(rng() * 3),
        status,
      });
    }
  }

  // Currently in-house (arrived earlier, departs later)
  for (let i = 0; i < 18; i += 1) {
    const nights = 2 + Math.floor(rng() * 4);
    const arrivalOffset = -(1 + Math.floor(rng() * Math.min(nights - 1, 3)));
    createStay({
      arrivalOffset,
      nights,
      status: "CHECKED_IN",
      source: pick(rng, ["DIRECT", "OTA", "CORPORATE", "WALK_IN"]),
    });
  }

  // Today's arrivals / departures flavor
  for (let i = 0; i < 8; i += 1) {
    createStay({
      arrivalOffset: 0,
      nights: 1 + Math.floor(rng() * 3),
      status: rng() < 0.7 ? "CONFIRMED" : "CHECKED_IN",
    });
  }

  // Coming 30 days bookings
  for (let day = 1; day <= 30; day += 1) {
    const arrivals = 4 + Math.floor(rng() * 6);
    for (let i = 0; i < arrivals; i += 1) {
      const roll = rng();
      const status =
        roll < 0.05 ? "OPTION" : roll < 0.08 ? "WAITLIST" : roll < 0.12 ? "INQUIRY" : "CONFIRMED";
      createStay({
        arrivalOffset: day,
        nights: 1 + Math.floor(rng() * 4),
        status,
        source: pick(rng, ["DIRECT", "OTA", "CORPORATE", "AGENT", "PHONE"]),
      });
    }
  }

  await ReservationModel.insertMany(reservationDocs);
  await FolioModel.insertMany(folioDocs);
  await FolioTransactionModel.insertMany(txnDocs);

  // Apply confirmed inventory counters (cap at physical)
  for (const [key, count] of inventoryBump.entries()) {
    const [roomTypeId, date] = key.split("|");
    const day = await RoomInventoryDayModel.findOne({
      propertyId: opts.propertyId,
      roomTypeId,
      date,
    });
    if (!day) continue;
    day.confirmed = Math.min(day.physicalTotal, count);
    await day.save();
  }

  // Mark some physical rooms occupied / dirty for realism
  const occupiedRooms = rooms.slice(0, 18);
  for (const room of occupiedRooms) {
    await RoomModel.updateOne(
      { _id: room._id },
      {
        $set: {
          frontOfficeStatus: "OCCUPIED",
          housekeepingStatus: rng() < 0.3 ? "DIRTY" : "CLEAN",
          updatedAt: opts.today,
        },
      },
    );
  }
  for (const room of rooms.slice(18, 28)) {
    await RoomModel.updateOne(
      { _id: room._id },
      {
        $set: {
          housekeepingStatus: "DIRTY",
          frontOfficeStatus: "VACANT",
          updatedAt: opts.today,
        },
      },
    );
  }

  return {
    guests: guests.length,
    reservations: reservationDocs.length,
    folios: folioDocs.length,
    transactions: txnDocs.length,
  };
}

async function seed() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Demo seed blocked in production");
  }

  const demoPassword = process.env.DEMO_SEED_PASSWORD ?? "demo-password";

  await connectDb();
  const today = new Date();

  const db = (await import("mongoose")).default.connection.db;
  if (db) {
    await Promise.all(
      ["user", "session", "account", "verification"].map((collection) =>
        db.collection(collection).deleteMany({}),
      ),
    );
  }

  await Promise.all([
    PropertyModel.deleteMany({}),
    UserAccessModel.deleteMany({}),
    RoomTypeModel.deleteMany({}),
    RoomModel.deleteMany({}),
    RoomInventoryDayModel.deleteMany({}),
    GuestModel.deleteMany({}),
    ReservationModel.deleteMany({}),
    FolioModel.deleteMany({}),
    FolioTransactionModel.deleteMany({}),
  ]);

  const kolkata = await PropertyModel.create({
    publicId: randomUUID(),
    slug: "harbour-view",
    name: "Harbour View Hotel",
    timezone: "Asia/Kolkata",
    currency: "INR",
    createdBy: "seed",
    updatedBy: "seed",
  });

  const goa = await PropertyModel.create({
    publicId: randomUUID(),
    slug: "garden-court",
    name: "Garden Court Residences",
    timezone: "Asia/Kolkata",
    currency: "INR",
    createdBy: "seed",
    updatedBy: "seed",
  });

  const users = [
    {
      email: "admin@aureliastay.example",
      displayName: "Aurelia Admin",
      accountType: "ADMIN" as const,
      propertyIds: [kolkata._id, goa._id],
      permissions: [...PERMISSIONS],
      requireTwoFactor: true,
    },
    {
      email: "manager.kolkata@aureliastay.example",
      displayName: "Kolkata Manager",
      accountType: "MANAGER" as const,
      propertyIds: [kolkata._id],
      permissions: BROAD_MANAGER_PERMISSIONS,
    },
    {
      email: "manager.goa@aureliastay.example",
      displayName: "Goa Manager",
      accountType: "MANAGER" as const,
      propertyIds: [goa._id],
      permissions: BROAD_MANAGER_PERMISSIONS,
    },
    {
      email: "finance.manager@aureliastay.example",
      displayName: "Finance Manager",
      accountType: "MANAGER" as const,
      propertyIds: [kolkata._id],
      permissions: FINANCE_MANAGER_PERMISSIONS,
    },
    {
      email: "ops.manager@aureliastay.example",
      displayName: "Ops Manager",
      accountType: "MANAGER" as const,
      propertyIds: [kolkata._id],
      permissions: OPS_MANAGER_PERMISSIONS,
    },
  ];

  for (const user of users) {
    await auth.api.signUpEmail({
      body: {
        email: user.email,
        password: demoPassword,
        name: user.displayName,
      },
    });
  }

  for (const user of users) {
    await UserAccessModel.create({
      authUserId: `seed:${user.email}`,
      email: user.email,
      displayName: user.displayName,
      accountType: user.accountType,
      status: "ACTIVE",
      propertyIds: user.propertyIds,
      permissions: user.permissions,
      requireTwoFactor: user.requireTwoFactor ?? false,
      createdBy: "seed",
      updatedBy: "seed",
    });
  }

  for (const property of [kolkata, goa]) {
    const types = await RoomTypeModel.insertMany([
      {
        propertyId: property._id,
        publicId: randomUUID(),
        code: "STD",
        name: "Standard King",
        maxOccupancy: 2,
        maxAdults: 2,
        baseInventory: 20,
        createdBy: "seed",
        updatedBy: "seed",
      },
      {
        propertyId: property._id,
        publicId: randomUUID(),
        code: "DLX",
        name: "Deluxe Twin",
        maxOccupancy: 3,
        maxAdults: 2,
        maxChildren: 1,
        baseInventory: 15,
        createdBy: "seed",
        updatedBy: "seed",
      },
      {
        propertyId: property._id,
        publicId: randomUUID(),
        code: "SUITE",
        name: property.slug === "harbour-view" ? "Harbour Suite" : "Garden Suite",
        maxOccupancy: 4,
        maxAdults: 3,
        maxChildren: 1,
        baseInventory: 8,
        createdBy: "seed",
        updatedBy: "seed",
      },
    ]);

    let roomCounter = 100;
    const roomDocs = [];
    for (const type of types) {
      for (let i = 0; i < type.baseInventory; i += 1) {
        roomCounter += 1;
        roomDocs.push({
          propertyId: property._id,
          roomTypeId: type._id,
          publicId: randomUUID(),
          number: String(roomCounter),
          floor: String(Math.floor(roomCounter / 100)),
          frontOfficeStatus: "VACANT",
          housekeepingStatus: "CLEAN",
          maintenanceStatus: "OK",
          status: "ACTIVE",
          createdBy: "seed",
          updatedBy: "seed",
        });
      }
    }
    await RoomModel.insertMany(roomDocs);

    const stats = await seedPropertyDemo({
      propertyId: property._id as Types.ObjectId,
      propertySlug: property.slug,
      currency: property.currency,
      today,
      seedKey: property.slug === "harbour-view" ? 4242 : 7878,
    });

    console.log(
      `${property.name}: ${stats.guests} guests, ${stats.reservations} reservations, ${stats.folios} folios, ${stats.transactions} ledger lines`,
    );
  }

  // Sanity: day span covered
  const sample = await ReservationModel.findOne({}).lean();
  if (sample) {
    const span = differenceInCalendarDays(
      parseISO(String((await ReservationModel.find().sort({ arrivalDate: -1 }).limit(1).lean())[0]
        ?.arrivalDate)),
      parseISO(String((await ReservationModel.find().sort({ arrivalDate: 1 }).limit(1).lean())[0]
        ?.arrivalDate)),
    );
    console.log(`Arrival date span across seed ≈ ${span} days`);
  }

  console.log("Seed complete");
  console.log(`Demo password: ${demoPassword}`);
  console.log("Demo users:");
  for (const user of users) console.log(` - ${user.email}`);
  console.log("Properties: harbour-view, garden-court");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
