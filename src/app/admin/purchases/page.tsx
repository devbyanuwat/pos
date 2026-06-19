"use client";

import { useMemo, useState } from "react";
import { Truck, Plus } from "lucide-react";
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
  EmptyState,
  toast,
} from "@/components/ui";
import { PurchaseDialog } from "@/components/admin/catalog";
import { useStore } from "@/lib/store";
import type { CreatePurchaseInput } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { formatTHB, formatDate } from "@/lib/utils";

export default function PurchasesPage() {
  const purchases = useStore((s) => s.purchases);
  const products = useStore((s) => s.products);
  const createPurchase = useStore((s) => s.createPurchase);
  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  const sellable = useMemo(() => products.filter((p) => p.active), [products]);
  const sorted = useMemo(
    () =>
      purchases
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [purchases],
  );

  function handleSubmit(input: Omit<CreatePurchaseInput, "createdBy">) {
    const po = createPurchase({ ...input, createdBy: user?.id });
    toast.success(`รับสินค้าเข้าแล้ว ${po.code} เพิ่มสต๊อกและบันทึกเงินสดจ่ายออก`);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="รับสินค้าเข้า"
        description="บันทึกการรับสินค้าจากซัพพลายเออร์ ระบบจะเพิ่มสต๊อกและบันทึกเป็นเงินสดจ่ายออกอัตโนมัติ"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> รับสินค้าเข้า
          </Button>
        }
      />

      <Card strong>
        <CardContent className="p-0 sm:p-0">
          {sorted.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="ยังไม่มีประวัติการรับสินค้า"
              description="เริ่มบันทึกการรับสินค้าเข้าจากซัพพลายเออร์"
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" /> รับสินค้าเข้า
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>เลขที่</TH>
                  <TH>ผู้ขาย</TH>
                  <TH className="text-right">จำนวนรายการ</TH>
                  <TH className="text-right">ยอดรวม</TH>
                  <TH className="text-right">วันที่</TH>
                </TR>
              </THead>
              <TBody>
                {sorted.map((po) => (
                  <TR key={po.id} className="transition-colors hover:bg-slate-500/5">
                    <TD className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                      {po.code}
                    </TD>
                    <TD className="text-slate-700 dark:text-slate-200">
                      {po.supplier || "ไม่ระบุผู้ขาย"}
                    </TD>
                    <TD className="text-right font-mono">{po.items.length}</TD>
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

      <PurchaseDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        products={sellable}
      />
    </div>
  );
}
