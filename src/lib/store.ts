import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  PricingTier,
  Category,
  Product,
  Customer,
  User,
  Discount,
  Settings,
  Order,
  OrderStatus,
  OrderChannel,
  OrderItem,
  Purchase,
  Expense,
  TierId,
} from "./types";
import { buildSeed } from "./seed";
import { getPriceForCustomer, bestDiscount } from "./selectors";
import { genId } from "./utils";

export interface CartItem {
  productId: string;
  qty: number;
}

export type NewProduct = Omit<Product, "id" | "createdAt">;
export type NewCustomer = Omit<Customer, "id" | "createdAt">;
export type NewUser = Omit<User, "id" | "createdAt">;
export type NewExpense = Omit<Expense, "id">;
export type NewDiscount = Omit<Discount, "id">;

export interface CreateOrderInput {
  customerId: string | null;
  channel: OrderChannel;
  items: { productId: string; qty: number }[];
  /** Manual discount override. If omitted, the best auto discount applies. */
  discount?: { amount: number; label?: string };
  /** Skip auto discount entirely (used when staff wants no discount). */
  noAutoDiscount?: boolean;
  status?: OrderStatus;
  paymentSlip?: string;
  createdBy?: string;
}

export interface CreatePurchaseInput {
  supplier?: string;
  items: { productId: string; qty: number; unitCost: number }[];
  note?: string;
  createdBy?: string;
}

