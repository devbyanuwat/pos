import type { Role } from "./types";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  Wallet,
  Receipt,
  BarChart3,
  Users,
  Ticket,
  ShieldCheck,
  Settings,
  ShoppingBag,
  ClipboardList,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

const MANAGER_UP: Role[] = ["manager", "owner"];
const OWNER_ONLY: Role[] = ["owner"];
const STAFF_UP: Role[] = ["staff", "manager", "owner"];
const ALL: Role[] = ["customer", "staff", "manager", "owner"];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, roles: MANAGER_UP },
  { href: "/admin/products", label: "สินค้า", icon: Package, roles: MANAGER_UP },
  { href: "/admin/stock", label: "สต๊อก", icon: Boxes, roles: MANAGER_UP },
  { href: "/admin/purchases", label: "ซื้อสินค้าเข้า", icon: Truck, roles: MANAGER_UP },
  { href: "/admin/reports", label: "รายงานการขาย", icon: BarChart3, roles: MANAGER_UP },
  { href: "/admin/customers", label: "ลูกค้า", icon: Users, roles: MANAGER_UP },
  { href: "/admin/discounts", label: "ส่วนลด", icon: Ticket, roles: MANAGER_UP },
  { href: "/admin/finance", label: "บัญชี / การเงิน", icon: Wallet, roles: OWNER_ONLY },
  { href: "/admin/expenses", label: "รายจ่าย", icon: Receipt, roles: OWNER_ONLY },
  { href: "/admin/users", label: "ผู้ใช้ / สิทธิ์", icon: ShieldCheck, roles: OWNER_ONLY },
  { href: "/admin/settings", label: "ตั้งค่า", icon: Settings, roles: OWNER_ONLY },
];

export const POS_NAV: NavItem[] = [
  { href: "/pos", label: "ขายหน้าร้าน", icon: ShoppingBag, roles: STAFF_UP },
  { href: "/pos/orders", label: "ออเดอร์", icon: ClipboardList, roles: STAFF_UP },
  { href: "/pos/pack", label: "คิวแพ็ก", icon: PackageCheck, roles: STAFF_UP },
];

export const SHOP_NAV: NavItem[] = [
  { href: "/shop", label: "ร้านค้า", icon: ShoppingBag, roles: ALL },
  { href: "/account", label: "บัญชีของฉัน", icon: Users, roles: ALL },
];

export function navForRole(items: NavItem[], role: Role): NavItem[] {
  return items.filter((i) => i.roles.includes(role));
}

export function canAccess(href: string, role: Role): boolean {
  const all = [...ADMIN_NAV, ...POS_NAV, ...SHOP_NAV];
  // longest-prefix match so /admin/finance resolves before /admin
  const match = all
    .filter((i) => href === i.href || href.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? match.roles.includes(role) : true;
}
