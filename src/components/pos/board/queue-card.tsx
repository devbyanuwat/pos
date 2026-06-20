"use client";

import { Coffee, Check, User2, Armchair, Clock, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { OrderLineItems } from "./order-line-items";
import { ORDER_STATUS, CHANNEL_LABELS } from "@/lib/constants";
import { formatDateTime, formatNumber } from "@/lib/utils";
import type { Order } from "@/lib/types";

/**
 * One ticket in the barista queue. Shows table / customer, an item checklist
 * with option labels, and the single primary action to move the order forward
 * (paid -> packing "เริ่มชง", packing -> completed "เสิร์ฟแล้ว").
 */
export function QueueCard({
  order,
  tableName,
  onAdvance,
}: {
  order: Order;
  tableName?: string;
  onAdvance: () => void;
}) {
  const status = ORDER_STATUS[order.status];
  const brewing = order.status === "packing";
  const totalQty = order.items.reduce((a, i) => a + i.qty, 0);

  return (
    <Card strong className="flex flex-col">
      <CardHeader className="border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono">{order.code}</CardTitle>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {order.channel === "qr" && tableName ? (
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
              <Armchair className="h-3.5 w-3.5" />
              {tableName}
            </span>
          ) : null}
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
          <ListChecks className="h-3.5 w-3.5" />
          รายการ {formatNumber(totalQty)} แก้ว
        </p>

        <div className="flex-1">
          <OrderLineItems items={order.items} showPrice={false} />
        </div>

        <Button
          variant={brewing ? "success" : "primary"}
          size="lg"
          className="mt-1 w-full"
          onClick={onAdvance}
        >
          {brewing ? (
            <>
              <Check className="h-5 w-5" />
              เสิร์ฟแล้ว
            </>
          ) : (
            <>
              <Coffee className="h-5 w-5" />
              เริ่มชง
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
