"use client";

import { useMemo } from "react";
import { Trash2, ShoppingCart, Receipt, Tag } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  Input,
  Label,
  EmptyState,
} from "@/components/ui";
import { QtyStepper } from "@/components/shop/qty-stepper";
import { bestDiscount, getPriceForCustomer } from "@/lib/selectors";
import { formatTHB } from "@/lib/utils";
import type { Product, Customer, PricingTier, Discount } from "@/lib/types";

export interface SaleLine {
  productId: string;
  qty: number;
}

/**
 * Right pane of the POS sale screen. Owns no domain state itself - the parent
 * page holds the local sale in useState and passes everything down.
 */
export function SalePanel({
  lines,
  products,
  customers,
  tiers,
  discounts,
  selectedCustomerId,
  onSelectCustomer,
  onSetQty,
  onRemove,
  manualDiscount,
  onManualDiscountChange,
  onCheckout,
  submitting,
}: {
  lines: SaleLine[];
  products: Product[];
  customers: Customer[];
  tiers: PricingTier[];
  discounts: Discount[];
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string | null) => void;
  onSetQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  manualDiscount: string;
  onManualDiscountChange: (v: string) => void;
  onCheckout: () => void;
  submitting: boolean;
}) {
  const customer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  const rows = useMemo(
    () =>
      lines
        .map((l) => {
          const product = products.find((p) => p.id === l.productId);
          if (!product) return null;
          const unitPrice = getPriceForCustomer(product, customer, tiers);
          return { product, qty: l.qty, unitPrice, lineTotal: unitPrice * l.qty };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [lines, products, customer, tiers],
  );

  const subtotal = rows.reduce((a, r) => a + r.lineTotal, 0);
  const auto = bestDiscount(subtotal, customer, discounts);
  const manualNum = manualDiscount.trim() === "" ? null : Number(manualDiscount);
  const hasManual = manualNum != null && Number.isFinite(manualNum) && manualNum > 0;
  const appliedDiscount = hasManual ? Math.min(manualNum as number, subtotal) : auto.amount;
  const total = Math.max(0, subtotal - appliedDiscount);
  const empty = rows.length === 0;

  return (
    <Card strong className="flex h-full flex-col">
      <CardHeader className="border-b border-slate-200/60 dark:border-white/10">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          บิลขายปัจจุบัน
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-5">
        <div>
          <Label htmlFor="pos-customer">ลูกค้า</Label>
          <Select
            id="pos-customer"
            value={selectedCustomerId ?? ""}
            onChange={(e) => onSelectCustomer(e.target.value === "" ? null : e.target.value)}
          >
            <option value="">ลูกค้าหน้าร้าน (walk-in)</option>
            {customers.map((c) => {
              const tier = tiers.find((t) => t.id === c.tierId);
              return (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {tier ? ` - ${tier.name}` : ""}
                </option>
              );
            })}
          </Select>
        </div>

        {empty ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={ShoppingCart}
              title="ยังไม่มีสินค้าในบิล"
              description="เลือกสินค้าจากด้านซ้ายเพื่อเริ่มขาย"
            />
          </div>
        ) : (
          <div className="-mx-1 flex flex-1 flex-col gap-2 overflow-y-auto px-1">
            {rows.map((r) => (
              <div
                key={r.product.id}
                className="flex items-center gap-3 rounded-xl bg-slate-500/5 p-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.product.image}
                  alt={r.product.name}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                    {r.product.name}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {formatTHB(r.unitPrice)} x {r.qty}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {formatTHB(r.lineTotal)}
                </span>
                <QtyStepper
                  size="sm"
                  value={r.qty}
                  min={1}
                  max={r.product.stock}
                  onChange={(q) => onSetQty(r.product.id, q)}
                />
                <button
                  type="button"
                  onClick={() => onRemove(r.product.id)}
                  aria-label="ลบรายการ"
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 border-t border-slate-200/60 pt-4 dark:border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">ยอดรวมย่อย</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-50">
              {formatTHB(subtotal)}
            </span>
          </div>

          {!hasManual && auto.amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Tag className="h-3.5 w-3.5" />
                {auto.label ?? "ส่วนลดอัตโนมัติ"}
              </span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                -{formatTHB(auto.amount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="pos-discount" className="mb-0 shrink-0 text-slate-500 dark:text-slate-400">
              ส่วนลดเอง (บาท)
            </Label>
            <Input
              id="pos-discount"
              type="number"
              inputMode="numeric"
              min={0}
              value={manualDiscount}
              onChange={(e) => onManualDiscountChange(e.target.value)}
              placeholder={auto.amount > 0 ? `อัตโนมัติ ${auto.amount}` : "0"}
              className="h-10 w-32 text-right font-mono"
            />
          </div>

          <div className="flex items-end justify-between border-t border-slate-200/60 pt-3 dark:border-white/10">
            <span className="text-base font-medium text-slate-700 dark:text-slate-200">ยอดสุทธิ</span>
            <span className="font-mono text-3xl font-bold text-primary">{formatTHB(total)}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full text-base"
            disabled={empty}
            loading={submitting}
            onClick={onCheckout}
          >
            <Receipt className="h-5 w-5" />
            เก็บเงิน
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
