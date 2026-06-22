// Pure selector / aggregation helpers. No React, no store dependency.
// Builder agents import these for pricing, discounts, finance, and reports.

import { formatDate } from "./utils";
import { CHANNEL_LABELS } from "./constants";
import type {
  Order,
  OrderStatus,
  Customer,
  Product,
  PricingTier,
  SalesChannel,
  Discount,
  Expense,
  Purchase,
  Settings,
  FinanceSummary,
  ProductSalesRow,
  ExpenseType,
  Ingredient,
} from "./types";

export type RangePreset = "today" | "7d" | "30d" | "month" | "all";

export interface DateRange {
  from: Date;
  to: Date;
}

/** Order statuses that count as realized revenue / cash-in. */
export const PAID_STATUSES: OrderStatus[] = ["paid", "packing", "completed"];

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function rangeForPreset(preset: RangePreset, now: Date = new Date()): DateRange {
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  switch (preset) {
    case "today":
      break;
    case "7d":
      from.setDate(from.getDate() - 6);
      break;
    case "30d":
      from.setDate(from.getDate() - 29);
      break;
    case "month":
      from.setDate(1);
      break;
    case "all":
      from.setFullYear(2000, 0, 1);
      break;
  }
  return { from, to };
}

export function inRange(dateISO: string, range: DateRange): boolean {
  const t = new Date(dateISO).getTime();
  return t >= range.from.getTime() && t <= range.to.getTime();
}

/** Resolve the price a specific customer pays: custom override > tier multiplier > base. */
export function getPriceForCustomer(
  product: Product,
  customer: Customer | null,
  tiers: PricingTier[],
): number {
  if (customer?.customPrices && customer.customPrices[product.id] != null) {
    return Math.round(customer.customPrices[product.id]);
  }
  const tier = customer ? tiers.find((t) => t.id === customer.tierId) : undefined;
  const mult = tier?.multiplier ?? 1;
  return Math.round(product.basePrice * mult);
}

/**
 * Resolve the price charged on a given sales channel (delivery platform):
 * the product's absolute per-channel override, falling back to basePrice.
 * Channel pricing is order-source based and does NOT apply customer tiers.
 */
export function getPriceForChannel(product: Product, channelId: string): number {
  const override = product.channelPrices?.[channelId];
  return Math.round(override != null ? override : product.basePrice);
}

/** Platform commission in baht for an order amount, e.g. 30% of total. */
export function commissionFor(amount: number, channel: SalesChannel | undefined | null): number {
  if (!channel) return 0;
  return Math.round((amount * channel.commission) / 100);
}

/**
 * Stable grouping key for "sales by channel" reports: delivery orders split by
 * their platform (salesChannelId), everything else by the OrderChannel itself.
 */
export function orderChannelKey(order: Order): string {
  if (order.channel === "delivery" && order.salesChannelId) return order.salesChannelId;
  return order.channel;
}

export interface ChannelSalesRow {
  key: string;
  label: string;
  color: string;
  orderCount: number;
  qtySold: number;
  revenue: number;
  commission: number;
  /** Revenue minus platform commission = what actually reaches the shop. */
  net: number;
  /** Item margin minus discount minus commission. */
  profit: number;
}

/** Built-in (non-delivery) channel accent tokens for breakdown badges/bars. */
const BUILTIN_CHANNEL_COLOR: Record<string, string> = {
  pos: "amber",
  qr: "violet",
  online: "sky",
  delivery: "emerald",
};

