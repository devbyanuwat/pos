"use client";

import { useEffect, useState } from "react";
import { Dialog, Button, Input, Label } from "@/components/ui";
import type { Table } from "@/lib/types";

interface FormState {
  name: string;
  seats: string;
}

const emptyForm: FormState = { name: "", seats: "" };

function toForm(t: Table): FormState {
  return { name: t.name, seats: t.seats != null ? String(t.seats) : "" };
}

/** Create/edit dialog for a dine-in table. When `table` is set it edits. */
export function TableFormDialog({
  open,
  table,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** When set, the dialog edits; otherwise it creates. */
  table?: Table | null;
  onClose: () => void;
  onSubmit: (data: { name: string; seats?: number }) => void;
}) {
  const isEdit = !!table;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(table ? toForm(table) : emptyForm);
  }, [open, table]);

  function submit() {
    const name = form.name.trim();
    if (!name) {
      setError("กรุณากรอกชื่อโต๊ะ");
      return;
    }
    const seatsNum = Math.floor(Number(form.seats));
    onSubmit({
      name,
      seats: form.seats.trim() && seatsNum > 0 ? seatsNum : undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "แก้ไขโต๊ะ" : "เพิ่มโต๊ะ"}
      description={isEdit ? "ปรับชื่อหรือจำนวนที่นั่ง" : "เพิ่มโต๊ะใหม่สำหรับสั่งผ่าน QR"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>{isEdit ? "บันทึก" : "เพิ่มโต๊ะ"}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <Label htmlFor="tf-name">ชื่อโต๊ะ</Label>
          <Input
            id="tf-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="เช่น โต๊ะ 7 หรือ Bar 3"
          />
        </div>
        <div>
          <Label htmlFor="tf-seats">จำนวนที่นั่ง (ไม่บังคับ)</Label>
          <Input
            id="tf-seats"
            type="number"
            min={1}
            inputMode="numeric"
            value={form.seats}
            onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
            placeholder="เช่น 4"
            className="font-mono"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
