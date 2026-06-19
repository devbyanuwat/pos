"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  Button,
  Input,
  Textarea,
  Label,
  Select,
} from "@/components/ui";
import type { Product } from "@/lib/types";
import type { CreatePurchaseInput } from "@/lib/store";
import { formatTHB, genId } from "@/lib/utils";

interface Line {
  key: string;
  productId: string;
  qty: string;
  unitCost: string;
}

const newLine = (products: Product[]): Line => {
  const first = products[0];
  return {
    key: genId("line"),
    productId: first?.id ?? "",
    qty: "1",
    unitCost: first ? String(first.cost) : "",
  };
};

export function PurchaseDialog({
  open,
  onClose,
  onSubmit,
  products,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<CreatePurchaseInput, "createdBy">) => void;
  products: Product[];
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
    setLines([newLine(products)]);
  }, [open, products]);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        // When the product changes, prefill unit cost from that product.
        if (patch.productId) {
          const p = products.find((pr) => pr.id === patch.productId);
          if (p) next.unitCost = String(p.cost);
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
      .filter((l) => l.productId && Number(l.qty) > 0)
      .map((l) => ({
        productId: l.productId,
        qty: Math.round(Number(l.qty) || 0),
        unitCost: Math.max(0, Math.round(Number(l.unitCost) || 0)),
      }));
    if (items.length === 0) return setError("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");

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
      title="รับสินค้าเข้า"
      description="บันทึกการรับสินค้า จะเพิ่มสต๊อกและบันทึกเงินสดจ่ายออก"
      className="max-w-2xl"
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
          <Label htmlFor="pu-supplier">ผู้ขาย / ซัพพลายเออร์</Label>
          <Input
            id="pu-supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="เช่น บริษัท เอบีซี จำกัด"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="mb-0">รายการสินค้า</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLines((prev) => [...prev, newLine(products)])}
            >
              <Plus className="h-4 w-4" /> เพิ่มรายการ
            </Button>
          </div>

          <div className="grid gap-2">
            {lines.map((line) => {
              const lineTotal = (Number(line.qty) || 0) * (Number(line.unitCost) || 0);
              return (
                <div
                  key={line.key}
                  className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-xl border border-slate-200/60 p-2.5 dark:border-white/10 sm:grid-cols-[1fr_5rem_7rem_auto]"
                >
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs">สินค้า</Label>
                    <Select
                      value={line.productId}
                      onChange={(e) => updateLine(line.key, { productId: e.target.value })}
                    >
                      {products.length === 0 && <option value="">ไม่มีสินค้า</option>}
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">จำนวน</Label>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ต้นทุน/ชิ้น</Label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={line.unitCost}
                      onChange={(e) => updateLine(line.key, { unitCost: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
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
          <Label htmlFor="pu-note">หมายเหตุ</Label>
          <Textarea
            id="pu-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="หมายเหตุการรับสินค้า (ไม่บังคับ)"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
