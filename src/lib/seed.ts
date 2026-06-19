// Deterministic seed data. No Math.random / Date.now at module load so the
// initial state is identical on server and client (no hydration mismatch).

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
  Expense,
  Purchase,
} from "./types";
import { getPriceForCustomer, bestDiscount } from "./selectors";

const ANCHOR = new Date("2026-06-19T18:00:00");

function daysAgo(n: number, hour = 12, min = 0): string {
  const d = new Date(ANCHOR);
  d.setDate(d.getDate() - n);
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
  { id: "wholesale", name: "ขายส่ง", multiplier: 0.85, color: "sky" },
  { id: "vip", name: "VIP", multiplier: 0.75, color: "amber" },
];

export const CATEGORIES: Category[] = [
  { id: "cat_stationery", name: "เครื่องเขียน" },
  { id: "cat_home", name: "ของใช้ในบ้าน" },
  { id: "cat_drink", name: "เครื่องดื่ม" },
  { id: "cat_snack", name: "ขนม" },
  { id: "cat_it", name: "อุปกรณ์ไอที" },
  { id: "cat_health", name: "สุขภาพและความงาม" },
];

function makeProduct(
  id: string,
  sku: string,
  name: string,
  categoryId: string,
  cost: number,
  basePrice: number,
  stock: number,
  lowStockThreshold: number,
): Product {
  return {
    id,
    sku,
    name,
    categoryId,
    image: `https://picsum.photos/seed/${sku}/600/600`,
    cost,
    basePrice,
    stock,
    lowStockThreshold,
    active: true,
    createdAt: daysAgo(45),
  };
}

export const PRODUCTS: Product[] = [
  makeProduct("p1", "ST-001", "ปากกาเจล สีน้ำเงิน (แพ็ค 5)", "cat_stationery", 35, 69, 120, 20),
  makeProduct("p2", "ST-002", "สมุดโน้ต A5 ปกแข็ง", "cat_stationery", 45, 95, 80, 15),
  makeProduct("p3", "ST-003", "ดินสอกด 0.5 มม.", "cat_stationery", 18, 39, 60, 15),
  makeProduct("p4", "ST-004", "ปากกาไฮไลท์ 6 สี", "cat_stationery", 55, 119, 12, 15),
  makeProduct("p5", "ST-005", "เทปลบคำผิด", "cat_stationery", 22, 45, 90, 20),
  makeProduct("p6", "HM-001", "กล่องเก็บของพลาสติก 20 ลิตร", "cat_home", 95, 199, 40, 10),
  makeProduct("p7", "HM-002", "ผ้าเช็ดอเนกประสงค์ (แพ็ค 3)", "cat_home", 40, 89, 75, 20),
  makeProduct("p8", "HM-003", "ไม้แขวนเสื้อ (แพ็ค 10)", "cat_home", 60, 129, 8, 12),
  makeProduct("p9", "HM-004", "น้ำยาล้างจาน 800 มล.", "cat_home", 38, 75, 110, 25),
  makeProduct("p10", "HM-005", "ถุงขยะม้วน (แพ็ค 30)", "cat_home", 28, 59, 95, 25),
  makeProduct("p11", "DR-001", "กาแฟสำเร็จรูป 3in1 (แพ็ค 20)", "cat_drink", 75, 149, 65, 15),
  makeProduct("p12", "DR-002", "ชาเขียวขวด 500 มล.", "cat_drink", 14, 25, 200, 40),
  makeProduct("p13", "DR-003", "น้ำดื่ม 600 มล. (แพ็ค 12)", "cat_drink", 48, 89, 50, 15),
  makeProduct("p14", "DR-004", "นม UHT รสจืด 1 ลิตร", "cat_drink", 32, 55, 70, 20),
  makeProduct("p15", "SN-001", "มันฝรั่งทอดกรอบ", "cat_snack", 18, 35, 150, 30),
  makeProduct("p16", "SN-002", "ช็อกโกแลตแท่ง", "cat_snack", 22, 45, 9, 15),
  makeProduct("p17", "SN-003", "บิสกิตแซนวิช", "cat_snack", 16, 32, 130, 30),
  makeProduct("p18", "SN-004", "ลูกอมมินต์", "cat_snack", 12, 25, 180, 40),
  makeProduct("p19", "IT-001", "สายชาร์จ USB-C 1 ม.", "cat_it", 45, 129, 55, 15),
  makeProduct("p20", "IT-002", "หูฟัง In-ear", "cat_it", 120, 290, 25, 8),
  makeProduct("p21", "IT-003", "เมาส์ไร้สาย", "cat_it", 180, 390, 18, 8),
  makeProduct("p22", "IT-004", "พาวเวอร์แบงก์ 10000mAh", "cat_it", 320, 690, 6, 10),
  makeProduct("p23", "IT-005", "แฟลชไดร์ฟ 32GB", "cat_it", 95, 199, 40, 12),
  makeProduct("p24", "HB-001", "เจลล้างมือแอลกอฮอล์ 50 มล.", "cat_health", 20, 49, 100, 25),
  makeProduct("p25", "HB-002", "หน้ากากอนามัย (กล่อง 50 ชิ้น)", "cat_health", 55, 110, 35, 15),
];

