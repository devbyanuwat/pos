"use client";

import { CheckCircle2, Plus } from "lucide-react";
import { Dialog, Button, Badge } from "@/components/ui";
import { OrderItemsTable } from "./order-items-table";
import { CHANNEL_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";

/** Success receipt shown right after an in-store sale is rung up. */
export function ReceiptDialog({
  order,
  onNewBill,
}: {
  order: Order | null;
  onNewBill: () => void;
}) {
  return (
    <Dialog
      open={!!order}
      onClose={onNewBill}
      footer={
        <Button variant="primary" size="lg" onClick={onNewBill}>
          <Plus className="h-5 w-5" />
          เริ่มบิลใหม่
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
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                {order.code}
              </span>
              <Badge tone="info">{CHANNEL_LABELS[order.channel]}</Badge>
            </div>
            <p className="text-xs text-slate-400">
              {order.customerName} | {formatDateTime(order.createdAt)}
            </p>
          </div>

          <OrderItemsTable order={order} />
        </div>
      )}
    </Dialog>
  );
}
