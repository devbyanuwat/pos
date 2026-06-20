// Deterministic seed data. No Math.random / Date.now at module load so the
// initial state is identical on server and client (no hydration mismatch).
//
// Coffee pivot: catalog is a coffee shop (Brew & Bean Café). Existing field
// names / shapes are preserved; new coffee fields are additive.

import type {
  PricingTier,
  Category,
  Product,
  Customer,
  User,
  Discount,
  Settings,
  Order,
  OrderItem,
  OrderStatus,
  OrderChannel,
  Expense,
  Purchase,
  Ingredient,
  Table,
  MenuOption,
  RecipeLine,
} from "./types";
import { getPriceForCustomer, bestDiscount } from "./selectors";

const ANCHOR = new Date("2026-06-20T18:00:00");

function daysAgo(n: number, hour = 12, min = 0): string {
  const d = new Date(ANCHOR);
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function daysAhead(n: number, hour = 12, min = 0): string {
  const d = new Date(ANCHOR);
  d.setDate(d.getDate() + n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function ymdCompact(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Deterministic PRNG so seeded history never changes between renders. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TIERS: PricingTier[] = [
  { id: "retail", name: "ลูกค้าทั่วไป", multiplier: 1, color: "slate" },
  { id: "wholesale", name: "ขายส่ง / ออฟฟิศ", multiplier: 0.85, color: "sky" },
  { id: "vip", name: "สมาชิก VIP", multiplier: 0.9, color: "amber" },
];

export const CATEGORIES: Category[] = [
  { id: "cat_hot", name: "กาแฟร้อน" },
  { id: "cat_iced", name: "กาแฟเย็น" },
  { id: "cat_tea", name: "ชา & นม" },
  { id: "cat_smoothie", name: "สมูทตี้ & โซดา" },
  { id: "cat_bakery", name: "เบเกอรี่" },
  { id: "cat_dessert", name: "ขนมหวาน" },
];

// ----- Reusable option groups -----

const SIZE_OPTION: MenuOption = {
  id: "opt_size",
  name: "ขนาด",
  choices: [
    { id: "size_s", label: "S", priceDelta: 0 },
    { id: "size_m", label: "M", priceDelta: 10 },
    { id: "size_l", label: "L", priceDelta: 20 },
  ],
};

const SWEET_OPTION: MenuOption = {
  id: "opt_sweet",
  name: "ความหวาน",
  choices: [
    { id: "sweet_0", label: "หวาน 0%", priceDelta: 0 },
    { id: "sweet_25", label: "หวาน 25%", priceDelta: 0 },
    { id: "sweet_50", label: "หวาน 50%", priceDelta: 0 },
    { id: "sweet_75", label: "หวาน 75%", priceDelta: 0 },
    { id: "sweet_100", label: "หวาน 100%", priceDelta: 0 },
  ],
};

const TEMP_OPTION: MenuOption = {
  id: "opt_temp",
  name: "อุณหภูมิ",
  choices: [
    { id: "temp_hot", label: "ร้อน", priceDelta: 0 },
    { id: "temp_iced", label: "เย็น", priceDelta: 5 },
    { id: "temp_blended", label: "ปั่น", priceDelta: 15 },
  ],
};

const MENU_IMG_KW: Record<string, string> = {
  cat_hot: "coffee",
  cat_iced: "iced-coffee,coffee",
  cat_tea: "matcha,tea",
  cat_smoothie: "smoothie",
  cat_bakery: "croissant,bakery",
  cat_dessert: "cake,dessert",
};

/** Coffee-themed, deterministic menu image (with a branded fallback in the UI). */
function menuImage(id: string, categoryId: string): string {
  const kw = MENU_IMG_KW[categoryId] ?? "coffee";
  const lock = parseInt(id.replace(/\D/g, ""), 10) || 1;
  return `https://loremflickr.com/600/600/${kw}?lock=${lock}`;
}

function makeProduct(
  id: string,
  sku: string,
  name: string,
  categoryId: string,
  cost: number,
  basePrice: number,
  stock: number,
  lowStockThreshold: number,
  options?: MenuOption[],
  recipe?: RecipeLine[],
): Product {
  return {
    id,
    sku,
    name,
    categoryId,
    image: menuImage(id, categoryId),
    cost,
    basePrice,
    stock,
    lowStockThreshold,
    active: true,
    options,
    recipe,
    createdAt: daysAgo(45),
  };
}

// Ingredient ids referenced by recipes (declared in INGREDIENTS below).
const I = {
  beans: "ing_beans",
  milk: "ing_milk",
  whip: "ing_whip",
  creamer: "ing_creamer",
  greentea: "ing_greentea",
  cocoa: "ing_cocoa",
  vanilla: "ing_vanilla",
  caramel: "ing_caramel",
  chocsauce: "ing_chocsauce",
  tealeaf: "ing_tealeaf",
  pearl: "ing_pearl",
  syrup: "ing_syrup",
};

export const PRODUCTS: Product[] = [
  // กาแฟร้อน
  makeProduct("p1", "HOT-ESP", "เอสเปรสโซ", "cat_hot", 12, 45, 999, 0, [SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
  ]),
  makeProduct("p2", "HOT-AME", "อเมริกาโน่ร้อน", "cat_hot", 13, 50, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
  ]),
  makeProduct("p3", "HOT-LAT", "ลาเต้ร้อน", "cat_hot", 20, 60, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
    { ingredientId: I.milk, qty: 150 },
  ]),
  makeProduct("p4", "HOT-CAP", "คาปูชิโน่", "cat_hot", 20, 60, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
    { ingredientId: I.milk, qty: 120 },
  ]),
  makeProduct("p5", "HOT-MOC", "มอคค่าร้อน", "cat_hot", 26, 70, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
    { ingredientId: I.milk, qty: 140 },
    { ingredientId: I.chocsauce, qty: 20 },
  ]),
  makeProduct("p6", "HOT-CML", "คาราเมลมัคคิอาโต", "cat_hot", 28, 75, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
    { ingredientId: I.milk, qty: 140 },
    { ingredientId: I.caramel, qty: 20 },
  ]),
  // กาแฟเย็น
  makeProduct("p7", "ICE-AME", "อเมริกาโน่เย็น", "cat_iced", 14, 55, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
  ]),
  makeProduct("p8", "ICE-LAT", "ลาเต้เย็น", "cat_iced", 22, 65, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
    { ingredientId: I.milk, qty: 150 },
  ]),
  makeProduct("p9", "ICE-MOC", "มอคค่าเย็น", "cat_iced", 28, 75, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
    { ingredientId: I.milk, qty: 150 },
    { ingredientId: I.chocsauce, qty: 20 },
  ]),
  makeProduct("p10", "ICE-VAN", "วานิลลาลาเต้เย็น", "cat_iced", 26, 70, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.beans, qty: 18 },
    { ingredientId: I.milk, qty: 150 },
    { ingredientId: I.vanilla, qty: 15 },
  ]),
  // ชา & นม
  makeProduct("p11", "TEA-GRN", "ชาเขียวลาเต้", "cat_tea", 24, 65, 999, 0, [SIZE_OPTION, SWEET_OPTION, TEMP_OPTION], [
    { ingredientId: I.greentea, qty: 12 },
    { ingredientId: I.milk, qty: 150 },
  ]),
  makeProduct("p12", "TEA-THA", "ชาไทย", "cat_tea", 18, 55, 999, 0, [SIZE_OPTION, SWEET_OPTION, TEMP_OPTION], [
    { ingredientId: I.tealeaf, qty: 10 },
    { ingredientId: I.creamer, qty: 30 },
  ]),
  makeProduct("p13", "TEA-COC", "โกโก้", "cat_tea", 22, 60, 999, 0, [SIZE_OPTION, SWEET_OPTION, TEMP_OPTION], [
    { ingredientId: I.cocoa, qty: 20 },
    { ingredientId: I.milk, qty: 150 },
  ]),
  makeProduct("p14", "TEA-BBT", "ชานมไข่มุก", "cat_tea", 28, 70, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.tealeaf, qty: 10 },
    { ingredientId: I.creamer, qty: 30 },
    { ingredientId: I.pearl, qty: 50 },
  ]),
  // สมูทตี้ & โซดา
  makeProduct("p15", "SMT-FRT", "สมูทตี้ผลไม้รวม", "cat_smoothie", 30, 80, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.syrup, qty: 30 },
    { ingredientId: I.milk, qty: 100 },
  ]),
  makeProduct("p16", "SMT-SOD", "โซดาอิตาเลียน", "cat_smoothie", 18, 55, 999, 0, [SIZE_OPTION, SWEET_OPTION], [
    { ingredientId: I.syrup, qty: 30 },
  ]),
  // เบเกอรี่
  makeProduct("p17", "BAK-CRO", "ครัวซองต์เนยสด", "cat_bakery", 18, 45, 24, 5),
  makeProduct("p18", "BAK-COO", "คุกกี้ช็อกชิป", "cat_bakery", 10, 30, 40, 8),
  // ขนมหวาน
  makeProduct("p19", "DST-CHK", "เค้กช็อกโกแลต", "cat_dessert", 35, 85, 18, 5, undefined, [
    { ingredientId: I.cocoa, qty: 15 },
    { ingredientId: I.chocsauce, qty: 15 },
  ]),
  makeProduct("p20", "DST-BRW", "บราวนี่", "cat_dessert", 22, 55, 22, 5, undefined, [
    { ingredientId: I.cocoa, qty: 12 },
  ]),
];

