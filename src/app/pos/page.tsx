"use client";

import { useState } from "react";
import { Coffee } from "lucide-react";
import { PageHeader, EmptyState, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { useHydrated } from "@/components/shop/use-hydrated";
import { getPriceForCustomer, bestDiscount } from "@/lib/selectors";
import { genId } from "@/lib/utils";
import { MenuGrid } from "@/components/pos/counter/menu-grid";
import { OptionPicker } from "@/components/pos/counter/option-picker";
import { SalePanel } from "@/components/pos/counter/sale-panel";
import { PaymentDialog, type PaymentMethod } from "@/components/pos/counter/payment-dialog";
import { CounterReceiptDialog } from "@/components/pos/counter/receipt-dialog";
import type { CounterSaleLine } from "@/components/pos/counter/types";
import type { OrderItemOption } from "@/lib/store";
import type { Product, Order } from "@/lib/types";

export default function CounterPosPage() {
  // One atomic slice per useStore call (no re-render loops).
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const customers = useStore((s) => s.customers);
  const tiers = useStore((s) => s.tiers);
  const discounts = useStore((s) => s.discounts);
  const settings = useStore((s) => s.settings);
  const createOrder = useStore((s) => s.createOrder);
  const { user } = useAuth();
  const hydrated = useHydrated();

  // The current sale lives in LOCAL state - this is NOT the persisted shop cart.
  const [lines, setLines] = useState<CounterSaleLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);

  // Dialog flow state.
  const [optionFor, setOptionFor] = useState<Product | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [receiptCash, setReceiptCash] = useState<number | null>(null);

  const customer = customers.find((c) => c.id === selectedCustomerId) ?? null;
  const priceFor = (p: Product) => getPriceForCustomer(p, customer, tiers);

  /** Total units of a product already in the sale (across option variants). */
  function qtyInSale(productId: string): number {
    return lines.filter((l) => l.productId === productId).reduce((a, l) => a + l.qty, 0);
  }

  /** Append a sale line (merging an identical product+options combo). */
  function addLine(product: Product, options: OrderItemOption[]) {
    if (qtyInSale(product.id) >= product.stock) {
      toast.info(`สต็อก ${product.name} เหลือ ${product.stock} แก้ว`);
      return;
    }
    const basePrice = priceFor(product);
    const unitPrice = basePrice + options.reduce((a, o) => a + o.priceDelta, 0);
    const optionKey = options.map((o) => o.label).join("|");

    setLines((prev) => {
      const existing = prev.find(
        (l) => l.productId === product.id && l.options.map((o) => o.label).join("|") === optionKey,
      );
      if (existing) {
        return prev.map((l) =>
          l.lineId === existing.lineId ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      const line: CounterSaleLine = {
        lineId: genId("line"),
        productId: product.id,
        name: product.name,
        sku: product.sku,
        image: product.image,
        qty: 1,
        stock: product.stock,
        options,
        basePrice,
        unitPrice,
      };
      return [...prev, line];
    });
  }

  /** Tile tap: open the option picker, or add straight if the item has none. */
  function handlePick(product: Product) {
    if ((product.options?.length ?? 0) > 0) {
      setOptionFor(product);
    } else {
      addLine(product, []);
    }
  }

  function setQty(lineId: string, qty: number) {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.lineId !== lineId);
      return prev.map((l) => {
        if (l.lineId !== lineId) return l;
        const capped = Math.min(qty, l.stock);
        if (capped < qty) toast.info(`สต็อก ${l.name} เหลือ ${l.stock} แก้ว`);
        return { ...l, qty: capped };
      });
    });
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }

  function resetSale() {
    setLines([]);
    setSelectedCustomerId(null);
    setDiscountValue(0);
    setRedeemPoints(0);
  }

  function handleConfirmPayment({
    method,
    cashReceived,
  }: {
    method: PaymentMethod;
    cashReceived: number | null;
  }) {
    if (lines.length === 0) return;

    const order = createOrder({
      customerId: selectedCustomerId,
      // channel "pos" labels the order as "เคาน์เตอร์"; paymentMethod carries the
      // cash/slip/counter intent. orderType is an OrderChannel and stays = channel.
      channel: "pos",
      items: lines.map((l) => ({
        productId: l.productId,
        qty: l.qty,
        options: l.options,
      })),
      status: "paid",
      paymentMethod: method,
      discount: discountValue > 0 ? { amount: discountValue, label: "ส่วนลดหน้าร้าน" } : undefined,
      pointsRedeemed: selectedCustomerId && redeemPoints > 0 ? redeemPoints : undefined,
      createdBy: user?.id,
    });

    setPayOpen(false);
    setReceiptCash(cashReceived);
    setReceipt(order);
    toast.success(`บันทึกบิล ${order.code} เรียบร้อย`);
    resetSale();
  }

  // Live total for the payment dialog. Mirrors createOrder + SalePanel math so
  // the amount due / change shown matches the order that gets created.
  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const autoDiscount = bestDiscount(subtotal, customer, discounts).amount;
  const appliedDiscount = discountValue > 0 ? Math.min(discountValue, subtotal) : autoDiscount;
  const redeemValue = settings.redeemValue ?? 1;
  const wantRedeem = customer ? Math.min(Math.max(0, redeemPoints), customer.points ?? 0) : 0;
  const redeemAmount = Math.min(wantRedeem * redeemValue, subtotal - appliedDiscount);
  const dueTotal = Math.max(0, subtotal - appliedDiscount - redeemAmount);

  return (
    <div>
      <PageHeader
        title="ขายหน้าเคาน์เตอร์"
        description="แตะเมนูเพื่อเปิดบิล เลือกตัวเลือก แล้วเก็บเงินได้ทันที"
      />

      {hydrated && products.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="ยังไม่มีเมนูในระบบ"
          description="เพิ่มเมนูที่หน้าจัดการเมนูก่อนเริ่มขาย"
          className="glass-strong"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_minmax(360px,420px)]">
          <MenuGrid
            products={products}
            categories={categories}
            priceFor={priceFor}
            onPick={handlePick}
          />

          <div className="lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)]">
            <SalePanel
              lines={lines}
              customers={customers}
              tiers={tiers}
              discounts={discounts}
              settings={settings}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={(id) => {
                setSelectedCustomerId(id);
                setRedeemPoints(0);
              }}
              onSetQty={setQty}
              onRemove={removeLine}
              onClear={resetSale}
              discountValue={discountValue}
              onDiscountChange={setDiscountValue}
              redeemPoints={redeemPoints}
              onRedeemChange={setRedeemPoints}
              onCheckout={() => setPayOpen(true)}
            />
          </div>
        </div>
      )}

      <OptionPicker
        product={optionFor}
        basePrice={optionFor ? priceFor(optionFor) : 0}
        onConfirm={(options) => {
          if (optionFor) addLine(optionFor, options);
          setOptionFor(null);
        }}
        onClose={() => setOptionFor(null)}
      />

      <PaymentDialog
        open={payOpen}
        total={dueTotal}
        shopName={settings.shopName}
        onConfirm={handleConfirmPayment}
        onClose={() => setPayOpen(false)}
      />

      <CounterReceiptDialog
        order={receipt}
        cashReceived={receiptCash}
        onNewBill={() => {
          setReceipt(null);
          setReceiptCash(null);
        }}
      />
    </div>
  );
}
