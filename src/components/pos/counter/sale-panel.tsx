"use client";

import { useMemo, useState } from "react";
import {
  Trash2,
  ShoppingCart,
  Receipt,
  Tag,
  Pencil,
  Sparkles,
  Eraser,
  Minus,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  Label,
  Badge,
  EmptyState,
} from "@/components/ui";
import { NumpadDialog } from "./numpad-dialog";
import { bestDiscount } from "@/lib/selectors";
import { formatTHB, formatNumber } from "@/lib/utils";
import type { CounterSaleLine } from "./types";
import type { Customer, PricingTier, Discount, Settings } from "@/lib/types";

/**
 * RIGHT pane of the counter POS. Pure presentation + local numpad dialogs; the
 * page owns the sale lines and pricing. Subtotal/discount/redeem/total are
 * computed here for display and the same numbers are passed up on checkout.
 */
export function SalePanel({
  lines,
  customers,
  tiers,
  discounts,
  settings,
  selectedCustomerId,
  onSelectCustomer,
  onSetQty,
  onRemove,
  onClear,
  discountValue,
  onDiscountChange,
  redeemPoints,
  onRedeemChange,
  onCheckout,
}: {
  lines: CounterSaleLine[];
  customers: Customer[];
  tiers: PricingTier[];
  discounts: Discount[];
  settings: Settings;
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string | null) => void;
  onSetQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onClear: () => void;
  /** Manual discount in baht (0 = use auto). */
  discountValue: number;
  onDiscountChange: (v: number) => void;
  /** Points the member chooses to redeem. */
  redeemPoints: number;
  onRedeemChange: (v: number) => void;
  onCheckout: () => void;
}) {
  const customer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const auto = bestDiscount(subtotal, customer, discounts);
  const hasManual = discountValue > 0;
  const appliedDiscount = hasManual ? Math.min(discountValue, subtotal) : auto.amount;

  const redeemValue = settings.redeemValue ?? 1;
  const memberPoints = customer?.points ?? 0;
  const wantRedeem = customer ? Math.min(Math.max(0, redeemPoints), memberPoints) : 0;
  const redeemAmount = Math.min(wantRedeem * redeemValue, subtotal - appliedDiscount);

  const total = Math.max(0, subtotal - appliedDiscount - redeemAmount);
  const empty = lines.length === 0;

  const earnRate = settings.earnRate ?? 20;
  const willEarn = customer && earnRate > 0 ? Math.floor(total / earnRate) : 0;

  // Numpad dialog state: which line's qty is being edited, and the discount/redeem modals.
  const [qtyEdit, setQtyEdit] = useState<CounterSaleLine | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);

  return (
    <Card strong className="flex h-full flex-col">
      <CardHeader className="border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            บิลปัจจุบัน
          </CardTitle>
          {!empty && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-500 dark:text-slate-400"
            >
              <Eraser className="h-3.5 w-3.5" />
              ล้างบิล
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pt-5">
        <div>
          <Label htmlFor="counter-customer">ลูกค้า</Label>
          <Select
            id="counter-customer"
            value={selectedCustomerId ?? ""}
            onChange={(e) => onSelectCustomer(e.target.value === "" ? null : e.target.value)}
          >
            <option value="">ลูกค้าทั่วไป (walk-in)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {typeof c.points === "number" ? ` - ${c.points} แต้ม` : ""}
              </option>
            ))}
          </Select>
          {customer && (
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="primary">
                <Sparkles className="mr-1 h-3 w-3" />
                {formatNumber(memberPoints)} คะแนน
              </Badge>
              {memberPoints > 0 && (
                <button
                  type="button"
                  onClick={() => setRedeemOpen(true)}
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  {wantRedeem > 0 ? `ใช้ ${wantRedeem} แต้ม` : "ใช้คะแนน"}
                </button>
              )}
            </div>
          )}
        </div>

        {empty ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={ShoppingCart}
              title="ยังไม่มีรายการ"
              description="แตะเมนูด้านซ้ายเพื่อเริ่มบิล"
            />
          </div>
        ) : (
          <div className="-mx-1 flex flex-1 flex-col gap-2 overflow-y-auto px-1">
            {lines.map((l) => (
              <div key={l.lineId} className="rounded-xl bg-slate-500/5 p-2.5">
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.image}
                    alt={l.name}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                      {l.name}
                    </p>
                    {l.options.length > 0 && (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {l.options.map((o) => o.label).join(" · ")}
                      </p>
                    )}
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {formatTHB(l.unitPrice)} / แก้ว
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(l.lineId)}
                    aria-label="ลบรายการ"
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <StepBtn
                      ariaLabel="ลดจำนวน"
                      onClick={() => onSetQty(l.lineId, l.qty - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </StepBtn>
                    <button
                      type="button"
                      onClick={() => setQtyEdit(l)}
                      className="flex h-9 min-w-12 items-center justify-center gap-1 rounded-lg border border-slate-300/60 bg-white/60 px-2 font-mono text-sm font-semibold text-slate-900 transition-colors hover:bg-white/90 dark:border-white/12 dark:bg-white/5 dark:text-slate-50 dark:hover:bg-white/10"
                      aria-label="แก้ไขจำนวน"
                    >
                      {l.qty}
                      <Pencil className="h-3 w-3 text-slate-400" />
                    </button>
                    <StepBtn
                      ariaLabel="เพิ่มจำนวน"
                      disabled={l.qty >= l.stock}
                      onClick={() => onSetQty(l.lineId, l.qty + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </StepBtn>
                  </div>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {formatTHB(l.unitPrice * l.qty)}
                  </span>
                </div>
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

          <button
            type="button"
            onClick={() => setDiscountOpen(true)}
            disabled={empty}
            className="flex w-full items-center justify-between rounded-lg px-1 py-0.5 text-left transition-colors hover:text-primary disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Pencil className="h-3.5 w-3.5" />
              ส่วนลดเอง
            </span>
            <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-50">
              {hasManual ? `-${formatTHB(Math.min(discountValue, subtotal))}` : "แตะเพื่อใส่"}
            </span>
          </button>

          {redeemAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                ใช้ {formatNumber(wantRedeem)} คะแนน
              </span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                -{formatTHB(redeemAmount)}
              </span>
            </div>
          )}

          <div className="flex items-end justify-between border-t border-slate-200/60 pt-3 dark:border-white/10">
            <div>
              <span className="text-base font-medium text-slate-700 dark:text-slate-200">
                ยอดสุทธิ
              </span>
              {willEarn > 0 && (
                <p className="text-xs text-primary">+{formatNumber(willEarn)} คะแนนเมื่อชำระ</p>
              )}
            </div>
            <span className="font-mono text-3xl font-bold text-primary">{formatTHB(total)}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="h-14 w-full text-base"
            disabled={empty}
            onClick={onCheckout}
          >
            <Receipt className="h-5 w-5" />
            เก็บเงิน {formatTHB(total)}
          </Button>
        </div>
      </CardContent>

      <NumpadDialog
        open={!!qtyEdit}
        title={`จำนวน · ${qtyEdit?.name ?? ""}`}
        label="จำนวน"
        suffix="แก้ว"
        initial={qtyEdit ? String(qtyEdit.qty) : ""}
        hint={qtyEdit ? `คงเหลือในสต็อก ${formatNumber(qtyEdit.stock)}` : undefined}
        onSubmit={(v) => {
          if (qtyEdit) onSetQty(qtyEdit.lineId, Math.floor(v));
          setQtyEdit(null);
        }}
        onClose={() => setQtyEdit(null)}
      />

      <NumpadDialog
        open={discountOpen}
        title="ส่วนลดท้ายบิล"
        label="ส่วนลด"
        suffix="บาท"
        initial={discountValue > 0 ? String(discountValue) : ""}
        hint={auto.amount > 0 ? `ส่วนลดอัตโนมัติ ${formatTHB(auto.amount)}` : undefined}
        onSubmit={(v) => {
          onDiscountChange(Math.max(0, Math.floor(v)));
          setDiscountOpen(false);
        }}
        onClose={() => setDiscountOpen(false)}
      />

      <NumpadDialog
        open={redeemOpen}
        title="ใช้คะแนนสะสม"
        label="จำนวนคะแนน"
        suffix="แต้ม"
        initial={redeemPoints > 0 ? String(redeemPoints) : ""}
        hint={`มี ${formatNumber(memberPoints)} แต้ม · 1 แต้ม = ${formatTHB(redeemValue)}`}
        onSubmit={(v) => {
          onRedeemChange(Math.min(memberPoints, Math.max(0, Math.floor(v))));
          setRedeemOpen(false);
        }}
        onClose={() => setRedeemOpen(false)}
      />
    </Card>
  );
}

function StepBtn({
  children,
  ariaLabel,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300/60 bg-white/60 text-slate-600 transition-colors hover:bg-white/90 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-white/12 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}