interface StoreState {
  tiers: PricingTier[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  users: User[];
  discounts: Discount[];
  settings: Settings;
  orders: Order[];
  purchases: Purchase[];
  expenses: Expense[];

  cart: CartItem[];
  currentUserId: string | null;
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;

  // auth
  login: (email: string, password: string) => boolean;
  loginAs: (userId: string) => void;
  logout: () => void;

  // products + categories
  addProduct: (p: NewProduct) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  addCategory: (name: string) => Category;

  // customers
  addCustomer: (c: NewCustomer) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  setCustomerTier: (id: string, tierId: TierId) => void;
  setCustomerCustomPrice: (id: string, productId: string, price: number | null) => void;

  // users
  addUser: (u: NewUser) => User;
  updateUser: (id: string, patch: Partial<User>) => void;
  toggleUserActive: (id: string) => void;

  // tiers
  updateTier: (id: string, patch: Partial<PricingTier>) => void;

  // cart
  addToCart: (productId: string, qty?: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // orders
  createOrder: (input: CreateOrderInput) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  attachSlip: (id: string, dataUrl: string) => void;
  verifySlip: (id: string) => void;
  cancelOrder: (id: string) => void;

  // purchases
  createPurchase: (input: CreatePurchaseInput) => Purchase;

  // expenses
  addExpense: (e: NewExpense) => Expense;
  removeExpense: (id: string) => void;

  // discounts
  addDiscount: (d: NewDiscount) => Discount;
  updateDiscount: (id: string, patch: Partial<Discount>) => void;
  toggleDiscount: (id: string) => void;

  // settings + demo
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemo: () => void;
}

const seed = buildSeed();

function nowISO(): string {
  return new Date().toISOString();
}

function statusTimestamps(status: OrderStatus, base: Partial<Order> = {}): Partial<Order> {
  const ts = nowISO();
  const out: Partial<Order> = { ...base };
  if (["paid", "packing", "completed"].includes(status) && !out.paidAt) out.paidAt = ts;
  if (["packing", "completed"].includes(status) && !out.packedAt) out.packedAt = ts;
  if (status === "completed" && !out.completedAt) out.completedAt = ts;
  return out;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...seed,
      cart: [],
      currentUserId: null,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: (email, password) => {
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.active,
        );
        if (!user) return false;
        set({ currentUserId: user.id });
        return true;
      },
      loginAs: (userId) => set({ currentUserId: userId }),
      logout: () => set({ currentUserId: null, cart: [] }),

      addProduct: (p) => {
        const product: Product = { ...p, id: genId("p"), createdAt: nowISO() };
        set((s) => ({ products: [product, ...s.products] }));
        return product;
      },
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProduct: (id) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, active: false } : p)),
        })),
      adjustStock: (id, delta) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
          ),
        })),
      addCategory: (name) => {
        const cat: Category = { id: genId("cat"), name };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },

      addCustomer: (c) => {
        const customer: Customer = { ...c, id: genId("cus"), createdAt: nowISO() };
        set((s) => ({ customers: [customer, ...s.customers] }));
        return customer;
      },
      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      setCustomerTier: (id, tierId) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, tierId } : c)),
        })),
      setCustomerCustomPrice: (id, productId, price) =>
        set((s) => ({
          customers: s.customers.map((c) => {
            if (c.id !== id) return c;
            const next = { ...(c.customPrices ?? {}) };
            if (price == null) delete next[productId];
            else next[productId] = price;
            return { ...c, customPrices: next };
          }),
        })),

      addUser: (u) => {
        const user: User = { ...u, id: genId("usr"), createdAt: nowISO() };
        set((s) => ({ users: [...s.users, user] }));
        return user;
      },
      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      toggleUserActive: (id) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
        })),

      updateTier: (id, patch) =>
        set((s) => ({ tiers: s.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      addToCart: (productId, qty = 1) =>
        set((s) => {
          const existing = s.cart.find((c) => c.productId === productId);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.productId === productId ? { ...c, qty: c.qty + qty } : c,
              ),
            };
          }
          return { cart: [...s.cart, { productId, qty }] };
        }),
      setCartQty: (productId, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((c) => c.productId !== productId)
              : s.cart.map((c) => (c.productId === productId ? { ...c, qty } : c)),
        })),
      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),
      clearCart: () => set({ cart: [] }),

      createOrder: (input) => {
        const s = get();
        const customer = input.customerId
          ? s.customers.find((c) => c.id === input.customerId) ?? null
          : null;

        const items: OrderItem[] = input.items
          .map(({ productId, qty }) => {
            const p = s.products.find((pr) => pr.id === productId);
            if (!p) return null;
            return {
              productId: p.id,
              name: p.name,
              sku: p.sku,
              qty,
              unitPrice: getPriceForCustomer(p, customer, s.tiers),
              cost: p.cost,
            } as OrderItem;
          })
          .filter((x): x is OrderItem => x !== null);

        const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
        const disc = input.discount
          ? input.discount
          : input.noAutoDiscount
            ? { amount: 0 }
            : bestDiscount(subtotal, customer, s.discounts);
        const total = subtotal - disc.amount;

        const status: OrderStatus =
          input.status ?? (input.channel === "pos" ? "paid" : "pending_payment");

        const created = nowISO();
        const seq = s.orders.length + 1;
        const d = new Date(created);
        const code = `ORD-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
          d.getDate(),
        ).padStart(2, "0")}-${String(seq).padStart(3, "0")}`;

        const order: Order = {
          id: genId("ord"),
          code,
          customerId: customer ? customer.id : null,
          customerName: customer ? customer.name : "ลูกค้าหน้าร้าน",
          channel: input.channel,
          items,
          subtotal,
          discount: disc.amount,
          discountLabel: disc.amount > 0 ? disc.label : undefined,
          total,
          status,
          paymentSlip: input.paymentSlip,
          slipVerified: ["paid", "packing", "completed"].includes(status),
          createdAt: created,
          createdBy: input.createdBy,
          ...statusTimestamps(status),
        };

        set((st) => ({
          orders: [order, ...st.orders],
          products: st.products.map((p) => {
            const line = items.find((i) => i.productId === p.id);
            return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
          }),
        }));
        return order;
      },

      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  slipVerified:
                    ["paid", "packing", "completed"].includes(status) ? true : o.slipVerified,
                  ...statusTimestamps(status, o),
                }
              : o,
          ),
        })),
      attachSlip: (id, dataUrl) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, paymentSlip: dataUrl } : o)),
        })),
      verifySlip: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const status: OrderStatus = o.status === "pending_payment" ? "paid" : o.status;
            return { ...o, slipVerified: true, status, ...statusTimestamps(status, o) };
          }),
        })),
      cancelOrder: (id) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === id);
          if (!order || order.status === "cancelled") return {};
          return {
            orders: s.orders.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)),
            products: s.products.map((p) => {
              const line = order.items.find((i) => i.productId === p.id);
              return line ? { ...p, stock: p.stock + line.qty } : p;
            }),
          };
        }),

      createPurchase: (input) => {
        const s = get();
        const items = input.items.map(({ productId, qty, unitCost }) => {
          const p = s.products.find((pr) => pr.id === productId);
          return { productId, name: p?.name ?? productId, qty, unitCost };
        });
        const total = items.reduce((a, i) => a + i.qty * i.unitCost, 0);
        const created = nowISO();
        const seq = s.purchases.length + 1;
        const d = new Date(created);
        const purchase: Purchase = {
          id: genId("pur"),
          code: `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
            d.getDate(),
          ).padStart(2, "0")}-${String(seq).padStart(3, "0")}`,
          supplier: input.supplier,
          items,
          total,
          note: input.note,
          createdAt: created,
          createdBy: input.createdBy,
        };
        set((st) => ({
          purchases: [purchase, ...st.purchases],
          products: st.products.map((p) => {
            const line = items.find((i) => i.productId === p.id);
            return line ? { ...p, stock: p.stock + line.qty } : p;
          }),
        }));
        return purchase;
      },

      addExpense: (e) => {
        const expense: Expense = { ...e, id: genId("exp") };
        set((s) => ({ expenses: [expense, ...s.expenses] }));
        return expense;
      },
      removeExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addDiscount: (d) => {
        const discount: Discount = { ...d, id: genId("dis") };
        set((s) => ({ discounts: [...s.discounts, discount] }));
        return discount;
      },
      updateDiscount: (id, patch) =>
        set((s) => ({
          discounts: s.discounts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      toggleDiscount: (id) =>
        set((s) => ({
          discounts: s.discounts.map((d) => (d.id === id ? { ...d, active: !d.active } : d)),
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetDemo: () => {
        const fresh = buildSeed();
        set({ ...fresh, cart: [] });
      },
    }),
    {
      name: "pos-demo-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tiers: s.tiers,
        categories: s.categories,
        products: s.products,
        customers: s.customers,
        users: s.users,
        discounts: s.discounts,
        settings: s.settings,
        orders: s.orders,
        purchases: s.purchases,
        expenses: s.expenses,
        cart: s.cart,
        currentUserId: s.currentUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
