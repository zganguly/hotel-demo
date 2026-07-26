import { Schema, model, models, type InferSchemaType } from "mongoose";

const GuestSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    publicId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: String,
    phone: String,
    nationality: String,
    vip: { type: Boolean, default: false },
    notes: String,
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedBy: String,
  },
  { collection: "guests" },
);

GuestSchema.index({ propertyId: 1, email: 1 });
GuestSchema.index({ propertyId: 1, lastName: 1, firstName: 1 });

export type GuestDoc = InferSchemaType<typeof GuestSchema>;
export const GuestModel = models.Guest || model("Guest", GuestSchema);
