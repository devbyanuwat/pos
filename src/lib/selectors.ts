// Pure selector / aggregation helpers. No React, no store dependency.
// Builder agents import these for pricing, discounts, finance, and reports.

import { formatDate } from "./utils";
import type {
  Order,
  OrderStatus,
  Customer,
  Product,
  PricingTier,
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

  const exp = expenses.filter((e) => inRange(e.date, range));
  const opex = sum(exp.filter((e) => e.type !== "withdrawal").map((e) => e.amount));
  const withdrawals = sum(exp.filter((e) => e.type === "withdrawal").map((e) => e.amount));
  const inventoryIn = sum(
    purchases.filter((p) => inRange(p.createdAt, range)).map((p) => p.total),
  );
  const netProfit = grossProfit - opex;

  // Cash balance is a point-in-time figure: always all-time, ignoring the range.
  const allPaid = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const cashIn = sum(allPaid.map((o) => o.total));
  const allOpex = sum(expenses.filter((e) => e.type !== "withdrawal").map((e) => e.amount));
  const allWd = sum(expenses.filter((e) => e.type === "withdrawal").map((e) => e.amount));
  const allInv = sum(purchases.map((p) => p.total));
  const cashBalance = settings.startingCash + cashIn - allOpex - allWd - allInv;

  const orderCount = paid.length;
  const avgOrder = orderCount ? Math.round(revenue / orderCount) : 0;

  return {
    revenue,
    cogs,
    grossProfit,
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
      o.items.reduce((a, i) => a + (i.unitPrice - i.cost) * i.qty, 0) - o.discount;
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
