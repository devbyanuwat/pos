"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  AlertTriangle,
  PackageX,
  Minus,
  Plus,
  Check,
  Search,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Button,
  Input,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
  toast,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { lowStockProducts } from "@/lib/selectors";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function StockPage() {
  const products = useStore((s) => s.products);
  const adjustStock = useStore((s) => s.adjustStock);

  const [query, setQuery] = useState("");
  const [refillFor, setRefillFor] = useState<string | null>(null);
  const [refillAmount, setRefillAmount] = useState("");

  const active = useMemo(() => products.filter((p) => p.active), [products]);
  const low = useMemo(() => lowStockProducts(products), [products]);
  const outOfStock = useMemo(() => active.filter((p) => p.stock <= 0).length, [active]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => {
        // Low-stock first, then by remaining stock ascending.
        const aLow = a.stock <= a.lowStockThreshold ? 0 : 1;
        const bLow = b.stock <= b.lowStockThreshold ? 0 : 1;
        return aLow - bLow || a.stock - b.stock;
      });
  }, [active, query]);

  function quickAdjust(p: Product, delta: number) {
    if (delta < 0 && p.stock <= 0) return;
    adjustStock(p.id, delta);
  }

  function applyRefill(p: Product) {
    const n = Math.round(Number(refillAmount) || 0);
    if (n <= 0) {
      toast.error("กรุณากรอกจำนวนที่ต้องการเติม");
      return;
    }
    adjustStock(p.id, n);
    toast.success(`เติมสต๊อก "${p.name}" จำนวน ${n} ชิ้น`);
    setRefillFor(null);
    setRefillAmount("");
  }

  return (
    <div>
      <PageHeader
        title="ภาพรวมสต๊อก"
        description="ตรวจสอบยอดคงเหลือ ปรับสต๊อก และดูสินค้าที่ใกล้หมด"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="จำนวน SKU (เปิดขาย)" value={active.length} icon={Boxes} tone="primary" />
        <StatCard
          label="ใกล้หมด"
          value={low.length}
          icon={AlertTriangle}
          tone="warning"
          hint="สต๊อกถึงจุดสั่งซื้อ"
        />
        <StatCard label="หมดสต๊อก" value={outOfStock} icon={PackageX} tone="danger" />
      </div>

      {low.length > 0 && (
        <Card className="mb-6 border border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" /> สินค้าใกล้หมด
            </CardTitle>
            <CardDescription>เติมสต๊อกก่อนสินค้าหมด เพื่อไม่ให้ขาดช่วงการขาย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {low.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-amber-500/10 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {p.name}
                    </p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{p.sku}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "font-mono text-sm font-semibold",
                        p.stock <= 0 ? "text-red-500" : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {p.stock} / {p.lowStockThreshold}
                    </p>
                    <p className="text-[11px] text-slate-400">คงเหลือ / จุดสั่งซื้อ</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 sm:max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หรือ SKU"
            className="pl-10"
          />
        </div>
      </div>

      <Card strong>
        <CardContent className="p-0 sm:p-0">
          {rows.length === 0 ? (
            <EmptyState icon={Boxes} title="ไม่พบสินค้า" description="ลองปรับคำค้นหา" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>ชื่อสินค้า</TH>
                  <TH>SKU</TH>
                  <TH className="text-right">คงเหลือ</TH>
                  <TH className="text-right">จุดสั่งซื้อ</TH>
                  <TH>สถานะ</TH>
                  <TH className="text-right">ปรับสต๊อก</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  const isOut = p.stock <= 0;
                  return (
                    <TR key={p.id} className="transition-colors hover:bg-slate-500/5">
                      <TD className="font-medium text-slate-900 dark:text-slate-100">{p.name}</TD>
                      <TD className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {p.sku}
                      </TD>
                      <TD
                        className={cn(
                          "text-right font-mono font-semibold",
                          isOut
                            ? "text-red-500"
                            : isLow
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-900 dark:text-slate-100",
                        )}
                      >
                        {p.stock}
                      </TD>
                      <TD className="text-right font-mono text-slate-500 dark:text-slate-400">
                        {p.lowStockThreshold}
                      </TD>
                      <TD>
                        {isOut ? (
                          <Badge tone="danger">หมดสต๊อก</Badge>
                        ) : isLow ? (
                          <Badge tone="warning">ใกล้หมด</Badge>
                        ) : (
                          <Badge tone="success">ปกติ</Badge>
                        )}
                      </TD>
                      <TD>
                        {refillFor === p.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Input
                              type="number"
                              min={1}
                              inputMode="numeric"
                              autoFocus
                              value={refillAmount}
                              onChange={(e) => setRefillAmount(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") applyRefill(p);
                                if (e.key === "Escape") setRefillFor(null);
                              }}
                              placeholder="จำนวน"
                              className="h-9 w-24 font-mono"
                            />
                            <Button size="sm" variant="success" onClick={() => applyRefill(p)}>
                              <Check className="h-4 w-4" /> เติม
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRefillFor(null);
                                setRefillAmount("");
                              }}
                            >
                              ยกเลิก
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => quickAdjust(p, -1)}
                              disabled={isOut}
                              aria-label={`ลดสต๊อก ${p.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => quickAdjust(p, 1)}
                              aria-label={`เพิ่มสต๊อก ${p.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setRefillFor(p.id);
                                setRefillAmount("");
                              }}
                            >
                              เติมสต๊อก
                            </Button>
                          </div>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
