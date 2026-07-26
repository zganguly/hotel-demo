import { describe, expect, it } from "vitest";
import { addMoney, formatMoney, money } from "@/lib/money";
import { nightCount, occupiedNights } from "@/lib/dates";
import { authorize } from "@/lib/permissions/authorize";
import { sellableRemaining } from "@/modules/rooms/room.model";
import type { UserAccess } from "@/config/permissions";

describe("money", () => {
  it("adds integer minor units", () => {
    expect(addMoney(money(450000, "INR"), money(10050, "INR"))).toEqual({
      amountMinor: 460050,
      currency: "INR",
    });
  });

  it("formats INR", () => {
    expect(formatMoney(money(450000, "INR"))).toContain("4,500");
  });
});

describe("hotel dates", () => {
  it("uses half-open stay interval", () => {
    expect(occupiedNights("2026-07-24", "2026-07-27")).toEqual([
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
    ]);
    expect(nightCount("2026-07-24", "2026-07-27")).toBe(3);
  });
});

describe("inventory", () => {
  it("computes sellable remaining", () => {
    expect(
      sellableRemaining({
        physicalTotal: 20,
        outOfOrder: 1,
        protected: 0,
        confirmed: 5,
        tentative: 1,
        activeHolds: 2,
        groupHeld: 3,
        groupPickedUp: 1,
        overbookingLimit: 0,
      }),
    ).toBe(9);
  });
});

describe("authorize", () => {
  const manager: UserAccess = {
    authUserId: "u1",
    accountType: "MANAGER",
    status: "ACTIVE",
    propertyIds: ["p1"],
    permissions: ["billing.refund"],
    approvalLimits: {
      maxDiscountPercent: 10,
      maxRefundMinor: 100000,
      maxRateOverridePercent: 15,
      maxWriteOffMinor: 50000,
    },
    requireTwoFactor: false,
  };

  it("allows admin always", () => {
    const result = authorize({
      session: {
        userId: "a1",
        access: { ...manager, accountType: "ADMIN", permissions: [] },
      },
      propertyId: "other",
      permission: "billing.refund",
    });
    expect(result.status).toBe("allowed");
  });

  it("requires approval above refund limit", () => {
    const result = authorize({
      session: { userId: "u1", access: manager },
      propertyId: "p1",
      permission: "billing.refund",
      amountMinor: 250000,
    });
    expect(result).toEqual({
      status: "requires_approval",
      reason: "REFUND_ABOVE_LIMIT",
    });
  });
});
