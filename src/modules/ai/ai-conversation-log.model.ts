import { Schema, model, models, type InferSchemaType } from "mongoose";

const AiConversationLogSchema = new Schema(
  {
    publicId: { type: String, required: true, unique: true },
    conversationId: { type: String, required: true, index: true },
    propertySlug: { type: String, required: true, index: true },
    provider: { type: String, enum: ["OPENAI", "OPENROUTER"], required: true },
    model: { type: String, required: true },
    requestText: { type: String, required: true },
    responseText: { type: String, required: true },
    requestTokens: { type: Number, required: true, default: 0 },
    responseTokens: { type: Number, required: true, default: 0 },
    totalTokens: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["SUCCESS", "ERROR"], default: "SUCCESS" },
    errorMessage: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "aiConversationLogs" },
);

AiConversationLogSchema.index({ propertySlug: 1, createdAt: -1 });

export type AiConversationLogDoc = InferSchemaType<typeof AiConversationLogSchema>;
export const AiConversationLogModel =
  models.AiConversationLog || model("AiConversationLog", AiConversationLogSchema);
