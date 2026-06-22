"use client";

import { use, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  QrCode,
  Coffee,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ChevronRight,
  Phone,
  Upload,
  RefreshCw,
  Wallet,
  Receipt,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  ImageIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Label,
  Tabs,
  Dialog,
  EmptyState,
  QrCodeView,
  MenuImage,
  toast,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { getPriceForCustomer } from "@/lib/selectors";
import { promptPayPayload } from "@/lib/promptpay";
import { ORDER_STATUS, PAYMENT_LABELS } from "@/lib/constants";
import { cn, formatTHB } from "@/lib/utils";
import type { Order, Product, Customer, Settings } from "@/lib/types";
import type { CreateOrderInput } from "@/lib/store";
import { OptionPicker, type SelectedOption } from "@/components/order/option-picker";

/** A line in the local (not yet placed) cart. */
interface CartLine {
  /** Stable line key — same product with different options = different line. */
  key: string;
  productId: string;
  name: string;
  image: string;
  qty: number;
  unitPrice: number;
  options: SelectedOption[];
}

function lineKey(productId: string, options: SelectedOption[]): string {
  return options.length ? `${productId}::${options.map((o) => o.label).join("|")}` : productId;
}

export default function QrOrderPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);

  const tables = useStore((s) => s.tables);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const tiers = useStore((s) => s.tiers);
  const customers = useStore((s) => s.customers);
  const settings = useStore((s) => s.settings);
  const createOrder = useStore((s) => s.createOrder);

  const table = useMemo(() => tables.find((t) => t.id === tableId), [tables, tableId]);

  const [category, setCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [picker, setPicker] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  // Menu is retail-priced for walk-up QR guests (no tier until matched at checkout).
  const priceOf = (p: Product) => getPriceForCustomer(p, null, tiers);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const tabs = useMemo(() => {
    const used = new Set(activeProducts.map((p) => p.categoryId));
    return [
      { value: "all", label: "ทั้งหมด" },
      ...categories.filter((c) => used.has(c.id)).map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [categories, activeProducts]);

  const visible = useMemo(
    () =>
      category === "all"
        ? activeProducts
        : activeProducts.filter((p) => p.categoryId === category),
    [activeProducts, category],
  );

  const subtotal = cart.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const cartCount = cart.reduce((a, l) => a + l.qty, 0);

  function addLine(product: Product, options: SelectedOption[], unitPrice: number) {
    const key = lineKey(product.id, options);
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...prev,
        { key, productId: product.id, name: product.name, image: product.image, qty: 1, unitPrice, options },
      ];
    });
    toast.success(`เพิ่ม "${product.name}" แล้ว`);
  }

  function handleAdd(product: Product) {
    if (product.options && product.options.length > 0) {
      setPicker(product);
      return;
    }
    addLine(product, [], priceOf(product));
  }

  function setQty(key: string, qty: number) {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }

  // ----- Confirmation screen -----
  if (placed) {
    return (
      <OrderPlaced
        order={placed}
        tableName={table?.name ?? ""}
        earnRate={settings.earnRate}
        onReset={() => {
          setPlaced(null);
          setCart([]);
        }}
      />
    );
  }

  // ----- Unknown table -----
  if (!table) {
    return (
      <Card strong className="mt-10">
        <EmptyState
          icon={QrCode}
          title="ไม่พบโต๊ะ"
          description="QR code นี้อาจหมดอายุหรือไม่ถูกต้อง กรุณาสแกนใหม่ที่โต๊ะ หรือสอบถามพนักงาน"
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Table banner */}
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <QrCode className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">กำลังสั่งสำหรับ</p>
          <p className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-50">
            {table.name}
          </p>
        </div>
        {table.seats ? (
          <Badge tone="neutral" className="shrink-0">
            {table.seats} ที่นั่ง
          </Badge>
        ) : null}
      </div>

      {/* Category tabs */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tabs tabs={tabs} value={category} onChange={setCategory} className="w-max" />
      </div>

      {/* Menu grid */}
      {visible.length === 0 ? (
        <Card strong>
          <EmptyState icon={Coffee} title="ยังไม่มีเมนูในหมวดนี้" />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((p) => (
            <MenuItemCard key={p.id} product={p} price={priceOf(p)} onAdd={() => handleAdd(p)} />
          ))}
        </div>
      )}

      {/* Option picker */}
      <OptionPicker
        open={picker !== null}
        product={picker}
        basePrice={picker ? priceOf(picker) : 0}
        onClose={() => setPicker(null)}
        onConfirm={(options, unitPrice) => {
          if (picker) addLine(picker, options, unitPrice);
          setPicker(null);
        }}
      />

      {/* Sticky cart bar */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
          <div className="mx-auto max-w-md">
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-primary px-5 py-3.5 text-white shadow-2xl shadow-primary/30 transition-all duration-150 hover:bg-indigo-500 active:scale-[0.99]"
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 font-mono text-xs font-bold text-slate-900">
                  {cartCount}
                </span>
              </span>
              <span className="flex-1 text-left text-sm font-medium">ดูตะกร้า & สั่งซื้อ</span>
              <span className="font-mono text-base font-bold">{formatTHB(subtotal)}</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Cart + checkout */}
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        tableName={table.name}
        customers={customers}
        settings={settings}
        onSetQty={setQty}
        onPlace={(order) => {
          setCheckoutOpen(false);
          setPlaced(order);
        }}
        createOrder={createOrder}
        tableId={tableId}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Menu item card                                                             */
/* -------------------------------------------------------------------------- */

function MenuItemCard({
  product,
  price,
  onAdd,
}: {
  product: Product;
  price: number;
  onAdd: () => void;
}) {
  const hasOptions = (product.options?.length ?? 0) > 0;
  const soldOut = product.stock <= 0;

  return (
    <div className="glass group flex flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <button
        type="button"
        onClick={onAdd}
        disabled={soldOut}
        className="relative block aspect-square overflow-hidden bg-amber-500/5 disabled:cursor-not-allowed"
      >
        <MenuImage
          src={product.image}
          alt={product.name}
          className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 backdrop-blur-[1px]">
            <Badge tone="danger">หมดชั่วคราว</Badge>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-snug text-slate-900 dark:text-slate-50">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-base font-semibold text-slate-900 dark:text-slate-50">
              {formatTHB(price)}
            </p>
            {hasOptions && (
              <p className="text-[11px] leading-none text-slate-400">ปรับแต่งได้</p>
            )}
          </div>
          <Button
            variant="primary"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={soldOut}
            onClick={onAdd}
            aria-label={`เพิ่ม ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Checkout dialog: cart lines, phone match, payment, place order             */
/* -------------------------------------------------------------------------- */

function CheckoutDialog({
  open,
  onClose,
  cart,
  subtotal,
  tableName,
  customers,
  settings,
  onSetQty,
  onPlace,
  createOrder,
  tableId,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  subtotal: number;
  tableName: string;
  customers: Customer[];
  settings: Settings;
  onSetQty: (key: string, qty: number) => void;
  onPlace: (order: Order) => void;
  createOrder: (input: CreateOrderInput) => Order;
  tableId: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [pay, setPay] = useState<"slip" | "counter" | null>(null);
  const [slip, setSlip] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const matched = useMemo(() => {
    if (digits.length < 4) return null;
    return (
      customers.find((c) => (c.phone ?? "").replace(/\D/g, "") === digits) ?? null
    );
  }, [customers, digits]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSlip(reader.result as string);
    reader.onerror = () => toast.error("อ่านไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    reader.readAsDataURL(file);
  }

  function handlePlace() {
    if (cart.length === 0) return;
    if (!pay) {
      toast.error("กรุณาเลือกวิธีชำระเงิน");
      return;
    }
    setSubmitting(true);
    const order = createOrder({
      customerId: matched?.id ?? null,
      channel: "qr",
      orderType: "qr",
      tableId,
      items: cart.map((c) => ({
        productId: c.productId,
        qty: c.qty,
        options: c.options,
      })),
      status: "pending_payment",
      paymentMethod: pay === "slip" ? "slip" : "counter",
      paymentSlip: pay === "slip" ? slip ?? undefined : undefined,
    });
    // Reset local checkout state for any future order on the same table.
    setPhone("");
    setPay(null);
    setSlip(null);
    setSubmitting(false);
    onPlace(order);
  }

  const empty = cart.length === 0;

  return (
    <Dialog open={open} onClose={onClose} title="ตะกร้าของคุณ" description={`โต๊ะ ${tableName}`}>
      {empty ? (
        <EmptyState icon={ShoppingCart} title="ยังไม่มีรายการในตะกร้า" />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Cart lines */}
          <div className="flex flex-col divide-y divide-slate-200/60 dark:divide-white/10">
            {cart.map((l) => (
              <div key={l.key} className="flex items-start gap-3 py-3 first:pt-0">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-amber-500/5">
                  <MenuImage src={l.image} alt={l.name} className="absolute inset-0" iconClassName="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-slate-50">
                    {l.name}
                  </p>
                  {l.options.length > 0 && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                      {l.options.map((o) => o.label).join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {formatTHB(l.unitPrice * l.qty)}
                  </p>
                </div>

                {/* Qty stepper */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="ลดจำนวน"
                    onClick={() => onSetQty(l.key, l.qty - 1)}
                  >
                    {l.qty <= 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  </Button>
                  <span className="w-7 text-center font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                    {l.qty}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="เพิ่มจำนวน"
                    onClick={() => onSetQty(l.key, l.qty + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Phone (member lookup) */}
          <div>
            <Label htmlFor="qr-phone">เบอร์โทร (สมาชิกสะสมคะแนน)</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="qr-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX (ไม่บังคับ)"
                className="pl-10"
              />
            </div>
            {matched ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                สมาชิก: {matched.name} · {matched.points ?? 0} คะแนน
              </p>
            ) : digits.length >= 4 ? (
              <p className="mt-2 text-xs text-slate-400">
                ไม่พบสมาชิก · สั่งแบบไม่สะสมคะแนนได้เลย
              </p>
            ) : null}
          </div>

          {/* Payment method */}
          <div>
            <Label>วิธีชำระเงิน</Label>
            <div className="grid grid-cols-1 gap-2.5">
              <PayOption
                active={pay === "slip"}
                onClick={() => setPay("slip")}
                icon={Wallet}
                title={PAYMENT_LABELS.slip}
                desc="สแกน PromptPay แล้วแนบสลิป"
              />
              <PayOption
                active={pay === "counter"}
                onClick={() => setPay("counter")}
                icon={Receipt}
                title={PAYMENT_LABELS.counter}
                desc="ชำระกับพนักงานที่เคาน์เตอร์"
              />
            </div>
          </div>

          {/* Slip panel (when paying by transfer) */}
          {pay === "slip" && (
            <div className="glass-subtle flex flex-col items-center gap-3 rounded-2xl p-4">
              {promptPayPayload(settings.promptpayId, subtotal) ? (
                <>
                  <QrCodeView value={promptPayPayload(settings.promptpayId, subtotal)!} size={148} />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    สแกนเพื่อโอนผ่าน PromptPay · {formatTHB(subtotal)}
                  </p>
                </>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ร้านยังไม่ได้ตั้งค่าพร้อมเพย์ กรุณาแจ้งพนักงาน
                </p>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
              />

              {slip ? (
                <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200/60 bg-white/50 p-2.5 dark:border-white/10 dark:bg-white/5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-500/5">
                    <Image
                      src={slip}
                      alt="สลิปการโอน"
                      fill
                      unoptimized
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <p className="flex flex-1 items-center gap-1.5 text-sm text-emerald-500">
                    <ShieldCheck className="h-4 w-4" />
                    แนบสลิปแล้ว
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    เปลี่ยน
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  อัพโหลดสลิป
                </Button>
              )}
              <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <ImageIcon className="h-3 w-3" />
                แนบสลิปได้เลย หรือชำระแล้วแจ้งพนักงาน
              </p>
            </div>
          )}

          {/* Total + place */}
          <div className="border-t border-slate-200/60 pt-4 dark:border-white/10">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-slate-900 dark:text-slate-50">ยอดรวม</span>
              <span className="font-mono text-xl font-bold text-slate-900 dark:text-slate-50">
                {formatTHB(subtotal)}
              </span>
            </div>
            {matched && (settings.earnRate ?? 20) > 0 && (
              <p className="mb-3 inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                จะได้รับ ~{Math.floor(subtotal / (settings.earnRate ?? 20))} คะแนนเมื่อชำระสำเร็จ
              </p>
            )}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={submitting}
              disabled={!pay}
              onClick={handlePlace}
            >
              ยืนยันสั่งซื้อ · {formatTHB(subtotal)}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function PayOption({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wallet;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 active:scale-[0.99]",
        active
          ? "border-primary bg-primary/10 shadow-sm dark:bg-primary/15"
          : "border-slate-300/70 bg-white/50 hover:border-slate-400 hover:bg-white/80 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-primary text-white" : "bg-slate-500/10 text-slate-500 dark:text-slate-300",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900 dark:text-slate-50">{title}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{desc}</span>
      </span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          active ? "border-primary bg-primary text-white" : "border-slate-300 dark:border-white/20",
        )}
      >
        {active && <CheckCircle2 className="h-4 w-4" />}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirmation screen                                                        */
/* -------------------------------------------------------------------------- */

function OrderPlaced({
  order,
  tableName,
  earnRate,
  onReset,
}: {
  order: Order;
  tableName: string;
  earnRate?: number;
  onReset: () => void;
}) {
  const status = ORDER_STATUS[order.status];
  const itemCount = order.items.reduce((a, i) => a + i.qty, 0);

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
        <CheckCircle2 className="h-11 w-11" />
      </span>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">รับออเดอร์แล้ว</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          พนักงานกำลังตรวจสอบ และจะเริ่มเตรียมเครื่องดื่มให้คุณ
        </p>
      </div>

      <Card strong className="w-full">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">เลขที่ออเดอร์</span>
            <span className="font-mono text-base font-semibold text-slate-900 dark:text-slate-50">
              {order.code}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">โต๊ะ</span>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{tableName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">สถานะ</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          {order.paymentMethod && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">การชำระเงิน</span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {PAYMENT_LABELS[order.paymentMethod]}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 dark:border-white/10">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
              ยอดรวม ({itemCount} แก้ว)
            </span>
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-50">
              {formatTHB(order.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty hint for members (points apply once staff settles the order). */}
      {order.customerId && (earnRate ?? 20) > 0 && (
        <p className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3.5 py-2 text-sm text-amber-600 dark:text-amber-400">
          <Sparkles className="h-4 w-4" />
          รับ ~{Math.floor(order.total / (earnRate ?? 20))} คะแนนเมื่อชำระเงินเรียบร้อย
        </p>
      )}

      <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Clock className="h-4 w-4" />
        กรุณารอที่โต๊ะสักครู่ เรากำลังเตรียมให้
      </p>

      <Button variant="outline" size="lg" className="w-full" onClick={onReset}>
        <Plus className="h-4 w-4" />
        สั่งเพิ่ม
      </Button>
    </div>
  );
}
