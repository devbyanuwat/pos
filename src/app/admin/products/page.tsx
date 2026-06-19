"use client";

import { useMemo, useState } from "react";
import { Package, Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Dialog,
  EmptyState,
  toast,
} from "@/components/ui";
import {
  ProductImage,
  ProductFormDialog,
  type ProductFormSubmit,
} from "@/components/admin/catalog";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, formatTHB } from "@/lib/utils";

export default function ProductsPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const removeProduct = useStore((s) => s.removeProduct);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "-";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (showInactive ? true : p.active))
      .filter((p) => (categoryFilter === "all" ? true : p.categoryId === categoryFilter))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      )
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "th"));
  }, [products, query, categoryFilter, showInactive]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
  }

  function handleSubmit(data: ProductFormSubmit) {
    if (editing) {
      updateProduct(editing.id, data);
      toast.success("บันทึกการแก้ไขสินค้าแล้ว");
    } else {
      addProduct(data);
      toast.success("เพิ่มสินค้าใหม่แล้ว");
    }
    setFormOpen(false);
    setEditing(null);
  }

  function confirmDelete() {
    if (!deleting) return;
    removeProduct(deleting.id);
    toast.success(`นำ "${deleting.name}" ออกจากการขายแล้ว`);
    setDeleting(null);
  }

  return (
    <div>
      <PageHeader
        title="จัดการสินค้า"
        description="เพิ่ม แก้ไข และจัดการรายการสินค้าทั้งหมดในร้าน"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> เพิ่มสินค้า
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หรือ SKU"
            className="pl-10"
          />
        </div>
        <div className="sm:w-56">
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant={showInactive ? "secondary" : "outline"}
          onClick={() => setShowInactive((v) => !v)}
        >
          {showInactive ? "ซ่อนที่ปิดขาย" : "แสดงที่ปิดขาย"}
        </Button>
      </div>

      <Card strong>
        <CardContent className="p-0 sm:p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={Package}
              title="ไม่พบสินค้า"
              description="ลองปรับคำค้นหา หรือเพิ่มสินค้าใหม่เข้าระบบ"
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> เพิ่มสินค้า
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH className="w-14">รูป</TH>
                  <TH>SKU</TH>
                  <TH>ชื่อสินค้า</TH>
                  <TH>หมวดหมู่</TH>
                  <TH className="text-right">ต้นทุน</TH>
                  <TH className="text-right">ราคาขาย</TH>
                  <TH className="text-right">กำไร%</TH>
                  <TH className="text-right">สต๊อก</TH>
                  <TH>สถานะ</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((p) => {
                  const margin =
                    p.basePrice > 0
                      ? Math.round(((p.basePrice - p.cost) / p.basePrice) * 100)
                      : 0;
                  const isLow = p.stock <= p.lowStockThreshold;
                  return (
                    <TR
                      key={p.id}
                      className={cn(
                        "transition-colors hover:bg-slate-500/5",
                        !p.active && "opacity-50",
                      )}
                    >
                      <TD>
                        <ProductImage src={p.image} alt={p.name} size={40} />
                      </TD>
                      <TD className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {p.sku}
                      </TD>
                      <TD className="font-medium text-slate-900 dark:text-slate-100">{p.name}</TD>
                      <TD className="text-slate-500 dark:text-slate-400">
                        {categoryName(p.categoryId)}
                      </TD>
                      <TD className="text-right font-mono">{formatTHB(p.cost)}</TD>
                      <TD className="text-right font-mono font-medium">{formatTHB(p.basePrice)}</TD>
                      <TD className="text-right font-mono text-emerald-500">{margin}%</TD>
                      <TD className="text-right">
                        <span className="inline-flex items-center justify-end gap-2">
                          <span className="font-mono">{p.stock}</span>
                          {isLow && <Badge tone="danger">ใกล้หมด</Badge>}
                        </span>
                      </TD>
                      <TD>
                        {p.active ? (
                          <Badge tone="success">เปิดขาย</Badge>
                        ) : (
                          <Badge tone="neutral">ปิดขาย</Badge>
                        )}
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                            aria-label={`แก้ไข ${p.name}`}
                          >
                            <Pencil className="h-4 w-4" /> แก้ไข
                          </Button>
                          {p.active && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleting(p)}
                              aria-label={`ลบ ${p.name}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
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

      <ProductFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        product={editing}
        categories={categories}
      />

      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="ยืนยันการลบสินค้า"
        description={
          deleting
            ? `ต้องการนำ "${deleting.name}" ออกจากการขายใช่หรือไม่ สินค้าจะถูกซ่อน แต่ประวัติการขายยังคงอยู่`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              ยกเลิก
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> ลบสินค้า
            </Button>
          </>
        }
      />
    </div>
  );
}