/** Per-channel sales aggregation for the reports page, sorted by revenue desc. */
export function channelBreakdown(
  orders: Order[],
  channels: SalesChannel[],
  range: DateRange,
): ChannelSalesRow[] {
  const chById = new Map(channels.map((c) => [c.id, c]));
  const map = new Map<string, ChannelSalesRow>();
  for (const o of orders) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    if (!inRange(o.paidAt ?? o.createdAt, range)) continue;
    const key = orderChannelKey(o);
    let row = map.get(key);
    if (!row) {
      const ch = chById.get(key);
      const label = ch
        ? ch.name
        : CHANNEL_LABELS[key as keyof typeof CHANNEL_LABELS] ?? key;
      const color = ch?.color ?? BUILTIN_CHANNEL_COLOR[key] ?? "slate";
      row = { key, label, color, orderCount: 0, qtySold: 0, revenue: 0, commission: 0, net: 0, profit: 0 };
      map.set(key, row);
    }
    const itemProfit = o.items.reduce((a, i) => a + (i.unitPrice - i.cost) * i.qty, 0);
    const commission = o.commission ?? 0;
    row.orderCount += 1;
    row.qtySold += o.items.reduce((a, i) => a + i.qty, 0);
    row.revenue += o.total;
    row.commission += commission;
    row.net += o.total - commission;
    row.profit += itemProfit - o.discount - commission;
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

/** Pick the best applicable end-of-bill discount for a subtotal + customer. */
export function bestDiscount(
  subtotal: number,
  customer: Customer | null,
  discounts: Discount[],
): { amount: number; label?: string; id?: string } {
  let best: { amount: number; label?: string; id?: string } = { amount: 0 };
  for (const d of discounts) {
    if (!d.active) continue;
    if (d.minSubtotal && subtotal < d.minSubtotal) continue;
    if (d.scope === "tier" && (!customer || d.tierId !== customer.tierId)) continue;
    const amount =
      d.type === "percent"
        ? Math.round((subtotal * d.value) / 100)
        : Math.min(d.value, subtotal);
    if (amount > best.amount) best = { amount, label: d.name, id: d.id };
  }
  return best;
}

export function financeSummary(
  orders: Order[],
  expenses: Expense[],
  purchases: Purchase[],
  settings: Settings,
  range: DateRange,
): FinanceSummary {
  const paid = orders.filter(
    (o) => PAID_STATUSES.includes(o.status) && inRange(o.paidAt ?? o.createdAt, range),
  );
  const revenue = sum(paid.map((o) => o.total));
  const cogs = sum(paid.flatMap((o) => o.items.map((i) => i.cost * i.qty)));
  const grossProfit = revenue - cogs;
  // Delivery-platform GP is a real cost of the sale, deducted from net profit.
  const commission = sum(paid.map((o) => o.commission ?? 0));

  const exp = expenses.filter((e) => inRange(e.date, range));
  const opex = sum(exp.filter((e) => e.type !== "withdrawal").map((e) => e.amount));
  const withdrawals = sum(exp.filter((e) => e.type === "withdrawal").map((e) => e.amount));
  const inventoryIn = sum(
    purchases.filter((p) => inRange(p.createdAt, range)).map((p) => p.total),
  );
  const netProfit = grossProfit - opex - commission;

  // Cash balance is a point-in-time figure: always all-time, ignoring the range.
  const allPaid = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const cashIn = sum(allPaid.map((o) => o.total));
  const allCommission = sum(allPaid.map((o) => o.commission ?? 0));
  const allOpex = sum(expenses.filter((e) => e.type !== "withdrawal").map((e) => e.amount));
  const allWd = sum(expenses.filter((e) => e.type === "withdrawal").map((e) => e.amount));
  const allInv = sum(purchases.map((p) => p.total));
  const cashBalance = settings.startingCash + cashIn - allCommission - allOpex - allWd - allInv;

  const orderCount = paid.length;
  const avgOrder = orderCount ? Math.round(revenue / orderCount) : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    commission,
    opex,
    netProfit,
    withdrawals,
    inventoryIn,
    cashBalance,
    orderCount,
    avgOrder,
  };
}