export const INGREDIENTS: Ingredient[] = [
  { id: I.beans, name: "เมล็ดกาแฟคั่ว", unit: "กรัม", stock: 8000, lowThreshold: 1500, expiryDate: daysAhead(120), cost: 0.6, createdAt: daysAgo(20) },
  { id: I.milk, name: "นมสด", unit: "มล.", stock: 12000, lowThreshold: 3000, expiryDate: daysAhead(3), cost: 0.04, createdAt: daysAgo(2) },
  { id: I.whip, name: "วิปปิ้งครีม", unit: "มล.", stock: 2000, lowThreshold: 600, expiryDate: daysAhead(2), cost: 0.12, createdAt: daysAgo(3) },
  { id: I.creamer, name: "ครีมเทียมสด", unit: "มล.", stock: 3000, lowThreshold: 800, expiryDate: daysAhead(5), cost: 0.05, createdAt: daysAgo(4) },
  { id: I.greentea, name: "ผงชาเขียว", unit: "กรัม", stock: 1200, lowThreshold: 300, expiryDate: daysAhead(90), cost: 0.8, createdAt: daysAgo(15) },
  { id: I.cocoa, name: "ผงโกโก้", unit: "กรัม", stock: 1500, lowThreshold: 300, expiryDate: daysAhead(150), cost: 0.5, createdAt: daysAgo(18) },
  { id: I.vanilla, name: "ไซรัปวานิลลา", unit: "มล.", stock: 1800, lowThreshold: 400, expiryDate: daysAhead(120), cost: 0.15, createdAt: daysAgo(25) },
  { id: I.caramel, name: "ไซรัปคาราเมล", unit: "มล.", stock: 900, lowThreshold: 400, expiryDate: daysAhead(6), cost: 0.15, createdAt: daysAgo(30) },
  { id: I.chocsauce, name: "ช็อกโกแลตซอส", unit: "มล.", stock: 2200, lowThreshold: 500, expiryDate: daysAhead(60), cost: 0.18, createdAt: daysAgo(22) },
  { id: I.tealeaf, name: "ใบชา", unit: "กรัม", stock: 2500, lowThreshold: 500, expiryDate: daysAhead(180), cost: 0.3, createdAt: daysAgo(40) },
  { id: I.pearl, name: "ไข่มุก", unit: "กรัม", stock: 4000, lowThreshold: 1000, expiryDate: daysAhead(30), cost: 0.1, createdAt: daysAgo(5) },
  { id: I.syrup, name: "น้ำเชื่อม", unit: "มล.", stock: 5000, lowThreshold: 1000, expiryDate: daysAhead(90), cost: 0.03, createdAt: daysAgo(12) },
];

