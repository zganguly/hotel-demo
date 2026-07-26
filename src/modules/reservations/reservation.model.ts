import { Schema, model, models, type InferSchemaType } from "mongoose";

const MoneySchema = new Schema(
  {
    amountMinor: { type: Number, required: true },
    currency: { type: String, required: true },
  },
  { _id: false },
);

const ReservationRoomSchema = new Schema(
  {
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
    roomTypeCode: { type: String, required: true },
    roomTypeName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0 },
    nightlyMinor: { type: Number, required: true },
  },
  { _id: true },
);

/** Identity document metadata only — never log full document numbers. */
const IdentityDocumentSchema = new Schema(
  {
    documentType: {
      type: String,
      enum: ["AADHAAR", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "OTHER"],
      required: true,
    },
    holderName: { type: String, required: true },
    documentNumberLast4: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    storagePath: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ReservationSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    publicId: { type: String, required: true, unique: true },
    confirmationNumber: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "INQUIRY",
        "OPTION",
        "WAITLIST",
        "CONFIRMED",
        "CHECKED_IN",
        "CHECKED_OUT",
        "CANCELLED",
        "NO_SHOW",
      ],
      default: "CONFIRMED",
    },
    source: {
      type: String,
      enum: ["DIRECT", "WALK_IN", "PHONE", "CORPORATE", "AGENT", "GROUP", "OTA"],
      required: true,
    },
    arrivalDate: { type: String, required: true },
    departureDate: { type: String, required: true },
    guestId: { type: Schema.Types.ObjectId, ref: "Guest" },
    companyId: { type: Schema.Types.ObjectId },
    agentId: { type: Schema.Types.ObjectId },
    groupId: { type: Schema.Types.ObjectId },
    adults: { type: Number, required: true },
    children: { type: Number, default: 0 },
    rooms: { type: [ReservationRoomSchema], default: [] },
    identityDocument: IdentityDocumentSchema,
    notes: String,
    specialRequests: [String],
    rateSnapshot: { type: Schema.Types.Mixed },
    taxSnapshot: { type: Schema.Types.Mixed },
    policySnapshot: { type: Schema.Types.Mixed },
    totals: {
      gross: MoneySchema,
      discount: MoneySchema,
      net: MoneySchema,
      tax: MoneySchema,
      total: MoneySchema,
    },
    idempotencyKey: { type: String, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedBy: String,
    version: { type: Number, default: 1 },
  },
  { collection: "reservations" },
);

ReservationSchema.index({ propertyId: 1, confirmationNumber: 1 }, { unique: true });
ReservationSchema.index({ propertyId: 1, arrivalDate: 1, status: 1 });

export type ReservationDoc = InferSchemaType<typeof ReservationSchema>;
export const ReservationModel =
  models.Reservation || model("Reservation", ReservationSchema);

const BookingHoldSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    holdToken: { type: String, required: true, unique: true },
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
    quantity: { type: Number, required: true, default: 1 },
    arrivalDate: { type: String, required: true },
    departureDate: { type: String, required: true },
    guestFingerprint: String,
    priceSnapshot: { type: Schema.Types.Mixed },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "CONSUMED", "EXPIRED", "RELEASED"],
      default: "ACTIVE",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "bookingHolds" },
);

BookingHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type BookingHoldDoc = InferSchemaType<typeof BookingHoldSchema>;
export const BookingHoldModel =
  models.BookingHold || model("BookingHold", BookingHoldSchema);

const RoomNightAssignmentSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    date: { type: String, required: true },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", required: true },
    reservationRoomId: { type: Schema.Types.ObjectId },
    status: { type: String, enum: ["ACTIVE", "RELEASED"], default: "ACTIVE" },
  },
  { collection: "roomNightAssignments" },
);

RoomNightAssignmentSchema.index(
  { propertyId: 1, roomId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "ACTIVE" },
  },
);

export type RoomNightAssignmentDoc = InferSchemaType<typeof RoomNightAssignmentSchema>;
export const RoomNightAssignmentModel =
  models.RoomNightAssignment ||
  model("RoomNightAssignment", RoomNightAssignmentSchema);