/** Daily revenue + profit series for line/area charts. Clamped to last 60 days. */
export function salesByDay(
  orders: Order[],
  range: DateRange,
): { date: string; label: string; revenue: number; profit: number }[] {
  const buckets = new Map<string, { revenue: number; profit: number }>();
  const startMs = Math.max(range.from.getTime(), range.to.getTime() - 59 * 86400000);
  const cur = new Date(startMs);
  cur.setHours(0, 0, 0, 0);
  while (cur.getTime() <= range.to.getTime()) {
    buckets.set(isoDay(cur), { revenue: 0, profit: 0 });
    cur.setDate(cur.getDate() + 1);
  }
  for (const o of orders) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    const when = o.paidAt ?? o.createdAt;
    const key = isoDay(new Date(when));
    const b = buckets.get(key);
    if (!b) continue;
    const profit =
      o.items.reduce((a, i) => a + (i.unitPrice - i.cost) * i.qty, 0) -
      o.discount -
      (o.commission ?? 0);
    b.revenue += o.total;
    b.profit += profit;
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    label: formatDate(date + "T00:00:00", { day: "numeric", month: "short" }),
    revenue: v.revenue,
    profit: v.profit,
  }));
}

/** Per-product sales aggregation, sorted by qty sold desc. */
export function productSalesReport(
  orders: Order[],
  products: Product[],
  range: DateRange,
): ProductSalesRow[] {
  const map = new Map<string, ProductSalesRow>();
  for (const o of orders) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    if (!inRange(o.paidAt ?? o.createdAt, range)) continue;
    for (const it of o.items) {
      let row = map.get(it.productId);
      if (!row) {
        const p = products.find((pr) => pr.id === it.productId);
        row = {
          productId: it.productId,
          name: it.name,
          sku: it.sku,
          image: p?.image ?? "",
          qtySold: 0,
          revenue: 0,
          profit: 0,
        };
        map.set(it.productId, row);
      }
      row.qtySold += it.qty;
      row.revenue += it.unitPrice * it.qty;
      row.profit += (it.unitPrice - it.cost) * it.qty;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.qtySold - a.qtySold);
}

export function expenseBreakdown(
  expenses: Expense[],
  range: DateRange,
): { type: ExpenseType; amount: number }[] {
  const map = new Map<ExpenseType, number>();
  for (const e of expenses) {
    if (!inRange(e.date, range)) continue;
    map.set(e.type, (map.get(e.type) ?? 0) + e.amount);
  }
  return Array.from(map.entries()).map(([type, amount]) => ({ type, amount }));
}

export function lowStockProducts(products: Product[]): Product[] {
  return products
    .filter((p) => p.active && p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock);
}

// ----- Coffee pivot: ingredients + loyalty helpers -----

/** Whole days from `now` until the ISO date. Negative = already expired. */
export function daysToExpiry(iso: string, now: Date = new Date()): number {
  const expiry = new Date(iso).getTime();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today.getTime()) / 86400000);
}

/**
 * Ingredients expiring within `withinDays` (inclusive), including already-expired
 * ones, sorted ascending by expiry date.
 */
export function expiringIngredients(
  ingredients: Ingredient[],
  withinDays = 7,
  now: Date = new Date(),
): Ingredient[] {
  const limit = new Date(now);
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() + withinDays);
  const limitMs = limit.getTime();
  return ingredients
    .filter((ing) => new Date(ing.expiryDate).getTime() <= limitMs)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
}

/** Menu items whose recipe consumes the given ingredient. */
export function menuItemsUsingIngredient(
  products: Product[],
  ingredientId: string,
): Product[] {
  return products.filter((p) => p.recipe?.some((r) => r.ingredientId === ingredientId));
}

/** Points earned for an order total = floor(total / earnRate). */
export function pointsEarnedFor(total: number, settings: Settings): number {
  const rate = settings.earnRate ?? 20;
  if (rate <= 0) return 0;
  return Math.floor(total / rate);
}

/** Baht value of a points balance = points * redeemValue. */
export function pointsBahtValue(points: number, settings: Settings): number {
  const value = settings.redeemValue ?? 1;
  return Math.round(points * value);
}
