import { Schema, model, models, type InferSchemaType } from "mongoose";

const OutboxEventSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "DEAD"],
      default: "PENDING",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    availableAt: { type: Date, default: Date.now, index: true },
    lastError: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "outboxEvents" },
);

export type OutboxEventDoc = InferSchemaType<typeof OutboxEventSchema>;
export const OutboxEventModel =
  models.OutboxEvent || model("OutboxEvent", OutboxEventSchema);

const JobSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
    type: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["PENDING", "LEASED", "COMPLETED", "FAILED", "DEAD"],
      default: "PENDING",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 8 },
    availableAt: { type: Date, default: Date.now, index: true },
    leasedUntil: Date,
    leaseOwner: String,
    lastError: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "jobs" },
);

export type JobDoc = InferSchemaType<typeof JobSchema>;
export const JobModel = models.Job || model("Job", JobSchema);

const AuditEventSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
    actorUserId: String,
    action: { type: String, required: true },
    targetType: String,
    targetId: String,
    reasonCode: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "auditEvents" },
);

AuditEventSchema.index({ propertyId: 1, createdAt: -1 });

export type AuditEventDoc = InferSchemaType<typeof AuditEventSchema>;
export const AuditEventModel =
  models.AuditEvent || model("AuditEvent", AuditEventSchema);

const ApprovalRequestSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    requesterId: { type: String, required: true },
    actionType: { type: String, required: true },
    targetType: String,
    targetId: String,
    currentValue: Schema.Types.Mixed,
    proposedValue: Schema.Types.Mixed,
    reason: { type: String, required: true },
    amountMinor: Number,
    percentage: Number,
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED", "EXECUTED"],
      default: "PENDING",
    },
    reviewerId: String,
    decisionReason: String,
    expiresAt: Date,
    idempotencyKey: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "approvalRequests" },
);

export type ApprovalRequestDoc = InferSchemaType<typeof ApprovalRequestSchema>;
export const ApprovalRequestModel =
  models.ApprovalRequest || model("ApprovalRequest", ApprovalRequestSchema);
