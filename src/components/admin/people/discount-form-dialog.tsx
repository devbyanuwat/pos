"use client";

import { useEffect, useState } from "react";
import { Dialog, Button, Input, Label, Select } from "@/components/ui";
import type { Discount, DiscountType, PricingTier } from "@/lib/types";
import type { NewDiscount } from "@/lib/store";
import { formatTHB } from "@/lib/utils";

interface FormState {
  name: string;
  type: DiscountType;
  value: string;
  scope: "all" | "tier";
  tierId: string;
  minSubtotal: string;
}

const emptyForm = (tierId: string): FormState => ({
  name: "",
  type: "percent",
  value: "",
  scope: "all",
  tierId,
  minSubtotal: "",
});

function toForm(d: Discount, fallbackTier: string): FormState {
  return {
    name: d.name,
    type: d.type,
    value: String(d.value),
    scope: d.scope,
    tierId: d.tierId ?? fallbackTier,
    minSubtotal: d.minSubtotal != null ? String(d.minSubtotal) : "",
  };
}

/** Create/edit dialog for an end-of-bill discount rule. */
export function DiscountFormDialog({
  open,
  onClose,
  onSubmit,
  discount,
  tiers,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewDiscount) => void;
  /** When set, the dialog edits; otherwise it creates. */
  discount?: Discount | null;
  tiers: PricingTier[];
}) {
  const isEdit = !!discount;
  const fallbackTier = tiers[0]?.id ?? "";
  const [form, setForm] = useState<FormState>(emptyForm(fallbackTier));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(discount ? toForm(discount, fallbackTier) : emptyForm(fallbackTier));
  }, [open, discount, fallbackTier]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const value = Number(form.value) || 0;

  function submit() {
    if (!form.name.trim()) return setError("กรุณากรอกชื่อส่วนลด");
    if (value <= 0) return setError("ค่าส่วนลดต้องมากกว่า 0");
    if (form.type === "percent" && value > 100) return setError("เปอร์เซ็นต์ต้องไม่เกิน 100");

    const min = Math.max(0, Math.round(Number(form.minSubtotal) || 0));

    onSubmit({
      name: form.name.trim(),
      type: form.type,
      value: Math.max(0, Math.round(value)),
      active: discount?.active ?? true,
      scope: form.scope,
      tierId: form.scope === "tier" ? form.tierId : undefined,
      minSubtotal: min > 0 ? min : undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "แก้ไขส่วนลด" : "เพิ่มส่วนลด"}
      description={
        isEdit ? "ปรับเงื่อนไขส่วนลดและบันทึก" : "ส่วนลดท้ายบิลที่ระบบจะเลือกใช้อัตโนมัติ"
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>{isEdit ? "บันทึกการแก้ไข" : "เพิ่มส่วนลด"}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <Label htmlFor="df-name">ชื่อส่วนลด</Label>
          <Input
            id="df-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="เช่น ลดท้ายบิล 5% เมื่อซื้อครบ 1,000"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="df-type">ประเภท</Label>
            <Select
              id="df-type"
              value={form.type}
              onChange={(e) => set("type", e.target.value as DiscountType)}
            >
              <option value="percent">เปอร์เซ็นต์</option>
              <option value="fixed">จำนวนเงิน</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="df-value">
              {form.type === "percent" ? "ค่า (%)" : "ค่า (บาท)"}
            </Label>
            <Input
              id="df-value"
              type="number"
              min={0}
              inputMode="numeric"
              value={form.value}
              onChange={(e) => set("value", e.target.value)}
              placeholder="0"
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="df-scope">ขอบเขต</Label>
            <Select
              id="df-scope"
              value={form.scope}
              onChange={(e) => set("scope", e.target.value as "all" | "tier")}
            >
              <option value="all">ทุกบิล</option>
              <option value="tier">เฉพาะระดับราคา</option>
            </Select>
          </div>
          {form.scope === "tier" && (
            <div>
              <Label htmlFor="df-tier">ระดับราคา</Label>
              <Select
                id="df-tier"
                value={form.tierId}
                onChange={(e) => set("tierId", e.target.value)}
              >
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="df-min">ยอดขั้นต่ำ (บาท)</Label>
          <Input
            id="df-min"
            type="number"
            min={0}
            inputMode="numeric"
            value={form.minSubtotal}
            onChange={(e) => set("minSubtotal", e.target.value)}
            placeholder="ไม่กำหนด"
            className="font-mono"
          />
          {Number(form.minSubtotal) > 0 && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              ใช้ได้เมื่อยอดก่อนหักถึง{" "}
              <span className="font-mono">{formatTHB(Number(form.minSubtotal))}</span>
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
