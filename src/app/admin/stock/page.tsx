"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  CalendarClock,
  AlertTriangle,
  Minus,
  Plus,
  Search,
  Pencil,
  Trash2,
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
import {
  IngredientFormDialog,
  AffectedMenuChips,
  expiryStatus,
  expiryCountdownLabel,
} from "@/components/admin/ingredients";
import { useStore } from "@/lib/store";
import { expiringIngredients } from "@/lib/selectors";
import type { Ingredient } from "@/lib/types";
import type { NewIngredient } from "@/lib/store";
import { formatTHB, formatDate, formatNumber, cn } from "@/lib/utils";

export default function StockPage() {
  const ingredients = useStore((s) => s.ingredients);
  const products = useStore((s) => s.products);
  const addIngredient = useStore((s) => s.addIngredient);
  const updateIngredient = useStore((s) => s.updateIngredient);
  const adjustIngredient = useStore((s) => s.adjustIngredient);
  const removeIngredient = useStore((s) => s.removeIngredient);

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);

  const expiringSoon = useMemo(() => expiringIngredients(ingredients, 7), [ingredients]);
  const lowStock = useMemo(
    () => ingredients.filter((i) => i.stock <= i.lowThreshold),
    [ingredients],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ingredients
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.unit.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => {
        // Soonest-to-expire first, then by remaining stock ascending.
        const ax = new Date(a.expiryDate).getTime();
        const bx = new Date(b.expiryDate).getTime();
        return ax - bx || a.stock - b.stock;
      });
  }, [ingredients, query]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(ing: Ingredient) {
    setEditing(ing);
    setDialogOpen(true);
  }

  function handleSubmit(input: NewIngredient) {
    if (editing) {
      updateIngredient(editing.id, input);
      toast.success(`บันทึกการแก้ไข "${input.name}" แล้ว`);
    } else {
      addIngredient(input);
      toast.success(`เพิ่มวัตถุดิบ "${input.name}" แล้ว`);
    }
    setDialogOpen(false);
    setEditing(null);
  }

  function quickAdjust(ing: Ingredient, delta: number) {
    if (delta < 0 && ing.stock <= 0) return;
    adjustIngredient(ing.id, delta);
  }

  function handleRemove(ing: Ingredient) {
    if (typeof window !== "undefined" && !window.confirm(`ลบวัตถุดิบ "${ing.name}" ?`)) return;
    removeIngredient(ing.id);
    toast.success(`ลบวัตถุดิบ "${ing.name}" แล้ว`);
  }

  // Step size scales with the quantity so big lots adjust sensibly.
  function stepFor(ing: Ingredient): number {
    if (ing.stock >= 1000) return 100;
    if (ing.stock >= 100) return 10;
    return 1;
  }

  return (
    <div>
      <PageHeader
        title="วัตถุดิบ"
        description="ติดตามยอดคงเหลือ วันหมดอายุ และวัตถุดิบที่ใกล้หมด"
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบ
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="วัตถุดิบทั้งหมด"
          value={formatNumber(ingredients.length)}
          icon={Boxes}
          tone="primary"
          hint="รายการที่ติดตาม"
        />
        <StatCard
          label="ใกล้หมดอายุ"
          value={formatNumber(expiringSoon.length)}
          icon={CalendarClock}
          tone={expiringSoon.length > 0 ? "warning" : "neutral"}
          hint="ภายใน 7 วัน (รวมหมดอายุแล้ว)"
        />
        <StatCard
          label="ใกล้หมดสต๊อก"
          value={formatNumber(lowStock.length)}
          icon={AlertTriangle}
          tone={lowStock.length > 0 ? "danger" : "neutral"}
          hint="ต่ำกว่าจุดสั่งซื้อ"
        />
      </div>

      {expiringSoon.length > 0 && (
        <Card className="mb-6 border border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <CalendarClock className="h-5 w-5" /> วัตถุดิบใกล้หมดอายุ
            </CardTitle>
            <CardDescription>
              ใช้ก่อนหมดอายุหรือสั่งล็อตใหม่ เมนูที่เกี่ยวข้องอาจได้รับผลกระทบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2.5">
              {expiringSoon.map((ing) => {
                const st = expiryStatus(ing);
                return (
                  <li
                    key={ing.id}
                    className="flex flex-col gap-2 rounded-xl bg-amber-500/10 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {ing.name}
                        </span>
                        <Badge tone={st.tone}>{expiryCountdownLabel(st.days)}</Badge>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          หมดอายุ {formatDate(ing.expiryDate)}
                        </span>
                      </div>
                      <AffectedMenuChips products={products} ingredientId={ing.id} />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatNumber(ing.stock)} {ing.unit}
                      </p>
                      <p className="text-[11px] text-slate-400">คงเหลือ</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 sm:max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อวัตถุดิบ หรือหน่วย"
            className="pl-10"
          />
        </div>
      </div>

      <Card strong>
        <CardContent className="p-0 sm:p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title={ingredients.length === 0 ? "ยังไม่มีวัตถุดิบ" : "ไม่พบวัตถุดิบ"}
              description={
                ingredients.length === 0 ? "เริ่มเพิ่มวัตถุดิบรายการแรก" : "ลองปรับคำค้นหา"
              }
              action={
                ingredients.length === 0 ? (
                  <Button onClick={openAdd}>
                    <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบ
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>วัตถุดิบ</TH>
                  <TH className="text-right">คงเหลือ</TH>
                  <TH className="text-right">จุดสั่งซื้อ</TH>
                  <TH className="text-right">วันหมดอายุ</TH>
                  <TH>สถานะ</TH>
                  <TH className="text-right">ปรับสต๊อก</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((ing) => {
                  const st = expiryStatus(ing);
                  const isLow = ing.stock <= ing.lowThreshold;
                  const step = stepFor(ing);
                  return (
                    <TR key={ing.id} className="transition-colors hover:bg-slate-500/5">
                      <TD>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{ing.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          หน่วย: {ing.unit} · ต้นทุน {formatTHB(ing.cost, 2)}/{ing.unit}
                        </p>
                      </TD>
                      <TD
                        className={cn(
                          "text-right font-mono font-semibold",
                          ing.stock <= 0
                            ? "text-red-500"
                            : isLow
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-900 dark:text-slate-100",
                        )}
                      >
                        {formatNumber(ing.stock)}
                      </TD>
                      <TD className="text-right font-mono text-slate-500 dark:text-slate-400">
                        {formatNumber(ing.lowThreshold)}
                      </TD>
                      <TD className="text-right font-mono text-slate-600 dark:text-slate-300">
                        <span className="block">{formatDate(ing.expiryDate)}</span>
                        <span
                          className={cn(
                            "text-[11px]",
                            st.days < 0
                              ? "text-red-500"
                              : st.days <= 7
                                ? "text-amber-500"
                                : "text-slate-400",
                          )}
                        >
                          {expiryCountdownLabel(st.days)}
                        </span>
                      </TD>
                      <TD>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={st.tone}>{st.label}</Badge>
                          {isLow && <Badge tone="warning">สต๊อกต่ำ</Badge>}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => quickAdjust(ing, -step)}
                            disabled={ing.stock <= 0}
                            aria-label={`ลดสต๊อก ${ing.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-mono text-xs text-slate-400">
                            {step}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => quickAdjust(ing, step)}
                            aria-label={`เพิ่มสต๊อก ${ing.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(ing)}
                            aria-label={`แก้ไข ${ing.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemove(ing)}
                            aria-label={`ลบ ${ing.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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

      <IngredientFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        ingredient={editing}
      />
    </div>
  );
}
