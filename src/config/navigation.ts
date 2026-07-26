import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  BrainCircuit,
  Building2,
  CalendarDays,
  ClipboardList,
  FileBarChart2,
  HandCoins,
  Hotel,
  LayoutDashboard,
  MoonStar,
  Package,
  Settings2,
  Shield,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  badgeKey?: "arrivals" | "roomQueue" | "maintenance" | "approvals";
  highlighted?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  highlighted?: boolean;
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "ai-analysis",
    label: "AI Analysis",
    icon: BrainCircuit,
    highlighted: true,
    items: [
      {
        label: "AI Analysis",
        href: "ai-analysis",
        icon: BrainCircuit,
        highlighted: true,
      },
    ],
  },
  {
    id: "reservations",
    label: "Reservations",
    icon: ClipboardList,
    items: [
      { label: "All Reservations", href: "reservations" },
      { label: "Full Calendar", href: "calendar", icon: CalendarDays },
      { label: "New Reservation", href: "reservations/new" },
      { label: "Waitlist & Quotes", href: "reservations/waitlist" },
      { label: "Groups", href: "groups" },
    ],
  },
  {
    id: "front-desk",
    label: "Front Desk",
    icon: Hotel,
    items: [
      { label: "Arrivals", href: "front-desk/arrivals", badgeKey: "arrivals" },
      { label: "In House", href: "front-desk/in-house" },
      { label: "Departures", href: "front-desk/departures" },
      { label: "Room Queue", href: "front-desk/room-queue", badgeKey: "roomQueue" },
    ],
  },
  {
    id: "rooms-ops",
    label: "Rooms & Operations",
    icon: BedDouble,
    items: [
      { label: "Room Status", href: "rooms/status" },
      { label: "Housekeeping", href: "housekeeping" },
      { label: "Maintenance", href: "maintenance", badgeKey: "maintenance" },
      { label: "Guest Requests", href: "requests" },
      { label: "Lost & Found", href: "requests/lost-and-found" },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: HandCoins,
    items: [
      { label: "Rates & Inventory", href: "rates" },
      { label: "Packages & Promotions", href: "rates/packages" },
      { label: "Distribution Channels", href: "rates/channels" },
    ],
  },
  {
    id: "guests",
    label: "Guests & Accounts",
    icon: Users,
    items: [
      { label: "Guest Profiles", href: "guests" },
      { label: "Companies", href: "guests/companies" },
      { label: "Travel Agents", href: "guests/agents" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: FileBarChart2,
    items: [
      { label: "Folios & Payments", href: "billing" },
      { label: "Cashier Shifts", href: "billing/cashier" },
      { label: "Accounts Receivable", href: "billing/ar" },
      { label: "Night Audit", href: "night-audit", icon: MoonStar },
    ],
  },
  {
    id: "hotel-ops",
    label: "Hotel Operations",
    icon: Package,
    items: [
      { label: "Stock & Purchasing", href: "stock" },
      { label: "Staff & Handover", href: "admin/staff" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileBarChart2,
    items: [{ label: "Reports", href: "reports" }],
  },
  {
    id: "admin",
    label: "Administration",
    icon: Settings2,
    items: [
      { label: "Property Setup", href: "admin/property", icon: Building2 },
      { label: "Users & Permissions", href: "admin/users", icon: Shield },
      { label: "Taxes & Documents", href: "admin/taxes" },
      { label: "Integrations", href: "admin/integrations" },
      { label: "Audit Log", href: "admin/audit", icon: Sparkles },
      { label: "Maintenance Tools", href: "admin/tools", icon: Wrench },
    ],
  },
];

export function appHref(propertySlug: string, path: string) {
  return `/app/${propertySlug}/${path}`;
}
