"use client";

import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  User2,
  Armchair,
  CreditCard,
  ImageOff,
  Sparkles,
  Wallet,
  QrCode,
} from "lucide-react";
import { Dialog, Button, Badge, QrCodeView } from "@/components/ui";
import { OrderLineItems } from "./order-line-items";
import {
  ORDER_STATUS,
  NEXT_STATUS,
  CHANNEL_LABELS,
  PAYMENT_LABELS,
} from "@/lib/constants";
import { promptPayPayload } from "@/lib/promptpay";
import { formatTHB, formatDateTime } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * Full order view for staff on the order board: line items (with option labels),
 * totals, dine-in table, payment method, the uploaded slip, plus contextual
 * actions — verify slip, take counter payment, advance fulfilment, cancel.
 */
export function OrderDetailSheet({
  order,
  tableName,
  shopName,
  promptpayId,
  onClose,
  onVerifySlip,
  onTakeCounterPayment,
  onAdvance,
  onCancel,
}: {
  order: Order | null;
  tableName?: string;
  /** Shop display name, shown above the payment QR. */
  shopName?: string;
  /** PromptPay proxy id used to build the payment QR. */
  promptpayId?: string;
  onClose: () => void;
  onVerifySlip: (id: string) => void;
  onTakeCounterPayment: (id: string) => void;
  onAdvance: (id: string, next: OrderStatus) => void;
  onCancel: (id: string) => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!order) return null;

  const status = ORDER_STATUS[order.status];
  const next = NEXT_STATUS[order.status];
  const isCancelled = order.status === "cancelled";

  // Slip waiting for a barista/cashier to confirm.
  const canVerifySlip =
    order.paymentMethod === "slip" && !!order.paymentSlip && !order.slipVerified;
  // Pay-at-counter QR order still owing money.
  const canTakeCounter =
    order.paymentMethod === "counter" && order.status === "pending_payment";
  // Any unpaid bill can be settled by showing a PromptPay QR at the counter.
  const owesPayment = order.status === "pending_payment";
  const payQr = owesPayment ? promptPayPayload(promptpayId, order.total) : null;

  const close = () => {
    setConfirmCancel(false);
    setShowQr(false);
    onClose();
  };

  return (
    <Dialog
      open={!!order}
      onClose={close}
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono">{order.code}</span>
          <Badge tone={status.tone}>{status.label}</Badge>
        </span>
      }
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {!isCancelled &&
            (confirmCancel ? (
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  ยืนยันยกเลิก?
                </span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>
                  ไม่
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onCancel(order.id);
                    close();
                  }}
                >
                  ยกเลิกบิล
                </Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmCancel(true)}>
                <Ban className="h-4 w-4" />
                ยกเลิกบิล
              </Button>
            ))}

          {owesPayment && (
            <Button variant="outline" onClick={() => setShowQr((v) => !v)}>
              <QrCode className="h-4 w-4" />
              {showQr ? "ซ่อน QR" : "แสดง QR ชำระเงิน"}
            </Button>
          )}

          {canVerifySlip && (
            <Button variant="success" onClick={() => onVerifySlip(order.id)}>
              <BadgeCheck className="h-4 w-4" />
              ยืนยันสลิป
            </Button>
          )}

          {canTakeCounter && (
            <Button variant="success" onClick={() => onTakeCounterPayment(order.id)}>
              <Wallet className="h-4 w-4" />
              รับชำระที่เคาน์เตอร์
            </Button>
          )}

          {next && (
            <Button variant="primary" onClick={() => onAdvance(order.id, next)}>
              ดำเนินการต่อ: {ORDER_STATUS[next].label}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Meta row: customer, channel, table, payment, time */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <User2 className="h-4 w-4 text-slate-400" />
            {order.customerName}
          </span>
          <Badge tone="neutral">{CHANNEL_LABELS[order.channel]}</Badge>
          {order.channel === "qr" && tableName && (
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <Armchair className="h-4 w-4 text-slate-400" />
              {tableName}
            </span>
          )}
          {order.paymentMethod && (
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <CreditCard className="h-4 w-4 text-slate-400" />
              {PAYMENT_LABELS[order.paymentMethod]}
            </span>
          )}
          <span className="text-slate-400">{formatDateTime(order.createdAt)}</span>
        </div>

        {/* Line items with option labels */}
        <OrderLineItems items={order.items} />

        {/* Totals */}
        <div className="space-y-2 rounded-xl bg-slate-500/5 p-4">
          <TotalRow label="ยอดรวมย่อย" value={formatTHB(order.subtotal)} />
          {order.discount > 0 && (
            <TotalRow
              label={order.discountLabel ?? "ส่วนลด"}
              value={`-${formatTHB(order.discount)}`}
              tone="discount"
            />
          )}
          {!!order.pointsRedeemed && order.pointsRedeemed > 0 && (
            <TotalRow
              label={`ใช้คะแนน ${order.pointsRedeemed} แต้ม`}
              value={`-${formatTHB(order.pointsRedeemed)}`}
              tone="discount"
            />
          )}
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-white/10">
            <span className="text-base font-semibold text-slate-900 dark:text-slate-50">
              ยอดสุทธิ
            </span>
            <span className="font-mono text-xl font-bold text-primary">
              {formatTHB(order.total)}
            </span>
          </div>
          {!!order.pointsEarned && order.pointsEarned > 0 && (
            <p className="flex items-center justify-end gap-1 text-xs text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              ได้รับ {order.pointsEarned} แต้ม
            </p>
          )}
        </div>

        {/* Payment QR — barista presents it when the customer pays at the counter */}
        {showQr && owesPayment && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
            {payQr ? (
              <>
                <QrCodeView value={payQr} size={196} />
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  {shopName ? `${shopName} · ` : ""}ให้ลูกค้าสแกนเพื่อชำระ{" "}
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
                    {formatTHB(order.total)}
                  </span>
                </p>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <QrCode className="h-4 w-4" />
                ยังไม่ได้ตั้งค่าพร้อมเพย์ — ไปที่ ตั้งค่า เพื่อเพิ่มเบอร์/เลขพร้อมเพย์
              </p>
            )}
          </div>
        )}

        {/* Payment slip — shown when a slip exists */}
        {order.paymentMethod === "slip" && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              หลักฐานการชำระเงิน
              {order.slipVerified && (
                <Badge tone="success">
                  <BadgeCheck className="h-3 w-3" />
                  ยืนยันแล้ว
                </Badge>
              )}
            </p>
            {order.paymentSlip ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={order.paymentSlip}
                alt="สลิปการโอนเงิน"
                className="max-h-72 w-full rounded-xl border border-slate-200/60 object-contain dark:border-white/10"
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-500/5 p-4 text-sm text-slate-400">
                <ImageOff className="h-4 w-4" />
                ลูกค้ายังไม่ได้แนบสลิป
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function TotalRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "discount";
}) {
  const cls =
    tone === "discount"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-slate-500 dark:text-slate-400";
  const valueCls =
    tone === "discount"
      ? "font-mono font-medium text-emerald-600 dark:text-emerald-400"
      : "font-mono font-medium text-slate-900 dark:text-slate-50";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cls}>{label}</span>
      <span className={valueCls}>{value}</span>
    </div>
  );
}