export const TABLES: Table[] = [
  { id: "tbl_1", name: "โต๊ะ 1", seats: 2, createdAt: daysAgo(60) },
  { id: "tbl_2", name: "โต๊ะ 2", seats: 2, createdAt: daysAgo(60) },
  { id: "tbl_3", name: "โต๊ะ 3", seats: 4, createdAt: daysAgo(60) },
  { id: "tbl_4", name: "โต๊ะ 4", seats: 4, createdAt: daysAgo(60) },
  { id: "tbl_5", name: "โต๊ะ 5", seats: 6, createdAt: daysAgo(60) },
  { id: "tbl_6", name: "โต๊ะ 6", seats: 6, createdAt: daysAgo(60) },
  { id: "tbl_bar1", name: "Bar 1", seats: 1, createdAt: daysAgo(60) },
  { id: "tbl_bar2", name: "Bar 2", seats: 1, createdAt: daysAgo(60) },
];

export const CUSTOMERS: Customer[] = [
  {
    id: "cus_1",
    name: "บริษัท ออฟฟิศ ซัพพลาย จำกัด",
    email: "office@supply.co.th",
    phone: "02-111-2222",
    tierId: "wholesale",
    points: 120,
    note: "สั่งกาแฟกล่องประจำทุกเช้า",
    createdAt: daysAgo(120),
  },
  {
    id: "cus_2",
    name: "โค-เวิร์กกิ้ง เดอะ ฮับ",
    email: "thehub@cowork.com",
    phone: "081-234-5678",
    tierId: "wholesale",
    points: 0,
    createdAt: daysAgo(90),
  },
  {
    id: "cus_3",
    name: "คุณมานี ใจดี",
    email: "mani@demo.pos",
    phone: "089-555-1212",
    tierId: "retail",
    points: 340,
    createdAt: daysAgo(60),
  },
  {
    id: "cus_4",
    name: "คุณสมชาย รุ่งเรือง",
    email: "somchai@demo.pos",
    phone: "086-777-8899",
    tierId: "vip",
    points: 880,
    note: "สมาชิก VIP ขาประจำ ชอบลาเต้เย็น",
    createdAt: daysAgo(75),
  },
  {
    id: "cus_5",
    name: "คุณนภา สดใส",
    email: "napa@demo.pos",
    phone: "02-333-4444",
    tierId: "retail",
    points: 50,
    createdAt: daysAgo(50),
  },
];