export const CUSTOMERS: Customer[] = [
  {
    id: "cus_1",
    name: "บริษัท ออฟฟิศ ซัพพลาย จำกัด",
    email: "office@supply.co.th",
    phone: "02-111-2222",
    tierId: "wholesale",
    note: "สั่งเครื่องเขียนประจำทุกเดือน",
    createdAt: daysAgo(120),
  },
  {
    id: "cus_2",
    name: "ร้านกาแฟ บ้านสวน",
    email: "bansuan@cafe.com",
    phone: "081-234-5678",
    tierId: "wholesale",
    createdAt: daysAgo(90),
  },
  {
    id: "cus_3",
    name: "คุณมานี ใจดี",
    email: "mani@demo.pos",
    phone: "089-555-1212",
    tierId: "retail",
    createdAt: daysAgo(60),
  },
  {
    id: "cus_4",
    name: "คุณสมชาย รุ่งเรือง",
    email: "somchai@demo.pos",
    phone: "086-777-8899",
    tierId: "vip",
    customPrices: { p22: 650 },
    note: "ลูกค้า VIP ได้ราคาพิเศษพาวเวอร์แบงก์",
    createdAt: daysAgo(75),
  },
  {
    id: "cus_5",
    name: "โรงเรียนอนุบาลดาวเด็ก",
    email: "contact@daodek.ac.th",
    phone: "02-333-4444",
    tierId: "vip",
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
    name: "พนักงานขาย A",
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
  { label: "พนักงานขาย", email: "staff@demo.pos", password: "1234", role: "staff" as const },
  { label: "ลูกค้า VIP", email: "somchai@demo.pos", password: "1234", role: "customer" as const },
];

export const DISCOUNTS: Discount[] = [
  {
    id: "dis_1",
    name: "ลดท้ายบิล 5% เมื่อซื้อครบ 1,000",
    type: "percent",
    value: 5,
    active: true,
    scope: "all",
    minSubtotal: 1000,
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
    name: "ลดพิเศษ 50 บาท (ครบ 500)",
    type: "fixed",
    value: 50,
    active: false,
    scope: "all",
    minSubtotal: 500,
  },
];

export const SETTINGS: Settings = {
  shopName: "Demo Store",
  startingCash: 50000,
  currency: "THB",
  lowStockThreshold: 10,
};

function generateOrders(
  products: Product[],
  customers: Customer[],
  tiers: PricingTier[],
  discounts: Discount[],
): Order[] {
  const rand = mulberry32(987654);
  const orders: Order[] = [];
  let seq = 0;

  for (let d = 29; d >= 0; d--) {
    const day = new Date(ANCHOR);
    day.setDate(day.getDate() - d);
    const count = 2 + Math.floor(rand() * 5); // 2-6 orders per day

    for (let k = 0; k < count; k++) {
      seq++;
      const isPos = rand() < 0.5;
      const guest = isPos && rand() < 0.4;
      const customer = guest
        ? null
        : customers[Math.floor(rand() * customers.length)];

      const itemCount = 1 + Math.floor(rand() * 4);
      const picked = new Set<number>();
      const items: OrderItem[] = [];
      for (let j = 0; j < itemCount; j++) {
        const pi = Math.floor(rand() * products.length);
        if (picked.has(pi)) continue;
        picked.add(pi);
        const p = products[pi];
        const qty = 1 + Math.floor(rand() * 3);
        items.push({
          productId: p.id,
          name: p.name,
          sku: p.sku,
          qty,
          unitPrice: getPriceForCustomer(p, customer, tiers),
          cost: p.cost,
        });
      }
      if (items.length === 0) continue;

      const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
      const disc =
        rand() < 0.35 ? bestDiscount(subtotal, customer, discounts) : { amount: 0 };
      const total = subtotal - disc.amount;

      let status: OrderStatus;
      if (d > 2) status = "completed";
      else if (d === 2) status = rand() < 0.8 ? "completed" : "packing";
      else if (d === 1) status = rand() < 0.5 ? "packing" : "paid";
      else status = rand() < 0.5 ? "paid" : "pending_payment";
      if (rand() < 0.04) status = "cancelled";

      const created = new Date(day);
      created.setHours(9 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
      const iso = created.toISOString();
      const isPaid = ["paid", "packing", "completed"].includes(status);

      orders.push({
        id: `ord_${seq}`,
        code: `ORD-${ymdCompact(created)}-${String(seq).padStart(3, "0")}`,
        customerId: customer ? customer.id : null,
        customerName: customer ? customer.name : "ลูกค้าหน้าร้าน",
        channel: isPos ? "pos" : "online",
        items,
        subtotal,
        discount: disc.amount,
        discountLabel: disc.amount > 0 ? disc.label : undefined,
        total,
        status,
        slipVerified: isPaid,
        createdAt: iso,
        createdBy: isPos ? "usr_staff" : undefined,
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
    { id: "exp_1", type: "salary", label: "เงินเดือน - ผู้จัดการ", amount: 25000, date: daysAgo(15) },
    { id: "exp_2", type: "salary", label: "เงินเดือน - พนักงานขาย A", amount: 15000, date: daysAgo(15) },
    { id: "exp_3", type: "salary", label: "เงินเดือน - พนักงานขาย B", amount: 14000, date: daysAgo(15) },
    { id: "exp_4", type: "rent", label: "ค่าเช่าร้าน เดือนมิถุนายน", amount: 12000, date: daysAgo(25) },
    { id: "exp_5", type: "utility", label: "ค่าไฟฟ้า", amount: 3200, date: daysAgo(20) },
    { id: "exp_6", type: "utility", label: "ค่าน้ำประปา", amount: 850, date: daysAgo(20) },
    { id: "exp_7", type: "utility", label: "ค่าอินเทอร์เน็ต", amount: 799, date: daysAgo(18) },
    { id: "exp_8", type: "other", label: "อุปกรณ์ทำความสะอาด", amount: 1500, date: daysAgo(12) },
    { id: "exp_9", type: "withdrawal", label: "ถอนเงินเจ้าของ", amount: 20000, date: daysAgo(10) },
    { id: "exp_10", type: "other", label: "ค่าขนส่งพัสดุ", amount: 2400, date: daysAgo(6) },
    { id: "exp_11", type: "withdrawal", label: "ถอนเงินสด", amount: 10000, date: daysAgo(3) },
  ];
}

function generatePurchases(products: Product[]): Purchase[] {
  const byId = (id: string) => products.find((p) => p.id === id)!;
  const mk = (
    id: string,
    code: string,
    supplier: string,
    rows: [string, number][],
    ago: number,
  ): Purchase => {
    const items = rows.map(([pid, qty]) => {
      const p = byId(pid);
      return { productId: pid, name: p.name, qty, unitCost: p.cost };
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
    mk("pur_1", "PO-20260528-001", "ตัวแทนจำหน่ายเครื่องเขียน A", [["p1", 100], ["p2", 60], ["p3", 50]], 22),
    mk("pur_2", "PO-20260607-002", "บจก. ไอที ซัพพลาย", [["p19", 40], ["p20", 20], ["p23", 30]], 12),
    mk("pur_3", "PO-20260615-003", "ตัวแทนสินค้าอุปโภค", [["p9", 80], ["p11", 50], ["p15", 120]], 4),
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
    orders: generateOrders(PRODUCTS, CUSTOMERS, TIERS, DISCOUNTS),
    expenses: generateExpenses(),
    purchases: generatePurchases(PRODUCTS),
  };
}
