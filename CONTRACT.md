# POS Demo — Builder Contract

Shared contract for all module builders. Read this fully before writing code.
This is a **mock-data demo** (no backend) — everything lives in a Zustand store
persisted to localStorage. The whole app is client-side.

## Stack (versions matter — newer than your training data)

- Next.js **16.2.9** (App Router) + React **19.2.4**
- Tailwind CSS **v4** (CSS-first, tokens in `globals.css`)
- zustand **v5**, recharts **v3**, lucide-react **v1**, date-fns v4, TypeScript

## CRITICAL Next.js 16 rules

1. **Every page/component you write is interactive → start the file with `"use client";`** (it uses the store, hooks, charts, or event handlers). Server components cannot use those.
2. `params` / `searchParams` are **Promises**. In a client page use React's `use()`:
   ```tsx
   "use client";
   import { use } from "react";
   export default function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = use(params);
   }
   ```
3. Images: `images.unoptimized` is on. Use `next/image` with width/height (or `fill` + a sized parent), or a plain `<img>`. Product images are remote URLs.
4. Do **not** add server `fetch`, `cookies()`, `headers()`, or `"use cache"` — there is no server data.

## Hard conventions

- **NO EMOJI anywhere** (UI text, code, comments). Icons = `lucide-react` only.
- Thai UI text. Currency via `formatTHB`. Use `font-mono` on numeric/price cells.
- **Do NOT edit shared files** (`src/lib/*`, `src/components/ui/*`, `src/components/layout/*`, `src/app/globals.css`, `src/app/layout.tsx`, any `layout.tsx`). Read them, import from them. If you believe a shared file needs a change, write it in your FINAL REPORT instead of editing.
- Create files ONLY under the folders assigned to you (your prompt lists them) plus your own feature-component folder.
- Do NOT run `npm install` / `npm run build` / `next build`. Integration handles that.
- The section layout already guards auth + role. Pages should NOT re-guard; just call `useAuth()` for the current user/customer.

## Zustand store — `import { useStore } from "@/lib/store"`

Select **one slice per call** (atomic) to avoid re-render loops. For a derived
object/array selector, use `useShallow`:
```tsx
import { useShallow } from "zustand/react/shallow";
const { a, b } = useStore(useShallow((s) => ({ a: s.products, b: s.orders })));
```
Prefer: read raw arrays with separate `useStore((s) => s.products)` calls, then
compute with the pure selectors below.

State arrays: `products, customers, users, tiers, categories, orders, purchases, expenses, discounts`, plus `settings`, `cart: {productId,qty}[]`, `currentUserId`.

Actions (call as `const fn = useStore((s) => s.fn)`):
- Products: `addProduct(NewProduct)`, `updateProduct(id, patch)`, `removeProduct(id)` (soft), `adjustStock(id, delta)`, `addCategory(name)`
- Customers: `addCustomer(NewCustomer)`, `updateCustomer(id, patch)`, `setCustomerTier(id, tierId)`, `setCustomerCustomPrice(id, productId, price|null)`
- Users: `addUser(NewUser)`, `updateUser(id, patch)`, `toggleUserActive(id)`
- Tiers: `updateTier(id, patch)`
- Cart: `addToCart(productId, qty?)`, `setCartQty(productId, qty)`, `removeFromCart(productId)`, `clearCart()`
- Orders: `createOrder(CreateOrderInput): Order`, `updateOrderStatus(id, status)`, `attachSlip(id, dataUrl)`, `verifySlip(id)`, `cancelOrder(id)` (restocks)
- Purchases: `createPurchase(CreatePurchaseInput): Purchase` (adds stock)
- Expenses: `addExpense(NewExpense)`, `removeExpense(id)`
- Discounts: `addDiscount(NewDiscount)`, `updateDiscount(id, patch)`, `toggleDiscount(id)`
- Settings/demo: `updateSettings(patch)`, `resetDemo()`

```ts
CreateOrderInput = {
  customerId: string | null;          // null = walk-in
  channel: "online" | "pos";
  items: { productId: string; qty: number }[];
  discount?: { amount: number; label?: string }; // omit = best auto discount applied
  noAutoDiscount?: boolean;
  status?: OrderStatus;               // default: pos="paid", online="pending_payment"
  paymentSlip?: string;               // data URL
  createdBy?: string;
}
CreatePurchaseInput = {
  supplier?: string;
  items: { productId: string; qty: number; unitCost: number }[];
  note?: string; createdBy?: string;
}
// NewProduct/NewCustomer/NewUser = the type minus id/createdAt. NewExpense/NewDiscount = minus id.
```

## Pure selectors — `import { ... } from "@/lib/selectors"`

- `getPriceForCustomer(product, customer|null, tiers): number` — custom price > tier multiplier > base
- `bestDiscount(subtotal, customer|null, discounts): { amount, label?, id? }`
- `financeSummary(orders, expenses, purchases, settings, range): FinanceSummary`
- `salesByDay(orders, range): { date, label, revenue, profit }[]`
- `productSalesReport(orders, products, range): ProductSalesRow[]` (sorted by qtySold desc)
- `expenseBreakdown(expenses, range): { type, amount }[]`
- `lowStockProducts(products): Product[]`
- `rangeForPreset(preset, now?): DateRange` where preset = "today"|"7d"|"30d"|"month"|"all"
- `inRange(iso, range)`, `PAID_STATUSES`

