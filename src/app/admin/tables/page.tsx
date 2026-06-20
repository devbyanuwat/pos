"use client";

import { useEffect, useState } from "react";
import { Plus, QrCode } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Table } from "@/lib/types";
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  EmptyState,
  toast,
} from "@/components/ui";
import {
  TableFormDialog,
  TableQrCard,
  TablePrintCard,
} from "@/components/admin/tables";

export default function TablesPage() {
  const tables = useStore((s) => s.tables);
  const settings = useStore((s) => s.settings);
  const addTable = useStore((s) => s.addTable);
  const updateTable = useStore((s) => s.updateTable);
  const removeTable = useStore((s) => s.removeTable);

  // Origin is window-only; resolve after mount so SSR + first paint stay safe.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [printTable, setPrintTable] = useState<Table | null>(null);

  // When a print target is set, render its tent card then trigger the browser
  // print dialog. Cleared once the dialog closes so the screen view returns.
  useEffect(() => {
    if (!printTable || typeof window === "undefined") return;
    const cleanup = () => setPrintTable(null);
    window.addEventListener("afterprint", cleanup);
    const id = window.setTimeout(() => window.print(), 80);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("afterprint", cleanup);
    };
  }, [printTable]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(t: Table) {
    setEditing(t);
    setDialogOpen(true);
  }

  function handleSubmit(data: { name: string; seats?: number }) {
    if (editing) {
      updateTable(editing.id, data);
      toast.success("บันทึกโต๊ะแล้ว");
    } else {
      addTable(data);
      toast.success("เพิ่มโต๊ะแล้ว");
    }
    setDialogOpen(false);
    setEditing(null);
  }

  function handleDelete(t: Table) {
    const ok = window.confirm(`ลบ "${t.name}" ? QR ของโต๊ะนี้จะใช้งานไม่ได้อีก`);
    if (!ok) return;
    removeTable(t.id);
    toast.success("ลบโต๊ะแล้ว");
  }

  return (
    <div>
      <PageHeader
        title="โต๊ะ & QR"
        description="จัดการโต๊ะและคิวอาร์โค้ดสำหรับสั่งอาหารที่โต๊ะ"
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            เพิ่มโต๊ะ
          </Button>
        }
      />

      <Card strong className="mb-4">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ลูกค้าสแกน QR ที่โต๊ะเพื่อเปิดเมนูและสั่งได้เอง ลิงก์จะชี้ไปที่{" "}
            <span className="font-mono text-slate-500 dark:text-slate-400">/order/&lt;รหัสโต๊ะ&gt;</span>
          </p>
          <Badge tone="primary" className="w-fit gap-1 font-mono">
            <QrCode className="h-3.5 w-3.5" />
            {tables.length} โต๊ะ
          </Badge>
        </CardContent>
      </Card>

      {tables.length === 0 ? (
        <Card strong>
          <CardContent className="py-4">
            <EmptyState
              icon={QrCode}
              title="ยังไม่มีโต๊ะ"
              description="เพิ่มโต๊ะแรกเพื่อสร้าง QR สำหรับสั่งอาหารที่โต๊ะ"
              action={
                <Button onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  เพิ่มโต๊ะ
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((t) => (
            <TableQrCard
              key={t.id}
              table={t}
              origin={origin}
              onEdit={openEdit}
              onDelete={handleDelete}
              onPrint={setPrintTable}
            />
          ))}
        </div>
      )}

      <TableFormDialog
        open={dialogOpen}
        table={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      {/* Print-only region: hidden on screen, the only thing on the printed page. */}
      <div id="table-print-region" aria-hidden={!printTable}>
        {printTable && (
          <TablePrintCard table={printTable} origin={origin} shopName={settings.shopName} />
        )}
      </div>

      {/* Print-scoping CSS. Plain <style> (no styled-jsx dependency). */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #table-print-region { display: none; }
            @media print {
              body * { visibility: hidden !important; }
              #table-print-region, #table-print-region * { visibility: visible !important; }
              #table-print-region {
                display: block !important;
                position: absolute;
                inset: 0;
                margin: 0;
                padding: 32px;
                background: #ffffff;
              }
            }
          `,
        }}
      />
    </div>
  );
}
