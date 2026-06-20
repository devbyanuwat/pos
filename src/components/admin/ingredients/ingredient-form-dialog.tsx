"use client";

import { useEffect, useState } from "react";
import { Dialog, Button, Input, Label } from "@/components/ui";
import type { Ingredient } from "@/lib/types";
import type { NewIngredient } from "@/lib/store";

/** Local form state — all numeric fields kept as strings for input control. */
interface FormState {
  name: string;
  unit: string;
  stock: string;
  lowThreshold: string;
  expiryDate: string; // yyyy-mm-dd (input type=date)
  cost: string;
}

const EMPTY: FormState = {
  name: "",
  unit: "",
  stock: "",
  lowThreshold: "",
  expiryDate: "",
  cost: "",
};

/** Convert an ISO datetime into the yyyy-mm-dd value an <input type="date"> expects. */
function isoToDateValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Convert a yyyy-mm-dd date value back to an ISO string (local noon to avoid TZ drift). */
function dateValueToISO(value: string): string {
  if (!value) return new Date().toISOString();
  return new Date(`${value}T12:00:00`).toISOString();
}

export function IngredientFormDialog({
  open,
  onClose,
  onSubmit,
  ingredient,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewIngredient) => void;
  /** When provided, the dialog is in edit mode. */
  ingredient?: Ingredient | null;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(ingredient);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (ingredient) {
      setForm({
        name: ingredient.name,
        unit: ingredient.unit,
        stock: String(ingredient.stock),
        lowThreshold: String(ingredient.lowThreshold),
        expiryDate: isoToDateValue(ingredient.expiryDate),
        cost: String(ingredient.cost),
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, ingredient]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const name = form.name.trim();
    const unit = form.unit.trim();
    if (!name) return setError("กรุณากรอกชื่อวัตถุดิบ");
    if (!unit) return setError("กรุณากรอกหน่วยนับ เช่น กรัม มล. ขวด");
    if (!form.expiryDate) return setError("กรุณาเลือกวันหมดอายุ");

    onSubmit({
      name,
      unit,
      stock: Math.max(0, Number(form.stock) || 0),
      lowThreshold: Math.max(0, Number(form.lowThreshold) || 0),
      expiryDate: dateValueToISO(form.expiryDate),
      cost: Math.max(0, Number(form.cost) || 0),
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบ"}
      description="กำหนดยอดคงเหลือ จุดสั่งซื้อ และวันหมดอายุของวัตถุดิบ"
      className="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>{isEdit ? "บันทึกการแก้ไข" : "เพิ่มวัตถุดิบ"}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <Label htmlFor="ing-name">ชื่อวัตถุดิบ</Label>
            <Input
              id="ing-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="เช่น นมสด, เมล็ดกาแฟคั่ว"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="ing-unit">หน่วยนับ</Label>
            <Input
              id="ing-unit"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              placeholder="กรัม / มล."
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ing-stock">คงเหลือปัจจุบัน</Label>
            <Input
              id="ing-stock"
              type="number"
              min={0}
              inputMode="decimal"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              className="font-mono"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="ing-low">จุดสั่งซื้อ (ใกล้หมด)</Label>
            <Input
              id="ing-low"
              type="number"
              min={0}
              inputMode="decimal"
              value={form.lowThreshold}
              onChange={(e) => set("lowThreshold", e.target.value)}
              className="font-mono"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ing-expiry">วันหมดอายุ</Label>
            <Input
              id="ing-expiry"
              type="date"
              value={form.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="ing-cost">ต้นทุน / หน่วย (บาท)</Label>
            <Input
              id="ing-cost"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              className="font-mono"
              placeholder="0.00"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