`FinanceSummary = { revenue, cogs, grossProfit, opex, netProfit, withdrawals, inventoryIn, cashBalance, orderCount, avgOrder }`

## Constants — `import { ... } from "@/lib/constants"`

- `ROLE_LABELS[role]` (customer/staff/manager/owner)
- `ORDER_STATUS[status] = { label, tone }` — feed `tone` straight into `<Badge tone={...}>`
- `NEXT_STATUS[status]` — next status in fulfilment flow (or undefined)
- `EXPENSE_TYPE_LABELS[type]`, `CHANNEL_LABELS[channel]`, `homeForRole(role)`

## Format helpers — `import { ... } from "@/lib/utils"`

`cn`, `formatTHB(n)`, `formatNumber(n)`, `formatPercent(n)`, `formatDate(d)`, `formatDateTime(d)`, `genId(prefix)`.

## UI components — `import { ... } from "@/components/ui"`

- `Button` — props: `variant` = primary|secondary|outline|ghost|danger|success, `size` = sm|md|lg|icon, `loading?`. Renders children + spinner.
- `Card` (prop `strong?` → high-opacity glass for dense data), `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Input`, `Textarea`, `Label` (Label `htmlFor`)
- `Select` — native select, pass `<option>` children; controlled via value/onChange
- `Badge` — prop `tone` = neutral|primary|info|success|warning|danger
- `Table, THead, TBody, TR, TH, TD`
- `Dialog` — props `open, onClose, title?, description?, footer?, children`
- `Tabs` — props `tabs: {value,label}[], value, onChange`
- `Switch` — props `checked, onChange(boolean)`
- `StatCard` — props `label, value, icon? (Lucide), hint?, tone?`
- `PageHeader` — props `title, description?, actions?`
- `EmptyState` — props `icon? (Lucide), title, description?, action?`
- `Avatar` — props `name?, src?`
- `toast` — `toast.success("...")`, `toast.error("...")`, `toast.info("...")`

## Hooks

- `import { useAuth } from "@/hooks/use-auth"` → `{ user, customer, role, isLoggedIn }`. `customer` is the linked Customer when the user is a customer (else null — treat as retail pricing).

## Design system — Glassmorphism Clean

- Surfaces: `.glass` (chrome/cards), `.glass-strong` (dense data/tables/finance — readable), `.glass-subtle`. All are pre-styled for light + dark. Pair with `rounded-2xl`.
- Brand tokens: `bg-primary`/`text-primary` (indigo #4F46E5), `text-secondary` sky, `text-accent` amber. Profit/positive = `text-emerald-500`, loss/expense = `text-red-500`.
- Text: `text-slate-900 dark:text-slate-50` (headings), `text-slate-500 dark:text-slate-400` (muted). Always provide `dark:` variants.
- Generous whitespace, soft shadows, hover lift (`transition` + `hover:` states), 150-300ms. Respect contrast (4.5:1).
- Keep dense data on `Card strong` / `.glass-strong` (not heavy translucency) so it stays readable.

Page skeleton:
```tsx
"use client";
import { PageHeader, Card, CardContent } from "@/components/ui";
export default function SomePage() {
  return (
    <div>
      <PageHeader title="หัวข้อ" description="คำอธิบาย" actions={/* buttons */} />
      <div className="grid gap-4">
        <Card strong><CardContent>...</CardContent></Card>
      </div>
    </div>
  );
}
```

## Charts (recharts v3) — only in `"use client"` files

Use `ResponsiveContainer` with a fixed height. Colors: revenue/primary `#4f46e5`,
profit `#10b981`, expense `#ef4444`, secondary `#0ea5e9`, accent `#f59e0b`.
Always show values (tooltip + axis). Wrap charts in a `Card`.

## Domain rules

- Pricing: each customer pays custom override > tier multiplier (retail 1.0, wholesale 0.85, vip 0.75) > base. Use `getPriceForCustomer`.
- End-of-bill discount: admin-managed `Discount` rules. Use `bestDiscount` for auto, or pass a manual `{amount,label}` to `createOrder`.
- Order flow: `pending_payment → paid → packing → completed` (+ `cancelled`, which restocks). Use `NEXT_STATUS` to advance, `updateOrderStatus` / `verifySlip`.
- Finance: revenue = paid/packing/completed order totals; COGS = item.cost*qty; gross = revenue−COGS; opex = expenses except withdrawals; net = gross−opex; cashBalance = startingCash + cashIn − opex − withdrawals − inventoryIn.
- Low stock: `product.stock <= product.lowStockThreshold`.

## Seed reference

Login presets (password `1234`): owner@demo.pos, manager@demo.pos, staff@demo.pos, somchai@demo.pos (VIP customer), mani@demo.pos (retail customer). 25 products, 5 customers, 3 tiers, ~120 orders over 30 days, expenses + purchases seeded.
