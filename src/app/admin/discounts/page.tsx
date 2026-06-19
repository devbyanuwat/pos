"use client";

import { useState } from "react";
import { Pencil, Plus, Tag } from "lucide-react";
import { useStore } from "@/lib/store";
import type { NewDiscount } from "@/lib/store";
import type { Discount } from "@/lib/types";
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Switch,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
  toast,
} from "@/components/ui";
import { formatTHB } from "@/lib/utils";
import { DiscountFormDialog } from "@/components/admin/people/discount-form-dialog";

export default function DiscountsPage() {
  const discounts = useStore((s) => s.discounts);
  const tiers = useStore((s) => s.tiers);
  const addDiscount = useStore((s) => s.addDiscount);
  const updateDiscount = useStore((s) => s.updateDiscount);
  const toggleDiscount = useStore((s) => s.toggleDiscount);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);

  const tierName = (tierId?: string) =>
    tiers.find((t) => t.id === tierId)?.name ?? tierId ?? "-";

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(d: Discount) {
    setEditing(d);
    setDialogOpen(true);
  }

  function handleSubmit(data: NewDiscount) {
    if (editing) {
      updateDiscount(editing.id, data);
      toast.success("บันทึกการแก้ไขส่วนลดแล้ว");
    } else {
      addDiscount(data);
      toast.success("เพิ่มส่วนลดแล้ว");
    }
    setDialogOpen(false);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="ส่วนลด"
        description="ส่วนลดท้ายบิลที่ระบบเลือกใช้อัตโนมัติให้ได้ส่วนลดสูงสุด"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            เพิ่มส่วนลด
          </Button>
        }
      />

      <Card strong>
        <CardContent className="p-0 sm:p-0">
          {discounts.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="ยังไม่มีส่วนลด"
              description="เพิ่มกฎส่วนลดท้ายบิลรายการแรก"
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  เพิ่มส่วนลด
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>ชื่อ</TH>
                  <TH>ประเภท</TH>
                  <TH className="text-right">ค่า</TH>
                  <TH>ขอบเขต</TH>
                  <TH className="text-right">ขั้นต่ำ</TH>
                  <TH className="text-center">เปิดใช้</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {discounts.map((d) => (
                  <TR key={d.id}>
                    <TD>
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        {d.name}
                      </span>
                    </TD>
                    <TD>
                      <Badge tone={d.type === "percent" ? "info" : "primary"}>
                        {d.type === "percent" ? "เปอร์เซ็นต์" : "จำนวนเงิน"}
                      </Badge>
                    </TD>
                    <TD className="text-right font-mono font-medium text-slate-900 dark:text-slate-50">
                      {d.type === "percent" ? `${d.value}%` : formatTHB(d.value)}
                    </TD>
                    <TD className="text-slate-600 dark:text-slate-300">
                      {d.scope === "all" ? "ทุกบิล" : `ระดับ ${tierName(d.tierId)}`}
                    </TD>
                    <TD className="text-right font-mono text-slate-500 dark:text-slate-400">
                      {d.minSubtotal ? formatTHB(d.minSubtotal) : "-"}
                    </TD>
                    <TD>
                      <div className="flex justify-center">
                        <Switch checked={d.active} onChange={() => toggleDiscount(d.id)} />
                      </div>
                    </TD>
                    <TD className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                        แก้ไข
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DiscountFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        discount={editing}
        tiers={tiers}
      />
    </div>
  );
}
