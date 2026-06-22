"use client";

import { useMemo, useState } from "react";
import {
  Coffee,
  Plus,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
  FlaskConical,
  LayoutGrid,
  Percent,
} from "lucide-react";
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
  StatCard,
  toast,
} from "@/components/ui";
import { MenuImage, MenuFormDialog, type MenuFormSubmit } from "@/components/admin/menu";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, formatTHB } from "@/lib/utils";

function marginOf(p: Product): number {
  return p.basePrice > 0 ? Math.round(((p.basePrice - p.cost) / p.basePrice) * 100) : 0;
}

function marginTone(margin: number): "success" | "warning" | "danger" {
  return margin >= 50 ? "success" : margin >= 25 ? "warning" : "danger";
}

export default function MenuPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const ingredients = useStore((s) => s.ingredients);
  const salesChannels = useStore((s) => s.salesChannels);
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
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .sort(
        (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "th"),
      );
  }, [products, query, categoryFilter, showInactive]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.active);
    const avgMargin = active.length
      ? Math.round(active.reduce((a, p) => a + marginOf(p), 0) / active.length)
      : 0;
    return { total: active.length, categories: categories.length, avgMargin };
  }, [products, categories]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
  }

  function handleSubmit(data: MenuFormSubmit) {
    if (editing) {
      updateProduct(editing.id, data);
      toast.success("บันทึกการแก้ไขเมนูแล้ว");
    } else {
      addProduct(data);
      toast.success("เพิ่มเมนูใหม่แล้ว");
    }
    setFormOpen(false);
    setEditing(null);
  }

  function confirmDelete() {
    if (!deleting) return;
    removeProduct(deleting.id);
    toast.success(`นำ "${deleting.name}" ออกจากเมนูแล้ว`);
    setDeleting(null);
  }

  return (
    <div>
      <PageHeader
        title="จัดการเมนู"
        description="เพิ่ม แก้ไข ตั้งราคา ตัวเลือก และสูตรของเมนูทั้งหมดในร้าน"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> เพิ่มเมนู
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="เมนูที่เปิดขาย" value={stats.total} icon={Coffee} tone="primary" />
        <StatCard label="หมวดหมู่" value={stats.categories} icon={LayoutGrid} tone="info" />
        <StatCard
          label="กำไรเฉลี่ย"
          value={`${stats.avgMargin}%`}
          icon={Percent}
          tone="success"
          hint="เฉพาะเมนูที่เปิดขาย"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อเมนู หรือ SKU"
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
              icon={Coffee}
              title="ไม่พบเมนู"
              description="ลองปรับคำค้นหา หรือเพิ่มเมนูใหม่เข้าร้าน"
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> เพิ่มเมนู
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH className="w-14">รูป</TH>
                  <TH>เมนู</TH>
                  <TH className="hidden md:table-cell">หมวดหมู่</TH>
                  <TH className="hidden text-right sm:table-cell">ต้นทุน</TH>
                  <TH className="text-right">ราคาขาย</TH>
                  <TH className="text-right">กำไร%</TH>
                  <TH className="hidden lg:table-cell">ตัวเลือก</TH>
                  <TH className="hidden lg:table-cell">สูตร</TH>
                  <TH>สถานะ</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((p) => {
                  const margin = marginOf(p);
                  const optionCount = p.options?.length ?? 0;
                  const recipeCount = p.recipe?.length ?? 0;
                  return (
                    <TR
                      key={p.id}
                      className={cn(
                        "transition-colors hover:bg-slate-500/5",
                        !p.active && "opacity-50",
                      )}
                    >
                      <TD>
                        <MenuImage src={p.image} alt={p.name} size={40} />
                      </TD>
                      <TD>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {p.name}
                        </div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {p.sku}
                        </div>
                      </TD>
                      <TD className="hidden text-slate-500 dark:text-slate-400 md:table-cell">
                        {categoryName(p.categoryId)}
                      </TD>
                      <TD className="hidden text-right font-mono sm:table-cell">
                        {formatTHB(p.cost)}
                      </TD>
                      <TD className="text-right font-mono font-medium">{formatTHB(p.basePrice)}</TD>
                      <TD className="text-right">
                        <Badge tone={marginTone(margin)} className="font-mono">
                          {margin}%
                        </Badge>
                      </TD>
                      <TD className="hidden lg:table-cell">
                        {optionCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                            {optionCount} ตัวเลือก
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </TD>
                      <TD className="hidden lg:table-cell">
                        {recipeCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                            <FlaskConical className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-mono">{recipeCount}</span> วัตถุดิบ
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
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

      <MenuFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        product={editing}
        categories={categories}
        ingredients={ingredients}
        salesChannels={salesChannels}
      />

      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="ยืนยันการลบเมนู"
        description={
          deleting
            ? `ต้องการนำ "${deleting.name}" ออกจากเมนูใช่หรือไม่ เมนูจะถูกซ่อน แต่ประวัติการขายยังคงอยู่`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              ยกเลิก
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> ลบเมนู
            </Button>
          </>
        }
      />
    </div>
  );
}
