"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { useHydrated } from "@/components/shop/use-hydrated";
import { getPriceForCustomer } from "@/lib/selectors";
import { toast } from "@/components/ui";
import { ProductGrid } from "@/components/pos/product-grid";
import { SalePanel, type SaleLine } from "@/components/pos/sale-panel";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import type { Product, Order } from "@/lib/types";

export default function PosSalePage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const customers = useStore((s) => s.customers);
  const tiers = useStore((s) => s.tiers);
  const discounts = useStore((s) => s.discounts);
  const createOrder = useStore((s) => s.createOrder);
  const { user } = useAuth();
  const hydrated = useHydrated();

  // The current sale lives in LOCAL state - this is NOT the shop cart.
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [manualDiscount, setManualDiscount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Order | null>(null);

  const customer = customers.find((c) => c.id === selectedCustomerId) ?? null;
  const priceFor = (p: Product) => getPriceForCustomer(p, customer, tiers);

  function addToSale(p: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.qty >= p.stock) {
          toast.info(`สต็อก ${p.name} เหลือ ${p.stock} ชิ้น`);
          return prev;
        }
        return prev.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { productId: p.id, qty: 1 }];
    });
  }

  function setQty(productId: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function resetSale() {
    setLines([]);
    setSelectedCustomerId(null);
    setManualDiscount("");
  }

  function handleCheckout() {
    if (lines.length === 0) return;
    setSubmitting(true);

    const manualNum = manualDiscount.trim() === "" ? null : Number(manualDiscount);
    const hasManual = manualNum != null && Number.isFinite(manualNum) && manualNum > 0;

    const order = createOrder({
      customerId: selectedCustomerId,
      channel: "pos",
      items: lines,
      status: "paid",
      discount: hasManual
        ? { amount: manualNum as number, label: "ส่วนลดหน้าร้าน" }
        : undefined,
      createdBy: user?.id,
    });

    resetSale();
    setSubmitting(false);
    toast.success(`บันทึกบิล ${order.code} เรียบร้อย`);
    setReceipt(order);
  }

  return (
    <div>
      <PageHeader
        title="ขายหน้าร้าน"
        description="เลือกสินค้า ตั้งราคาตามลูกค้า แล้วเก็บเงินได้ทันที"
      />

      {hydrated && products.length === 0 ? (
        <div className="glass-strong flex flex-col items-center gap-2 rounded-2xl px-6 py-16 text-center">
          <Store className="h-10 w-10 text-slate-400" />
          <p className="font-medium text-slate-700 dark:text-slate-200">ยังไม่มีสินค้าในระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_minmax(360px,420px)]">
          <ProductGrid
            products={products}
            categories={categories}
            priceFor={priceFor}
            onPick={addToSale}
          />

          <div className="lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)]">
            <SalePanel
              lines={lines}
              products={products}
              customers={customers}
              tiers={tiers}
              discounts={discounts}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={setSelectedCustomerId}
              onSetQty={setQty}
              onRemove={removeLine}
              manualDiscount={manualDiscount}
              onManualDiscountChange={setManualDiscount}
              onCheckout={handleCheckout}
              submitting={submitting}
            />
          </div>
        </div>
      )}

      <ReceiptDialog order={receipt} onNewBill={() => setReceipt(null)} />
    </div>
  );
}
