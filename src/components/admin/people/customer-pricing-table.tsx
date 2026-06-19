"use client";

import { useState } from "react";
import { Check, Tag, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Input,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
} from "@/components/ui";
import type { Customer, Product, PricingTier } from "@/lib/types";
import { getPriceForCustomer } from "@/lib/selectors";
import { formatTHB } from "@/lib/utils";

/**
 * Per-product pricing for one customer: base price, tier-derived price, and an
 * editable customer-specific override. Saving an empty value clears the override.
 */
export function CustomerPricingTable({
  customer,
  products,
  tiers,
  onSave,
  onClear,
}: {
  customer: Customer;
  products: Product[];
  tiers: PricingTier[];
  onSave: (productId: string, price: number) => void;
  onClear: (productId: string) => void;
}) {
  // Local draft values keyed by productId while the row is being edited.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const overrides = customer.customPrices ?? {};
  const overrideCount = Object.keys(overrides).length;

  const setDraft = (productId: string, value: string) =>
    setDrafts((d) => ({ ...d, [productId]: value }));

  function handleSave(productId: string) {
    const raw = drafts[productId];
    if (raw == null || raw.trim() === "") {
      onClear(productId);
    } else {
      const n = Math.max(0, Math.round(Number(raw) || 0));
      onSave(productId, n);
    }
    setDrafts((d) => {
      const next = { ...d };
      delete next[productId];
      return next;
    });
  }

  function handleClear(productId: string) {
    onClear(productId);
    setDrafts((d) => {
      const next = { ...d };
      delete next[productId];
      return next;
    });
  }

  return (
    <Card strong>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>ราคาเฉพาะลูกค้า</CardTitle>
            <CardDescription>
              ตั้งราคาพิเศษรายสินค้า จะถูกใช้แทนราคาตามระดับเสมอ
            </CardDescription>
          </div>
          <Badge tone={overrideCount > 0 ? "primary" : "neutral"}>
            <Tag className="h-3 w-3" />
            ตั้งราคาพิเศษ {overrideCount} รายการ
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyState icon={Tag} title="ยังไม่มีสินค้า" description="เพิ่มสินค้าก่อนจึงจะตั้งราคาได้" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>สินค้า</TH>
                <TH className="text-right">ราคาฐาน</TH>
                <TH className="text-right">ราคาตามระดับ</TH>
                <TH className="text-right">ราคาเฉพาะลูกค้า</TH>
                <TH className="text-right">จัดการ</TH>
              </TR>
            </THead>
            <TBody>
              {products.map((p) => {
                const tierPrice = getPriceForCustomer(p, customer, tiers);
                const hasOverride = overrides[p.id] != null;
                const draft = drafts[p.id];
                const inputValue =
                  draft != null ? draft : hasOverride ? String(overrides[p.id]) : "";
                return (
                  <TR key={p.id}>
                    <TD>
                      <div className="font-medium text-slate-900 dark:text-slate-50">{p.name}</div>
                      <div className="font-mono text-xs text-slate-400">{p.sku}</div>
                    </TD>
                    <TD className="text-right font-mono text-slate-500 dark:text-slate-400">
                      {formatTHB(p.basePrice)}
                    </TD>
                    <TD className="text-right">
                      <span className="font-mono text-slate-700 dark:text-slate-200">
                        {formatTHB(tierPrice)}
                      </span>
                      {hasOverride && (
                        <span className="ml-2 inline-block">
                          <Badge tone="primary">ใช้ราคาพิเศษ</Badge>
                        </span>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={inputValue}
                        onChange={(e) => setDraft(p.id, e.target.value)}
                        placeholder="ตามระดับ"
                        className="ml-auto h-9 w-32 text-right font-mono"
                      />
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSave(p.id)}
                          disabled={draft == null}
                        >
                          <Check className="h-4 w-4" />
                          บันทึก
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleClear(p.id)}
                          disabled={!hasOverride}
                          aria-label="ล้างราคาพิเศษ"
                          className="h-9 w-9"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
