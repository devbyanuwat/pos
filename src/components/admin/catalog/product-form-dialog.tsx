"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import {
  Dialog,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  Switch,
} from "@/components/ui";
import type { Category, Product } from "@/lib/types";
import type { NewProduct } from "@/lib/store";
import { cn, formatTHB } from "@/lib/utils";

interface FormState {
  name: string;
  sku: string;
  categoryId: string;
  cost: string;
  basePrice: string;
  stock: string;
  lowStockThreshold: string;
  description: string;
  image: string;
  active: boolean;
}

const emptyForm = (categoryId: string): FormState => ({
  name: "",
  sku: "",
  categoryId,
  cost: "",
  basePrice: "",
  stock: "",
  lowStockThreshold: "5",
  description: "",
  image: "",
  active: true,
});

function toForm(p: Product): FormState {
  return {
    name: p.name,
    sku: p.sku,
    categoryId: p.categoryId,
    cost: String(p.cost),
    basePrice: String(p.basePrice),
    stock: String(p.stock),
    lowStockThreshold: String(p.lowStockThreshold),
    description: p.description ?? "",
    image: p.image ?? "",
    active: p.active,
  };
}

export interface ProductFormSubmit extends NewProduct {}

export function ProductFormDialog({
  open,
  onClose,
  onSubmit,
  product,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormSubmit) => void;
  /** When set, the dialog edits; otherwise it creates. */
  product?: Product | null;
  categories: Category[];
}) {
  const isEdit = !!product;
  const [form, setForm] = useState<FormState>(emptyForm(categories[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-seed the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(product ? toForm(product) : emptyForm(categories[0]?.id ?? ""));
  }, [open, product, categories]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const cost = Number(form.cost) || 0;
  const basePrice = Number(form.basePrice) || 0;
  const margin = basePrice > 0 ? Math.round(((basePrice - cost) / basePrice) * 100) : 0;

  function handleFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!form.name.trim()) return setError("กรุณากรอกชื่อสินค้า");
    if (!form.sku.trim()) return setError("กรุณากรอกรหัสสินค้า (SKU)");
    if (!form.categoryId) return setError("กรุณาเลือกหมวดหมู่");
    if (basePrice <= 0) return setError("ราคาขายต้องมากกว่า 0");

    onSubmit({
      name: form.name.trim(),
      sku: form.sku.trim(),
      categoryId: form.categoryId,
      image: form.image,
      cost: Math.max(0, Math.round(cost)),
      basePrice: Math.max(0, Math.round(basePrice)),
      stock: Math.max(0, Math.round(Number(form.stock) || 0)),
      lowStockThreshold: Math.max(0, Math.round(Number(form.lowStockThreshold) || 0)),
      description: form.description.trim() || undefined,
      active: form.active,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
      description={isEdit ? "ปรับข้อมูลสินค้าและบันทึก" : "กรอกรายละเอียดสินค้าใหม่"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>{isEdit ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="flex gap-4">
          {/* Image picker + preview */}
          <div className="shrink-0">
            <Label>รูปสินค้า</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300/70 bg-white/50 text-slate-400 transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:bg-white/5",
              )}
            >
              {form.image ? (
                // Data URL or remote URL preview; plain img keeps it simple in-dialog.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="ตัวอย่างรูปสินค้า" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-7 w-7" />
              )}
            </button>
            {form.image && (
              <button
                type="button"
                onClick={() => set("image", "")}
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
              >
                <X className="h-3 w-3" /> ลบรูป
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-1 flex-col justify-center gap-3">
            <div>
              <Label htmlFor="pf-name">ชื่อสินค้า</Label>
              <Input
                id="pf-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="เช่น กาแฟคั่วบด 250 กรัม"
              />
            </div>
            <div>
              <Label htmlFor="pf-sku">รหัสสินค้า (SKU)</Label>
              <Input
                id="pf-sku"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="เช่น SKU-0001"
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="pf-cat">หมวดหมู่</Label>
          <Select
            id="pf-cat"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            {categories.length === 0 && <option value="">ยังไม่มีหมวดหมู่</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pf-cost">ต้นทุน (บาท)</Label>
            <Input
              id="pf-cost"
              type="number"
              min={0}
              inputMode="numeric"
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              placeholder="0"
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="pf-price">ราคาขาย (บาท)</Label>
            <Input
              id="pf-price"
              type="number"
              min={0}
              inputMode="numeric"
              value={form.basePrice}
              onChange={(e) => set("basePrice", e.target.value)}
              placeholder="0"
              className="font-mono"
            />
          </div>
        </div>

        {basePrice > 0 && (
          <p className="-mt-1 text-xs text-slate-500 dark:text-slate-400">
            กำไรต่อชิ้น{" "}
            <span className="font-mono font-medium text-emerald-500">
              {formatTHB(basePrice - cost)}
            </span>{" "}
            ({margin}%)
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pf-stock">สต๊อกคงเหลือ</Label>
            <Input
              id="pf-stock"
              type="number"
              min={0}
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              placeholder="0"
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="pf-low">จุดสั่งซื้อ (แจ้งเตือน)</Label>
            <Input
              id="pf-low"
              type="number"
              min={0}
              inputMode="numeric"
              value={form.lowStockThreshold}
              onChange={(e) => set("lowStockThreshold", e.target.value)}
              placeholder="5"
              className="font-mono"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="pf-desc">รายละเอียด</Label>
          <Textarea
            id="pf-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="คำอธิบายสินค้า (ไม่บังคับ)"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200/60 px-3.5 py-2.5 dark:border-white/10">
          <div className="flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700 dark:text-slate-200">เปิดขายสินค้านี้</span>
          </div>
          <Switch checked={form.active} onChange={(v) => set("active", v)} />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
