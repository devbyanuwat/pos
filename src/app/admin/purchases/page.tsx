"use client";

import { useMemo, useState } from "react";
import { Truck, Plus, PackagePlus } from "lucide-react";
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
  EmptyState,
  toast,
} from "@/components/ui";
import { ReceiveIngredientsDialog } from "@/components/admin/ingredients";
import { useStore } from "@/lib/store";
import type { ReceiveIngredientsInput } from "@/lib/store";
import { formatTHB, formatDate, formatNumber } from "@/lib/utils";

export default function PurchasesPage() {
  const purchases = useStore((s) => s.purchases);
  const ingredients = useStore((s) => s.ingredients);
  const receiveIngredients = useStore((s) => s.receiveIngredients);

  const [open, setOpen] = useState(false);

  // Resolve a unit label for a purchase line (seeded rows store the ingredient id
  // in `productId`; newer arrivals not recorded as purchases, so fall back gracefully).
  const unitFor = useMemo(() => {
    const byId = new Map(ingredients.map((i) => [i.id, i.unit]));
    return (id: string) => byId.get(id);
  }, [ingredients]);

  const sorted = useMemo(
    () =>
      purchases
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [purchases],
  );

  function handleSubmit(input: ReceiveIngredientsInput) {
    const count = input.items.length;
    receiveIngredients(input);
    toast.success(`รับวัตถุดิบเข้าแล้ว ${count} รายการ — เพิ่มสต๊อกและอัปเดตวันหมดอายุ`);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="รับวัตถุดิบเข้า"
        description="บันทึกการรับวัตถุดิบจากซัพพลายเออร์ ระบบจะเพิ่มสต๊อกและอัปเดตวันหมดอายุให้อัตโนมัติ"
        actions={
          <Button onClick={() => setOpen(true)} disabled={ingredients.length === 0}>
            <Plus className="h-4 w-4" /> รับวัตถุดิบเข้า
          </Button>
        }
      />

      <Card strong>
        <CardContent className="p-0 sm:p-0">
          {sorted.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="ยังไม่มีประวัติการรับวัตถุดิบ"
              description="เริ่มบันทึกการรับวัตถุดิบเข้าจากซัพพลายเออร์"
              action={
                <Button onClick={() => setOpen(true)} disabled={ingredients.length === 0}>
                  <Plus className="h-4 w-4" /> รับวัตถุดิบเข้า
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>เลขที่</TH>
                  <TH>ผู้ขาย</TH>
                  <TH>รายการ</TH>
                  <TH className="text-right">ยอดรวม</TH>
                  <TH className="text-right">วันที่</TH>
                </TR>
              </THead>
              <TBody>
                {sorted.map((po) => (
                  <TR key={po.id} className="align-top transition-colors hover:bg-slate-500/5">
                    <TD className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                      {po.code}
                    </TD>
                    <TD className="text-slate-700 dark:text-slate-200">
                      {po.supplier || "ไม่ระบุผู้ขาย"}
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1.5">
                        {po.items.map((it, idx) => {
                          const unit = unitFor(it.productId);
                          return (
                            <Badge key={`${it.productId}-${idx}`} tone="neutral">
                              {it.name}
                              <span className="ml-1 font-mono">
                                +{formatNumber(it.qty)}
                                {unit ? ` ${unit}` : ""}
                              </span>
                            </Badge>
                          );
                        })}
                      </div>
                    </TD>
                    <TD className="text-right font-mono font-medium">{formatTHB(po.total)}</TD>
                    <TD className="text-right text-slate-500 dark:text-slate-400">
                      {formatDate(po.createdAt)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {ingredients.length === 0 && (
        <Card className="mt-4">
          <CardContent>
            <EmptyState
              icon={PackagePlus}
              title="ยังไม่มีวัตถุดิบให้รับเข้า"
              description="เพิ่มวัตถุดิบในหน้า วัตถุดิบ ก่อนจึงจะบันทึกการรับเข้าได้"
            />
          </CardContent>
        </Card>
      )}

      <ReceiveIngredientsDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        ingredients={ingredients}
      />
    </div>
  );
}
