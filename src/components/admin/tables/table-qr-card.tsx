"use client";

import { Armchair, FileText, Pencil, Printer, Trash2 } from "lucide-react";
import { Card, CardContent, Button, Badge, QrCodeView } from "@/components/ui";
import type { Table } from "@/lib/types";

/**
 * A single dine-in table card with its QR code. The QR encodes the public
 * ordering URL `origin + "/order/" + table.id`. "พิมพ์ QR" sends the QR to the
 * thermal printer; "พิมพ์ลงกระดาษ A4" falls back to the browser tent card.
 */
export function TableQrCard({
  table,
  origin,
  printing,
  onEdit,
  onDelete,
  onPrint,
  onPrintPaper,
}: {
  table: Table;
  origin: string;
  printing?: boolean;
  onEdit: (t: Table) => void;
  onDelete: (t: Table) => void;
  onPrint: (t: Table) => void;
  onPrintPaper: (t: Table) => void;
}) {
  const url = `${origin}/order/${table.id}`;
  const display = origin ? url : `/order/${table.id}`;

  return (
    <Card strong className="group overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="flex flex-col items-center gap-4 p-5 text-center">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="text-left">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {table.name}
            </h3>
            {table.seats != null && (
              <Badge tone="neutral" className="mt-1 gap-1 font-mono">
                <Armchair className="h-3 w-3" />
                {table.seats} ที่นั่ง
              </Badge>
            )}
          </div>
          <div className="flex shrink-0 gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`แก้ไข ${table.name}`}
              onClick={() => onEdit(table)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`ลบ ${table.name}`}
              onClick={() => onDelete(table)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        <QrCodeView value={url} size={150} />

        <p className="max-w-full break-all font-mono text-[11px] leading-snug text-slate-400">
          {display}
        </p>

        <div className="grid w-full gap-2">
          <Button className="w-full" onClick={() => onPrint(table)} disabled={printing}>
            <Printer className="h-4 w-4" />
            {printing ? "กำลังพิมพ์..." : "พิมพ์ QR"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-slate-500"
            onClick={() => onPrintPaper(table)}
          >
            <FileText className="h-4 w-4" />
            พิมพ์ลงกระดาษ A4
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
