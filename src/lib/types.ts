// Domain model for the POS + storefront demo.
// Pure types only, no framework dependencies.

export type Role = "customer" | "staff" | "manager" | "owner";

/** Role hierarchy ranking. Higher number = more access. */
export const ROLE_RANK: Record<Role, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  owner: 3,
};

export interface User {
  id: string;
  name: string;
  email: string;
  /** Demo only. Never store plaintext passwords in real apps. */
  password: string;
  role: Role;
  avatar?: string;
  /** Linked customer profile id when role === "customer". */
  customerId?: string;
  active: boolean;
  createdAt: string; // ISO
}

export type TierId = string;

export interface PricingTier {
  id: TierId;
  name: string;
  /** Multiplier applied to product.basePrice, e.g. 1.0 retail, 0.85 wholesale. */
  multiplier: number;
  /** Tailwind-ish accent token name for badges, e.g. "amber". */
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  tierId: TierId;
  /** Per-product fixed price overrides set by an admin. productId -> price. */
  customPrices?: Record<string, number>;
  note?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  /** Remote url or uploaded data URL. */
  image: string;
  cost: number;
  /** Retail base price. Tier multiplier / custom price derives from this. */
  basePrice: number;
  stock: number;
  lowStockThreshold: number;
  description?: string;
  active: boolean;
  createdAt: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "packing"
  | "completed"
  | "cancelled";

export type OrderChannel = "online" | "pos";

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  /** Unit price actually charged, after tier / custom pricing. */
  unitPrice: number;
  /** Unit cost snapshot at sale time, for profit math. */
  cost: number;
}

export interface Order {
  id: string;
  code: string;
  /** null = walk-in POS guest with no profile. */
  customerId: string | null;
  customerName: string;
  channel: OrderChannel;
  items: OrderItem[];
  subtotal: number;
  /** Discount amount in baht (already resolved from percent/fixed). */
  discount: number;
  discountLabel?: string;
  total: number;
  status: OrderStatus;
  /** Uploaded slip data URL. */
  paymentSlip?: string;
  slipVerified: boolean;
  createdAt: string;
  createdBy?: string;
  paidAt?: string;
  packedAt?: string;
  completedAt?: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  qty: number;
  unitCost: number;
}

export interface Purchase {
  id: string;
  code: string;
  supplier?: string;
  items: PurchaseItem[];
  total: number;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export type ExpenseType = "salary" | "utility" | "rent" | "withdrawal" | "other";

export interface Expense {
  id: string;
  type: ExpenseType;
  label: string;
  amount: number;
  date: string; // ISO
  note?: string;
  createdBy?: string;
}

export type DiscountType = "percent" | "fixed";

export interface Discount {
  id: string;
  name: string;
  type: DiscountType;
  /** percent: 0-100, fixed: baht. */
  value: number;
  active: boolean;
  scope: "all" | "tier";
  tierId?: TierId;
  minSubtotal?: number;
}

export interface Settings {
  shopName: string;
  startingCash: number;
  currency: string;
  lowStockThreshold: number;
}

/** Computed finance figures for a date range. */
export interface FinanceSummary {
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  netProfit: number;
  withdrawals: number;
  inventoryIn: number;
  cashBalance: number;
  orderCount: number;
  avgOrder: number;
}

/** Per-product sales aggregation for reports. */
export interface ProductSalesRow {
  productId: string;
  name: string;
  sku: string;
  image: string;
  qtySold: number;
  revenue: number;
  profit: number;
}