export const USERS: User[] = [
  {
    id: "usr_owner",
    name: "คุณเจ้าของ",
    email: "owner@demo.pos",
    password: "1234",
    role: "owner",
    active: true,
    createdAt: daysAgo(200),
  },
  {
    id: "usr_manager",
    name: "ผู้จัดการร้าน",
    email: "manager@demo.pos",
    password: "1234",
    role: "manager",
    active: true,
    createdAt: daysAgo(150),
  },
  {
    id: "usr_staff",
    name: "บาริสต้า A",
    email: "staff@demo.pos",
    password: "1234",
    role: "staff",
    active: true,
    createdAt: daysAgo(100),
  },
  {
    id: "usr_c3",
    name: "คุณมานี ใจดี",
    email: "mani@demo.pos",
    password: "1234",
    role: "customer",
    customerId: "cus_3",
    active: true,
    createdAt: daysAgo(60),
  },
  {
    id: "usr_c4",
    name: "คุณสมชาย รุ่งเรือง",
    email: "somchai@demo.pos",
    password: "1234",
    role: "customer",
    customerId: "cus_4",
    active: true,
    createdAt: daysAgo(75),
  },
];

export const PRESET_LOGINS = [
  { label: "เจ้าของร้าน", email: "owner@demo.pos", password: "1234", role: "owner" as const },
  { label: "ผู้จัดการ", email: "manager@demo.pos", password: "1234", role: "manager" as const },
  { label: "บาริสต้า", email: "staff@demo.pos", password: "1234", role: "staff" as const },
  { label: "สมาชิก VIP", email: "somchai@demo.pos", password: "1234", role: "customer" as const },
];

export const DISCOUNTS: Discount[] = [
  {
    id: "dis_1",
    name: "ลดท้ายบิล 5% เมื่อซื้อครบ 300",
    type: "percent",
    value: 5,
    active: true,
    scope: "all",
    minSubtotal: 300,
  },
  {
    id: "dis_2",
    name: "ส่วนลดสมาชิก VIP 10%",
    type: "percent",
    value: 10,
    active: true,
    scope: "tier",
    tierId: "vip",
  },
  {
    id: "dis_3",
    name: "ลดพิเศษ 20 บาท (ครบ 150)",
    type: "fixed",
    value: 20,
    active: false,
    scope: "all",
    minSubtotal: 150,
  },
];

