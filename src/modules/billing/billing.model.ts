import { Schema, model, models, type InferSchemaType } from "mongoose";

const MoneySchema = new Schema(
  {
    amountMinor: { type: Number, required: true },
    currency: { type: String, required: true },
  },
  { _id: false },
);

const FolioSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    publicId: { type: String, required: true, unique: true },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", required: true },
    guestId: { type: Schema.Types.ObjectId, ref: "Guest" },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "TRANSFERRED"],
      default: "OPEN",
    },
    balance: MoneySchema,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: String,
    updatedBy: String,
    version: { type: Number, default: 1 },
  },
  { collection: "folios" },
);

export type FolioDoc = InferSchemaType<typeof FolioSchema>;
export const FolioModel = models.Folio || model("Folio", FolioSchema);

const FolioTransactionSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    folioId: { type: Schema.Types.ObjectId, ref: "Folio", required: true, index: true },
    type: {
      type: String,
      enum: ["CHARGE", "PAYMENT", "REFUND", "ADJUSTMENT", "VOID", "TRANSFER"],
      required: true,
    },
    description: { type: String, required: true },
    amount: MoneySchema,
    businessDate: { type: String, required: true },
    reasonCode: String,
    reversedBy: { type: Schema.Types.ObjectId },
    reverses: { type: Schema.Types.ObjectId },
    createdAt: { type: Date, default: Date.now },
    createdBy: String,
  },
  { collection: "folioTransactions" },
);

export type FolioTransactionDoc = InferSchemaType<typeof FolioTransactionSchema>;
export const FolioTransactionModel =
  models.FolioTransaction || model("FolioTransaction", FolioTransactionSchema);
