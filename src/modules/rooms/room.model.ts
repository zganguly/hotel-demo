import { Schema, model, models, type InferSchemaType } from "mongoose";

const RoomTypeSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    publicId: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    maxOccupancy: { type: Number, required: true },
    maxAdults: { type: Number, required: true },
    maxChildren: { type: Number, default: 0 },
    bedConfiguration: String,
    amenities: [String],
    baseInventory: { type: Number, required: true },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
    imageUrls: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedBy: String,
    version: { type: Number, default: 1 },
  },
  { collection: "roomTypes" },
);

RoomTypeSchema.index({ propertyId: 1, code: 1 }, { unique: true });

export type RoomTypeDoc = InferSchemaType<typeof RoomTypeSchema>;
export const RoomTypeModel = models.RoomType || model("RoomType", RoomTypeSchema);

const RoomSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
    publicId: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    floor: String,
    building: String,
    frontOfficeStatus: {
      type: String,
      enum: ["VACANT", "OCCUPIED", "RESERVED"],
      default: "VACANT",
    },
    housekeepingStatus: {
      type: String,
      enum: ["CLEAN", "DIRTY", "INSPECTED", "PICKUP"],
      default: "CLEAN",
    },
    maintenanceStatus: {
      type: String,
      enum: ["OK", "OUT_OF_ORDER", "OUT_OF_SERVICE"],
      default: "OK",
    },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedBy: String,
    version: { type: Number, default: 1 },
  },
  { collection: "rooms" },
);

RoomSchema.index({ propertyId: 1, number: 1 }, { unique: true });

export type RoomDoc = InferSchemaType<typeof RoomSchema>;
export const RoomModel = models.Room || model("Room", RoomSchema);

const RoomInventoryDaySchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
    date: { type: String, required: true },
    physicalTotal: { type: Number, required: true },
    outOfOrder: { type: Number, default: 0 },
    protected: { type: Number, default: 0 },
    groupHeld: { type: Number, default: 0 },
    groupPickedUp: { type: Number, default: 0 },
    confirmed: { type: Number, default: 0 },
    tentative: { type: Number, default: 0 },
    activeHolds: { type: Number, default: 0 },
    overbookingLimit: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
  },
  { collection: "roomInventoryDays" },
);

RoomInventoryDaySchema.index(
  { propertyId: 1, roomTypeId: 1, date: 1 },
  { unique: true },
);

export type RoomInventoryDayDoc = InferSchemaType<typeof RoomInventoryDaySchema>;
export const RoomInventoryDayModel =
  models.RoomInventoryDay || model("RoomInventoryDay", RoomInventoryDaySchema);

export function sellableRemaining(day: {
  physicalTotal: number;
  outOfOrder: number;
  protected: number;
  confirmed: number;
  tentative: number;
  activeHolds: number;
  groupHeld: number;
  groupPickedUp: number;
  overbookingLimit: number;
  countTentative?: boolean;
}) {
  const tentative = day.countTentative === false ? 0 : day.tentative;
  const unpickedGroup = Math.max(day.groupHeld - day.groupPickedUp, 0);
  return (
    day.physicalTotal -
    day.outOfOrder -
    day.protected -
    day.confirmed -
    tentative -
    day.activeHolds -
    unpickedGroup +
    day.overbookingLimit
  );
}