export const SETTINGS: Settings = {
  shopName: "Teddy Boost",
  startingCash: 30000,
  currency: "THB",
  lowStockThreshold: 5,
  earnRate: 20,
  redeemValue: 1,
};

function pickOptions(p: Product, rand: () => number): { labels: string[]; delta: number } {
  if (!p.options || p.options.length === 0) return { labels: [], delta: 0 };
  const labels: string[] = [];
  let delta = 0;
  // choose 1-3 option groups worth of choices
  const groups = p.options;
  for (const g of groups) {
    const choice = g.choices[Math.floor(rand() * g.choices.length)];
    labels.push(choice.label);
    delta += choice.priceDelta;
  }
  return { labels, delta };
}

function generateOrders(
  products: Product[],
  customers: Customer[],
  tiers: PricingTier[],
  discounts: Discount[],
  settings: Settings,
  tables: Table[],
): Order[] {
  const rand = mulberry32(987654);
  const orders: Order[] = [];
  let seq = 0;
  const earnRate = settings.earnRate ?? 20;

  for (let d = 29; d >= 0; d--) {
    const day = new Date(ANCHOR);
    day.setDate(day.getDate() - d);
    const count = 4 + Math.floor(rand() * 8); // 4-11 orders per day (coffee = high volume)

    for (let k = 0; k < count; k++) {
      seq++;
      // channel mix ~ qr 40 / pos 40 / online 20
      const r = rand();
      const channel: OrderChannel = r < 0.4 ? "qr" : r < 0.8 ? "pos" : "online";

      // walk-in guests mostly on pos/qr
      const guest = channel !== "online" && rand() < 0.4;
      const customer = guest ? null : customers[Math.floor(rand() * customers.length)];

      const itemCount = 1 + Math.floor(rand() * 3); // 1-3 lines
      const picked = new Set<number>();
      const items: OrderItem[] = [];
      for (let j = 0; j < itemCount; j++) {
        const pi = Math.floor(rand() * products.length);
        if (picked.has(pi)) continue;
        picked.add(pi);
        const p = products[pi];
        const qty = 1 + Math.floor(rand() * 2);
        const { labels, delta } = pickOptions(p, rand);
        const item: OrderItem = {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          qty,
          unitPrice: getPriceForCustomer(p, customer, tiers) + delta,
          cost: p.cost,
        };
        if (labels.length) item.options = labels;
        items.push(item);
      }
      if (items.length === 0) continue;

      const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
      const disc =
        rand() < 0.3 ? bestDiscount(subtotal, customer, discounts) : { amount: 0 };
      const total = subtotal - disc.amount;

      let status: OrderStatus;
      if (d > 2) status = "completed";
      else if (d === 2) status = rand() < 0.85 ? "completed" : "packing";
      else if (d === 1) status = rand() < 0.5 ? "completed" : "packing";
      else {
        const rr = rand();
        status = rr < 0.4 ? "completed" : rr < 0.7 ? "packing" : rr < 0.9 ? "paid" : "pending_payment";
      }
      if (rand() < 0.03) status = "cancelled";

      const created = new Date(day);
      created.setHours(7 + Math.floor(rand() * 13), Math.floor(rand() * 60), 0, 0);
      const iso = created.toISOString();
      const isPaid = ["paid", "packing", "completed"].includes(status);

      const paymentMethod: "cash" | "slip" | "counter" =
        channel === "online" ? "slip" : channel === "qr" ? (rand() < 0.5 ? "slip" : "counter") : "cash";

      const tableId =
        channel === "qr" ? tables[Math.floor(rand() * tables.length)].id : undefined;

      const pointsEarned =
        customer && isPaid && earnRate > 0 ? Math.floor(total / earnRate) : 0;

      orders.push({
        id: `ord_${seq}`,
        code: `ORD-${ymdCompact(created)}-${String(seq).padStart(3, "0")}`,
        customerId: customer ? customer.id : null,
        customerName: customer ? customer.name : "ลูกค้าหน้าร้าน",
        channel,
        items,
        subtotal,
        discount: disc.amount,
        discountLabel: disc.amount > 0 ? disc.label : undefined,
        total,
        status,
        slipVerified: isPaid,
        tableId,
        paymentMethod,
        pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
        createdAt: iso,
        createdBy: channel === "online" ? undefined : "usr_staff",
        paidAt: isPaid ? iso : undefined,
        packedAt: ["packing", "completed"].includes(status) ? iso : undefined,
        completedAt: status === "completed" ? iso : undefined,
      });
    }
  }
  return orders;
}

