"use client";

import { Eye, ImageIcon, Wallet, Armchair } from "lucide-react";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
  Button,
} from "@/components/ui";
import { ORDER_STATUS, NEXT_STATUS, CHANNEL_LABELS } from "@/lib/constants";
import { formatTHB, formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";

/** The order board table. Newest-first list with status + slip cues per row. */
export function OrderTable({
  orders,
  tableNames,
  onView,
}: {
  orders: Order[];
  tableNames: Record<string, string>;
  onView: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <THead>
          <TR>
            <TH>รหัสบิล</TH>
            <TH>เวลา</TH>
            <TH>ลูกค้า / โต๊ะ</TH>
            <TH>ช่องทาง</TH>
            <TH className="text-right">ยอด</TH>
            <TH>สถานะ</TH>
            <TH className="text-right">จัดการ</TH>
          </TR>
        </THead>
        <TBody>
          {orders.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              tableName={o.tableId ? tableNames[o.tableId] : undefined}
              onView={() => onView(o.id)}
            />
          ))}
        </TBody>
      </Table>
    </div>
  );
}

function OrderRow({
  order,
  tableName,
  onView,
}: {
  order: Order;
  tableName?: string;
  onView: () => void;
}) {
  const status = ORDER_STATUS[order.status];
  const needsSlip =
    order.paymentMethod === "slip" && !!order.paymentSlip && !order.slipVerified;
  const needsCounter =
    order.paymentMethod === "counter" && order.status === "pending_payment";
  const hasNext = !!NEXT_STATUS[order.status];
  const wantsAttention = needsSlip || needsCounter || hasNext;

  return (
    <TR className="transition-colors hover:bg-slate-500/5">
      <TD className="font-mono font-medium text-slate-900 dark:text-slate-50">
        {order.code}
      </TD>
      <TD className="whitespace-nowrap text-slate-500 dark:text-slate-400">
        {formatDateTime(order.createdAt)}
      </TD>
      <TD>
        <span className="text-slate-700 dark:text-slate-200">{order.customerName}</span>
        {order.channel === "qr" && tableName && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <Armchair className="h-3 w-3" />
            {tableName}
          </span>
        )}
      </TD>
      <TD>
        <Badge tone={channelTone(order.channel)}>{CHANNEL_LABELS[order.channel]}</Badge>
      </TD>
      <TD className="text-right font-mono font-medium">{formatTHB(order.total)}</TD>
      <TD>
        <span className="flex items-center gap-1.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          {needsSlip && (
            <span title="มีสลิปรอตรวจสอบ" className="text-amber-500">
              <ImageIcon className="h-3.5 w-3.5" />
            </span>
          )}
          {needsCounter && (
            <span title="รอรับชำระที่เคาน์เตอร์" className="text-amber-500">
              <Wallet className="h-3.5 w-3.5" />
            </span>
          )}
        </span>
      </TD>
      <TD className="text-right">
        <Button variant={wantsAttention ? "primary" : "outline"} size="sm" onClick={onView}>
          <Eye className="h-4 w-4" />
          ดู
        </Button>
      </TD>
    </TR>
  );
}

function channelTone(channel: Order["channel"]) {
  switch (channel) {
    case "online":
      return "info" as const;
    case "qr":
      return "primary" as const;
    default:
      return "neutral" as const;
  }
}
