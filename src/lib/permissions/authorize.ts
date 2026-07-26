import type { AccountType, ApprovalLimits, Permission, UserAccess } from "@/config/permissions";

export type AuthorizeInput = {
  session: {
    userId: string;
    access: UserAccess;
  };
  propertyId: string;
  permission: Permission;
  amountMinor?: number;
  discountPercent?: number;
  rateOverridePercent?: number;
  writeOffMinor?: number;
};

export type AuthorizeResult =
  | { status: "allowed" }
  | { status: "denied"; reason: string }
  | { status: "requires_approval"; reason: string };

function withinLimit(
  limits: ApprovalLimits,
  input: AuthorizeInput,
): { ok: true } | { ok: false; reason: string } {
  if (
    input.permission === "billing.refund" &&
    typeof input.amountMinor === "number" &&
    input.amountMinor > limits.maxRefundMinor
  ) {
    return { ok: false, reason: "REFUND_ABOVE_LIMIT" };
  }
  if (
    typeof input.discountPercent === "number" &&
    input.discountPercent > limits.maxDiscountPercent
  ) {
    return { ok: false, reason: "DISCOUNT_ABOVE_LIMIT" };
  }
  if (
    typeof input.rateOverridePercent === "number" &&
    input.rateOverridePercent > limits.maxRateOverridePercent
  ) {
    return { ok: false, reason: "RATE_OVERRIDE_ABOVE_LIMIT" };
  }
  if (
    typeof input.writeOffMinor === "number" &&
    input.writeOffMinor > limits.maxWriteOffMinor
  ) {
    return { ok: false, reason: "WRITEOFF_ABOVE_LIMIT" };
  }
  return { ok: true };
}

export function authorize(input: AuthorizeInput): AuthorizeResult {
  const { access } = input.session;

  if (access.status !== "ACTIVE") {
    return { status: "denied", reason: "ACCOUNT_NOT_ACTIVE" };
  }

  if (access.accountType === "ADMIN") {
    return { status: "allowed" };
  }

  if (!access.propertyIds.includes(input.propertyId)) {
    return { status: "denied", reason: "PROPERTY_OUT_OF_SCOPE" };
  }

  if (!access.permissions.includes(input.permission)) {
    return { status: "denied", reason: "PERMISSION_MISSING" };
  }

  const limit = withinLimit(access.approvalLimits, input);
  if (!limit.ok) {
    return { status: "requires_approval", reason: limit.reason };
  }

  return { status: "allowed" };
}

export function isAdmin(accountType: AccountType) {
  return accountType === "ADMIN";
}
