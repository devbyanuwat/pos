"use client";

import { QrCodeView } from "@/components/ui";
import type { Table } from "@/lib/types";

/**
 * Clean, printer-friendly tent card for one table. Hidden on screen; revealed
 * only inside the print region (`@media print`) driven by the tables page.
 * Pure black-on-white so it photocopies / prints crisply on any device.
 */
export function TablePrintCard({
  table,
  origin,
  shopName,
}: {
  table: Table;
  origin: string;
  shopName: string;
}) {
  const url = `${origin}/order/${table.id}`;
  const display = origin ? url : `/order/${table.id}`;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-3xl border-2 border-slate-900 bg-white p-10 text-center text-slate-900">
      <p className="text-lg font-semibold tracking-wide">{shopName}</p>
      <div className="h-px w-16 bg-slate-300" />
      <p className="text-4xl font-bold">{table.name}</p>
      <p className="text-base text-slate-600">สแกนเพื่อสั่งอาหารที่โต๊ะ</p>
      <QrCodeView value={url} size={280} className="ring-0 shadow-none" />
      <p className="break-all font-mono text-xs text-slate-500">{display}</p>
    </div>
  );
}
