"use client";

import { CheckCircle2, Plus, Sparkles } from "lucide-react";
import { Dialog, Button, Badge } from "@/components/ui";
import { CHANNEL_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { formatTHB, formatNumber, formatDateTime } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Order } from "@/lib/types";

/**
 * Success receipt shown right after a counter sale is settled. Lists items with
 * their chosen option labels, the totals, change due (for cash), and points
 * earned when a member was attached. "บิลใหม่" clears for the next customer.
 */
export function CounterReceiptDialog({
  order,
  cashReceived,
  onNewBill,
}: {
  order: Order | null;
  /** Cash handed over, when paid by cash — drives the change line. */
  cashReceived: number | null;
  onNewBill: () => void;
}) {
  const salesChannels = useStore((s) => s.salesChannels);

  const change =
    order && cashReceived != null ? Math.max(0, cashReceived - order.total) : null;

  // Resolve delivery platform name from store (falls back to constant label).
  const platformName =
    order?.channel === "delivery" && order.salesChannelId
      ? (salesChannels.find((c) => c.id === order.salesChannelId)?.name ??
        CHANNEL_LABELS.delivery)
      : null;

  const isDelivery = !!platformName;
  const commission = order?.commission ?? 0;
  const netToShop = order ? order.total - commission : 0;

  return (
    <Dialog
      open={!!order}
      onClose={onNewBill}
      footer={
        <Button variant="primary" size="lg" className="w-full" onClick={onNewBill}>
          <Plus className="h-5 w-5" />
          เปิดบิลใหม่
        </Button>
      }
    >
      {order && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              เก็บเงินสำเร็จ
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                {order.code}
              </span>
              <Badge tone="info">
                {isDelivery ? platformName : CHANNEL_LABELS[order.channel]}
              </Badge>
              {order.paymentMethod && (
                <Badge tone="neutral">{PAYMENT_LABELS[order.paymentMethod]}</Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {order.customerName} | {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-500/5 p-4">
            {order.items.map((it, idx) => (
              <div key={`${it.productId}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {it.name}
                    <span className="ml-1.5 font-mono text-xs text-slate-400">x{it.qty}</span>
                  </p>
                  {it.options && it.options.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {it.options.join(" · ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-mono font-medium text-slate-900 dark:text-slate-50">
                  {formatTHB(it.unitPrice * it.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Row label="ยอดรวมย่อย" value={formatTHB(order.subtotal)} />
            {order.discount > 0 && (
              <Row
                label={order.discountLabel ?? "ส่วนลด"}
                value={`-${formatTHB(order.discount)}`}
                tone="discount"
              />
            )}
            {order.pointsRedeemed ? (
              <Row
                label={`ใช้คะแนน ${formatNumber(order.pointsRedeemed)} แต้ม`}
                value=""
                tone="discount"
              />
            ) : null}
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-white/10">
              <span className="text-base font-semibold text-slate-900 dark:text-slate-50">
                ยอดสุทธิ
              </span>
              <span className="font-mono text-2xl font-bold text-primary">
                {formatTHB(order.total)}
              </span>
            </div>

            {isDelivery && commission > 0 && (
              <div className="space-y-1.5 rounded-xl bg-slate-500/5 px-3 py-2.5">
                <Row
                  label={`ค่าคอม GP (${platformName})`}
                  value={`-${formatTHB(commission)}`}
                  tone="commission"
                />
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-sm dark:border-white/10">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    สุทธิเข้าร้าน
                  </span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatTHB(netToShop)}
                  </span>
                </div>
              </div>
            )}

            {cashReceived != null && (
              <>
                <Row label="รับเงินสด" value={formatTHB(cashReceived)} />
                <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
                  <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                    เงินทอน
                  </span>
                  <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatTHB(change ?? 0)}
                  </span>
                </div>
              </>
            )}
          </div>

          {order.pointsEarned ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">
                ได้รับ {formatNumber(order.pointsEarned)} คะแนน
              </span>
            </div>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "discount" | "commission";
}) {
  const labelClass =
    tone === "discount"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "commission"
        ? "text-rose-600 dark:text-rose-400"
        : "text-slate-500 dark:text-slate-400";

  const valueClass =
    tone === "discount"
      ? "font-mono font-medium text-emerald-600 dark:text-emerald-400"
      : tone === "commission"
        ? "font-mono font-medium text-rose-600 dark:text-rose-400"
        : "font-mono font-medium text-slate-900 dark:text-slate-50";

  return (
    <div className="flex items-center justify-between text-sm">
      <span className={labelClass}>{label}</span>
      {value && <span className={valueClass}>{value}</span>}
    </div>
  );
}