function generateExpenses(): Expense[] {
  return [
    { id: "exp_1", type: "salary", label: "เงินเดือน - ผู้จัดการ", amount: 22000, date: daysAgo(15) },
    { id: "exp_2", type: "salary", label: "เงินเดือน - บาริสต้า A", amount: 15000, date: daysAgo(15) },
    { id: "exp_3", type: "salary", label: "เงินเดือน - บาริสต้า B", amount: 14000, date: daysAgo(15) },
    { id: "exp_4", type: "rent", label: "ค่าเช่าร้าน เดือนมิถุนายน", amount: 18000, date: daysAgo(25) },
    { id: "exp_5", type: "utility", label: "ค่าไฟฟ้า", amount: 4200, date: daysAgo(20) },
    { id: "exp_6", type: "utility", label: "ค่าน้ำประปา", amount: 950, date: daysAgo(20) },
    { id: "exp_7", type: "utility", label: "ค่าอินเทอร์เน็ต", amount: 799, date: daysAgo(18) },
    { id: "exp_8", type: "other", label: "อุปกรณ์ทำความสะอาด", amount: 1500, date: daysAgo(12) },
    { id: "exp_9", type: "withdrawal", label: "ถอนเงินเจ้าของ", amount: 15000, date: daysAgo(10) },
    { id: "exp_10", type: "other", label: "แก้วกระดาษ + หลอด", amount: 3200, date: daysAgo(6) },
    { id: "exp_11", type: "withdrawal", label: "ถอนเงินสด", amount: 8000, date: daysAgo(3) },
  ];
}

function generatePurchases(ingredients: Ingredient[]): Purchase[] {
  const byId = (id: string) => ingredients.find((i) => i.id === id)!;
  const mk = (
    id: string,
    code: string,
    supplier: string,
    rows: [string, number][],
    ago: number,
  ): Purchase => {
    const items = rows.map(([iid, qty]) => {
      const ing = byId(iid);
      // store ingredient id under productId to keep the Purchase shape unchanged
      return { productId: iid, name: ing.name, qty, unitCost: ing.cost };
    });
    return {
      id,
      code,
      supplier,
      items,
      total: items.reduce((a, i) => a + i.qty * i.unitCost, 0),
      note: undefined,
      createdAt: daysAgo(ago),
      createdBy: "usr_manager",
    };
  };
  return [
    mk("pur_1", "PO-20260530-001", "โรงคั่วกาแฟ บีนเฮาส์", [[I.beans, 5000], [I.greentea, 500], [I.cocoa, 500]], 21),
    mk("pur_2", "PO-20260614-002", "นมสด ฟาร์มโคนม", [[I.milk, 12000], [I.creamer, 3000], [I.whip, 2000]], 6),
    mk("pur_3", "PO-20260618-003", "ซัพพลายเออร์ไซรัป", [[I.caramel, 1000], [I.vanilla, 1000], [I.syrup, 5000]], 2),
  ];
}

export function buildSeed() {
  return {
    tiers: TIERS,
    categories: CATEGORIES,
    products: PRODUCTS,
    customers: CUSTOMERS,
    users: USERS,
    discounts: DISCOUNTS,
    settings: SETTINGS,
    ingredients: INGREDIENTS,
    tables: TABLES,
    orders: generateOrders(PRODUCTS, CUSTOMERS, TIERS, DISCOUNTS, SETTINGS, TABLES),
    expenses: generateExpenses(),
    purchases: generatePurchases(INGREDIENTS),
  };
}
