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

/**
 * An external delivery / online marketplace the shop sells through, e.g. GrabFood
 * or LineMan. Each carries a GP (commission) the platform deducts, and products
 * may set an absolute per-channel price (see Product.channelPrices). Distinct from
 * PricingTier, which is customer-based; sales channels are order-source based.
 */
export interface SalesChannel {
  id: string;
  name: string;
  /** GP / commission percent the platform deducts from each order, e.g. 30. */
  commission: number;
  /** Tailwind-ish accent token name for badges, e.g. "emerald". */
  color: string;
  active: boolean;
  createdAt: string;
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
  /** Loyalty points balance. Coffee pivot. */
  points?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

/** A single selectable value within a menu option group. Coffee pivot. */
export interface MenuOptionChoice {
  id: string;
  label: string;
  /** Baht added to (or removed from) the unit price when chosen. */
  priceDelta: number;
}

/** A menu option group, e.g. size or sweetness. Coffee pivot. */
export interface MenuOption {
  id: string;
  name: string;
  choices: MenuOptionChoice[];
}

/** A bill-of-materials line linking a menu item to an ingredient. Coffee pivot. */
export interface RecipeLine {
  ingredientId: string;
  qty: number;
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
  /** Customizable option groups (size, sweetness, hot/iced...). Coffee pivot. */
  options?: MenuOption[];
  /** Ingredients consumed to make one unit. Coffee pivot. */
  recipe?: RecipeLine[];
  /** Absolute per-sales-channel price override. channelId -> price. Unset = basePrice. */
  channelPrices?: Record<string, number>;
  createdAt: string;
}

/** A raw material / consumable tracked in stock. Coffee pivot. */
export interface Ingredient {
  id: string;
  name: string;
  /** Unit of measure label, e.g. "กรัม", "มล.", "ขวด". */
  unit: string;
  stock: number;
  lowThreshold: number;
  /** ISO date the lot expires. */
  expiryDate: string;
  /** Cost per unit. */
  cost: number;
  createdAt: string;
}

/** A dine-in table / bar seat for QR ordering. Coffee pivot. */
export interface Table {
  id: string;
  name: string;
  seats?: number;
  createdAt: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "packing"
  | "completed"
  | "cancelled";

export type OrderChannel = "online" | "pos" | "qr" | "delivery";

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  /** Unit price actually charged, after tier / custom pricing + option deltas. */
  unitPrice: number;
  /** Unit cost snapshot at sale time, for profit math. */
  cost: number;
  /** Chosen option choice labels, e.g. ["L", "หวาน 50%"]. Coffee pivot. */
  options?: string[];
}

export interface Order {
  id: string;
  code: string;
  /** null = walk-in POS guest with no profile. */
  customerId: string | null;
  customerName: string;
  channel: OrderChannel;
  /** Delivery platform this order came through (when channel === "delivery"). */
  salesChannelId?: string;
  /** Platform commission deducted from this order, in baht. Snapshot at sale time. */
  commission?: number;
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
  /** Dine-in table for QR orders. Coffee pivot. */
  tableId?: string;
  /** How the order was paid. Coffee pivot. */
  paymentMethod?: "cash" | "slip" | "counter";
  /** Loyalty points earned on this order. Coffee pivot. */
  pointsEarned?: number;
  /** Loyalty points redeemed as a discount on this order. Coffee pivot. */
  pointsRedeemed?: number;
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
  /** Baht spent to earn 1 loyalty point, e.g. 20. Coffee pivot. */
  earnRate?: number;
  /** Baht value of 1 loyalty point when redeemed, e.g. 1. Coffee pivot. */
  redeemValue?: number;
  /** RAW/JetDirect thermal printer host on the shop LAN (port 9100). Coffee pivot. */
  printerHost?: string;
  printerPort?: number;
  /** `ESC t` Thai code page; tune if Thai prints garbled. */
  printerCodepage?: number;
  /** Receipt character width: 58mm paper = 32, 80mm = 48. */
  printerWidth?: number;
  /** "local" = stream over LAN now; "cloud" = enqueue for the in-shop agent. */
  printMode?: "local" | "cloud";
}

/** Computed finance figures for a date range. */
export interface FinanceSummary {
  revenue: number;
  cogs: number;
  grossProfit: number;
  /** Delivery-platform commission deducted in the range, in baht. */
  commission: number;
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
  /** Delivery GP attributed to this product (order commission split pro-rata by line). */
  commission: number;
  /** Margin after cost AND attributed GP, i.e. the real take-home profit. */
  profit: number;
}
