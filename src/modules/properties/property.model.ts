import { Schema, model, models, type InferSchemaType } from "mongoose";

const auditFields = {
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  version: { type: Number, default: 1 },
};

const PropertySchema = new Schema(
  {
    publicId: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    timezone: { type: String, required: true },
    currency: { type: String, required: true, default: "INR" },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "11:00" },
    ...auditFields,
  },
  { collection: "properties" },
);

export type PropertyDoc = InferSchemaType<typeof PropertySchema>;
export const PropertyModel = models.Property || model("Property", PropertySchema);

const UserAccessSchema = new Schema(
  {
    authUserId: { type: String, required: true, unique: true },
    accountType: { type: String, enum: ["ADMIN", "MANAGER"], required: true },
    status: {
      type: String,
      enum: ["INVITED", "ACTIVE", "SUSPENDED"],
      default: "INVITED",
    },
    propertyIds: [{ type: Schema.Types.ObjectId, ref: "Property" }],
    permissionPreset: String,
    permissions: [{ type: String }],
    approvalLimits: {
      maxDiscountPercent: { type: Number, default: 10 },
      maxRefundMinor: { type: Number, default: 500000 },
      maxRateOverridePercent: { type: Number, default: 15 },
      maxWriteOffMinor: { type: Number, default: 100000 },
    },
    requireTwoFactor: { type: Boolean, default: false },
    lastPropertyId: { type: Schema.Types.ObjectId, ref: "Property" },
    email: { type: String, required: true },
    displayName: { type: String, required: true },
    ...auditFields,
  },
  { collection: "userAccess" },
);

export type UserAccessDoc = InferSchemaType<typeof UserAccessSchema>;
export const UserAccessModel =
  models.UserAccess || model("UserAccess", UserAccessSchema);
