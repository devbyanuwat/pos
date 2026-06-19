"use client";

import { useMemo } from "react";
import { PackageCheck, PackageOpen, Boxes, User2, Clock } from "lucide-react";
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  EmptyState,
  toast,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { ORDER_STATUS, CHANNEL_LABELS } from "@/lib/constants";
import { formatDateTime, formatNumber } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const QUEUE_STATUSES: OrderStatus[] = ["paid", "packing"];

export default function PackPage() {
  const orders = useStore((s) => s.orders);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);

  // Oldest first - the queue works front to back.
  const queue = useMemo(
    () =>
      orders
        .filter((o) => QUEUE_STATUSES.includes(o.status))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  );

  function advance(order: Order) {
    if (order.status === "paid") {
      updateOrderStatus(order.id, "packing");
      toast.info(`เริ่มแพ็ก ${order.code}`);
    } else if (order.status === "packing") {
      updateOrderStatus(order.id, "completed");
      toast.success(`แพ็ก ${order.code} เสร็จแล้ว`);
    }
  }

  return (
    <div>
      <PageHeader
        title="คิวแพ็กสินค้า"
        description="จัดเตรียมและแพ็กบิลที่ชำระเงินแล้ว เรียงตามคิวเก่าสุดก่อน"
      />

      {queue.length === 0 ? (
        <Card strong>
          <CardContent className="pt-6">
            <EmptyState
              icon={PackageCheck}
              title="ไม่มีบิลรอแพ็ก"
              description="บิลที่ชำระเงินแล้วจะปรากฏที่นี่เพื่อรอการแพ็ก"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queue.map((order) => (
            <PackCard key={order.id} order={order} onAdvance={() => advance(order)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PackCard({ order, onAdvance }: { order: Order; onAdvance: () => void }) {
  const status = ORDER_STATUS[order.status];
  const packing = order.status === "packing";
  const totalQty = order.items.reduce((a, i) => a + i.qty, 0);

  return (
    <Card strong className="flex flex-col">
      <CardHeader className="border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono">{order.code}</CardTitle>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <User2 className="h-3.5 w-3.5" />
            {order.customerName}
          </span>
          <Badge tone={order.channel === "online" ? "info" : "neutral"}>
            {CHANNEL_LABELS[order.channel]}
          </Badge>
        </div>
        <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTime(order.createdAt)}
        </span>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
          <Boxes className="h-3.5 w-3.5" />
          รายการสินค้า {formatNumber(totalQty)} ชิ้น
        </p>
        <ul className="flex flex-1 flex-col gap-2">
          {order.items.map((it) => (
            <li
              key={it.productId}
              className="flex items-center gap-3 rounded-lg bg-slate-500/5 px-3 py-2"
            >
              <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-primary/15 px-1.5 font-mono text-sm font-semibold text-primary">
                {it.qty}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                {it.name}
              </span>
              <span className="shrink-0 font-mono text-xs text-slate-400">{it.sku}</span>
            </li>
          ))}
        </ul>

        <Button
          variant={packing ? "success" : "primary"}
          size="lg"
          className="mt-1 w-full"
          onClick={onAdvance}
        >
          {packing ? (
            <>
              <PackageCheck className="h-5 w-5" />
              แพ็กเสร็จ
            </>
          ) : (
            <>
              <PackageOpen className="h-5 w-5" />
              เริ่มแพ็ก
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
