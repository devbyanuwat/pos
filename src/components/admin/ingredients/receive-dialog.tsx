"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, Button, Input, Textarea, Label, Select } from "@/components/ui";
import type { Ingredient } from "@/lib/types";
import type { ReceiveIngredientsInput } from "@/lib/store";
import { formatTHB, genId } from "@/lib/utils";

interface Line {
  key: string;
  ingredientId: string;
  qty: string;
  unitCost: string;
  expiryDate: string; // yyyy-mm-dd, optional
}

const newLine = (ingredients: Ingredient[]): Line => {
  const first = ingredients[0];
  return {
    key: genId("rline"),
    ingredientId: first?.id ?? "",
    qty: "",
    unitCost: first ? String(first.cost) : "",
    expiryDate: "",
  };
};

export function ReceiveIngredientsDialog({
  open,
  onClose,
  onSubmit,
  ingredients,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ReceiveIngredientsInput) => void;
  ingredients: Ingredient[];
}) {
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSupplier("");
    setNote("");
    setError(null);
    setLines([newLine(ingredients)]);
  }, [open, ingredients]);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        // Prefill unit cost from the chosen ingredient's last cost.
        if (patch.ingredientId) {
          const ing = ingredients.find((i) => i.id === patch.ingredientId);
          if (ing) next.unitCost = String(ing.cost);
        }
        return next;
      }),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unitCost) || 0),
    0,
  );

  function submit() {
    const items = lines
      .filter((l) => l.ingredientId && Number(l.qty) > 0)
      .map((l) => ({
        ingredientId: l.ingredientId,
        qty: Math.max(0, Number(l.qty) || 0),
        unitCost: Math.max(0, Number(l.unitCost) || 0),
        // ISO at local noon to avoid timezone drift; omit when not set.
        expiryDate: l.expiryDate
          ? new Date(`${l.expiryDate}T12:00:00`).toISOString()
          : undefined,
      }));
    if (items.length === 0) return setError("กรุณาเพิ่มรายการวัตถุดิบอย่างน้อย 1 รายการ");

    onSubmit({
      supplier: supplier.trim() || undefined,
      items,
      note: note.trim() || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="รับวัตถุดิบเข้า"
      description="บันทึกการรับวัตถุดิบจากซัพพลายเออร์ ระบบจะเพิ่มสต๊อกและอัปเดตวันหมดอายุให้อัตโนมัติ"
      className="max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>บันทึกการรับเข้า</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <Label htmlFor="rcv-supplier">ผู้ขาย / ซัพพลายเออร์</Label>
          <Input
            id="rcv-supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="เช่น โรงคั่วกาแฟ บีนเฮาส์"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="mb-0">รายการวัตถุดิบ</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLines((prev) => [...prev, newLine(ingredients)])}
              disabled={ingredients.length === 0}
            >
              <Plus className="h-4 w-4" /> เพิ่มรายการ
            </Button>
          </div>

          <div className="grid gap-2">
            {lines.map((line) => {
              const ing = ingredients.find((i) => i.id === line.ingredientId);
              const lineTotal = (Number(line.qty) || 0) * (Number(line.unitCost) || 0);
              return (
                <div
                  key={line.key}
                  className="grid grid-cols-2 items-end gap-2 rounded-xl border border-slate-200/60 p-2.5 dark:border-white/10 sm:grid-cols-[1fr_6rem_7rem_9rem_auto]"
                >
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs">วัตถุดิบ</Label>
                    <Select
                      value={line.ingredientId}
                      onChange={(e) => updateLine(line.key, { ingredientId: e.target.value })}
                    >
                      {ingredients.length === 0 && <option value="">ไม่มีวัตถุดิบ</option>}
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">
                      จำนวน{ing ? ` (${ing.unit})` : ""}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                      className="font-mono"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ต้นทุน/หน่วย</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={line.unitCost}
                      onChange={(e) => updateLine(line.key, { unitCost: e.target.value })}
                      className="font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">วันหมดอายุใหม่</Label>
                    <Input
                      type="date"
                      value={line.expiryDate}
                      onChange={(e) => updateLine(line.key, { expiryDate: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
                    <span className="font-mono text-sm text-slate-600 dark:text-slate-300 sm:hidden">
                      {formatTHB(lineTotal)}
                    </span>
                    <span className="hidden w-20 text-right font-mono text-sm text-slate-600 dark:text-slate-300 sm:inline">
                      {formatTHB(lineTotal)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLine(line.key)}
                      disabled={lines.length <= 1}
                      aria-label="ลบรายการ"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            ยอดรวมรับเข้า
          </span>
          <span className="font-mono text-lg font-semibold text-primary">{formatTHB(total)}</span>
        </div>

        <div>
          <Label htmlFor="rcv-note">หมายเหตุ</Label>
          <Textarea
            id="rcv-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="หมายเหตุการรับวัตถุดิบ (ไม่บังคับ)"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
