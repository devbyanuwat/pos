"use client";

import { Table, THead, TBody, TR, TH, TD } from "@/components/ui";
import { formatTHB, formatNumber } from "@/lib/utils";
import type { Order } from "@/lib/types";

/** Read-only line-item table + totals block. Shared by receipt + order detail. */
export function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200/60 dark:border-white/10">
        <Table>
          <THead>
            <TR>
              <TH>สินค้า</TH>
              <TH className="text-center">จำนวน</TH>
              <TH className="text-right">ราคา/หน่วย</TH>
              <TH className="text-right">รวม</TH>
            </TR>
          </THead>
          <TBody>
            {order.items.map((it) => (
              <TR key={it.productId}>
                <TD>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{it.name}</span>
                  <span className="ml-2 font-mono text-xs text-slate-400">{it.sku}</span>
                </TD>
                <TD className="text-center font-mono">{formatNumber(it.qty)}</TD>
                <TD className="text-right font-mono">{formatTHB(it.unitPrice)}</TD>
                <TD className="text-right font-mono font-medium">
                  {formatTHB(it.unitPrice * it.qty)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <div className="space-y-2 rounded-xl bg-slate-500/5 p-4">
        <Row label="ยอดรวมย่อย" value={formatTHB(order.subtotal)} />
        {order.discount > 0 && (
          <Row
            label={order.discountLabel ?? "ส่วนลด"}
            value={`-${formatTHB(order.discount)}`}
            tone="discount"
          />
        )}
        <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-white/10">
          <span className="text-base font-semibold text-slate-900 dark:text-slate-50">ยอดสุทธิ</span>
          <span className="font-mono text-xl font-bold text-primary">{formatTHB(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "discount";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span
        className={
          tone === "discount"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-500 dark:text-slate-400"
        }
      >
        {label}
      </span>
      <span
        className={
          tone === "discount"
            ? "font-mono font-medium text-emerald-600 dark:text-emerald-400"
            : "font-mono font-medium text-slate-900 dark:text-slate-50"
        }
      >
        {value}
      </span>
    </div>
  );
}
