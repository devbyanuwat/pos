"use client";

import { useState } from "react";
import { ArrowRight, BadgeCheck, Ban, User2, ImageOff } from "lucide-react";
import { Dialog, Button, Badge } from "@/components/ui";
import { OrderItemsTable } from "./order-items-table";
import { ORDER_STATUS, NEXT_STATUS, CHANNEL_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";

/**
 * Full order view for staff: line items, totals, payment slip, and the action
 * buttons to verify a slip, advance the fulfilment status, or cancel the bill.
 */
export function OrderDetailDialog({
  order,
  onClose,
  onVerifySlip,
  onAdvance,
  onCancel,
}: {
  order: Order | null;
  onClose: () => void;
  onVerifySlip: (id: string) => void;
  onAdvance: (id: string, next: NonNullable<ReturnType<typeof getNext>>) => void;
  onCancel: (id: string) => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!order) return null;

  const status = ORDER_STATUS[order.status];
  const next = getNext(order.status);
  const canVerify =
    order.channel === "online" && !!order.paymentSlip && !order.slipVerified;
  const isCancelled = order.status === "cancelled";

  const close = () => {
    setConfirmCancel(false);
    onClose();
  };

  return (
    <Dialog
      open={!!order}
      onClose={close}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono">{order.code}</span>
          <Badge tone={status.tone}>{status.label}</Badge>
        </span>
      }
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          {!isCancelled &&
            (confirmCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">ยืนยันยกเลิก?</span>
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

          {canVerify && (
            <Button variant="success" onClick={() => onVerifySlip(order.id)}>
              <BadgeCheck className="h-4 w-4" />
              ยืนยันสลิป
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <User2 className="h-4 w-4 text-slate-400" />
            {order.customerName}
          </span>
          <Badge tone="neutral">{CHANNEL_LABELS[order.channel]}</Badge>
          <span className="text-slate-400">{formatDateTime(order.createdAt)}</span>
        </div>

        <OrderItemsTable order={order} />

        {order.channel === "online" && (
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

function getNext(status: Order["status"]) {
  return NEXT_STATUS[status];
}
