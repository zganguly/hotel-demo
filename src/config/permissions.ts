export const PERMISSIONS = [
  "dashboard.view",
  "reservation.view",
  "reservation.create",
  "reservation.modify",
  "reservation.cancel",
  "reservation.no_show",
  "reservation.reinstate",
  "front_desk.check_in",
  "front_desk.check_out",
  "front_desk.room_move",
  "guest.view",
  "guest.view_sensitive",
  "guest.export",
  "housekeeping.manage",
  "maintenance.manage",
  "rates.view",
  "rates.update",
  "rates.override",
  "billing.view",
  "billing.post_charge",
  "billing.take_payment",
  "billing.refund",
  "billing.void",
  "cashier.open",
  "cashier.close",
  "night_audit.run",
  "reports.operational",
  "reports.financial",
  "reports.export",
  "admin.property",
  "admin.users",
  "admin.integrations",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type AccountType = "ADMIN" | "MANAGER";

export type UserAccessStatus = "INVITED" | "ACTIVE" | "SUSPENDED";

export interface ApprovalLimits {
  maxDiscountPercent: number;
  maxRefundMinor: number;
  maxRateOverridePercent: number;
  maxWriteOffMinor: number;
}

export interface UserAccess {
  authUserId: string;
  accountType: AccountType;
  status: UserAccessStatus;
  propertyIds: string[];
  permissionPreset?: string;
  permissions: Permission[];
  approvalLimits: ApprovalLimits;
  requireTwoFactor: boolean;
  lastPropertyId?: string;
}

export const BROAD_MANAGER_PERMISSIONS: Permission[] = [...PERMISSIONS].filter(
  (p) => !p.startsWith("admin.") && p !== "audit.view",
);

export const FINANCE_MANAGER_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "billing.view",
  "billing.post_charge",
  "billing.take_payment",
  "billing.refund",
  "billing.void",
  "cashier.open",
  "cashier.close",
  "reports.operational",
  "reports.financial",
  "reports.export",
  "guest.view",
  "reservation.view",
];

export const OPS_MANAGER_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "reservation.view",
  "reservation.create",
  "reservation.modify",
  "reservation.cancel",
  "front_desk.check_in",
  "front_desk.check_out",
  "front_desk.room_move",
  "guest.view",
  "housekeeping.manage",
  "maintenance.manage",
  "rates.view",
];
