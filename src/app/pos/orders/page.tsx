"use client";

import { useMemo, useState } from "react";
import { Search, Eye, ClipboardList, ImageIcon } from "lucide-react";
import {
  PageHeader,
  Card,
  CardContent,
  Input,
  Tabs,
  Badge,
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
import { useStore } from "@/lib/store";
import { ORDER_STATUS, NEXT_STATUS, CHANNEL_LABELS } from "@/lib/constants";
import { formatTHB, formatDateTime } from "@/lib/utils";
import { OrderDetailDialog } from "@/components/pos/order-detail-dialog";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_ORDER: OrderStatus[] = [
  "pending_payment",
  "paid",
  "packing",
  "completed",
  "cancelled",
];

export default function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const verifySlip = useStore((s) => s.verifySlip);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  const cancelOrder = useStore((s) => s.cancelOrder);

  const [tab, setTab] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [orders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted
      .filter((o) => (tab === "all" ? true : o.status === tab))
      .filter((o) =>
        q === ""
          ? true
          : o.code.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q),
      );
  }, [sorted, tab, query]);

  const tabs = useMemo(
    () => [
      { value: "all", label: `ทั้งหมด (${orders.length})` },
      ...STATUS_ORDER.map((s) => ({
        value: s,
        label: `${ORDER_STATUS[s].label} (${orders.filter((o) => o.status === s).length})`,
      })),
    ],
    [orders],
  );

  const openOrder = sorted.find((o) => o.id === openId) ?? null;

  function handleVerify(id: string) {
    verifySlip(id);
    toast.success("ยืนยันสลิปเรียบร้อย");
  }

  function handleAdvance(id: string, next: OrderStatus) {
    updateOrderStatus(id, next);
    toast.success(`อัปเดตเป็น ${ORDER_STATUS[next].label}`);
  }

  function handleCancel(id: string) {
    cancelOrder(id);
    toast.info("ยกเลิกบิลและคืนสต็อกแล้ว");
  }

  return (
    <div>
      <PageHeader
        title="คำสั่งซื้อ"
        description="ตรวจสอบสลิป ยืนยันการชำระเงิน และดำเนินการบิลต่อไปยังการแพ็ก"
      />

      <Card strong>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="overflow-x-auto pb-1">
              <Tabs tabs={tabs} value={tab} onChange={setTab} />
            </div>
            <div className="relative lg:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหารหัสบิล / ชื่อลูกค้า"
                className="pl-10"
                aria-label="ค้นหาคำสั่งซื้อ"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="ไม่พบคำสั่งซื้อ"
              description="ยังไม่มีบิลที่ตรงกับเงื่อนไขนี้"
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>รหัสบิล</TH>
                  <TH>เวลา</TH>
                  <TH>ลูกค้า</TH>
                  <TH>ช่องทาง</TH>
                  <TH className="text-right">ยอด</TH>
                  <TH>สถานะ</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((o) => (
                  <OrderRow key={o.id} order={o} onView={() => setOpenId(o.id)} />
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={openOrder}
        onClose={() => setOpenId(null)}
        onVerifySlip={handleVerify}
        onAdvance={handleAdvance}
        onCancel={handleCancel}
      />
    </div>
  );
}

function OrderRow({ order, onView }: { order: Order; onView: () => void }) {
  const status = ORDER_STATUS[order.status];
  const needsSlip =
    order.channel === "online" && !!order.paymentSlip && !order.slipVerified;
  const hasNext = !!NEXT_STATUS[order.status];

  return (
    <TR className="transition-colors hover:bg-slate-500/5">
      <TD className="font-mono font-medium text-slate-900 dark:text-slate-50">{order.code}</TD>
      <TD className="whitespace-nowrap text-slate-500 dark:text-slate-400">
        {formatDateTime(order.createdAt)}
      </TD>
      <TD>{order.customerName}</TD>
      <TD>
        <Badge tone={order.channel === "online" ? "info" : "neutral"}>
          {CHANNEL_LABELS[order.channel]}
        </Badge>
      </TD>
      <TD className="text-right font-mono font-medium">{formatTHB(order.total)}</TD>
      <TD>
        <span className="flex items-center gap-1.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          {needsSlip && (
            <span title="มีสลิปรอตรวจสอบ" className="text-amber-500">
              <ImageIcon className="h-3.5 w-3.5" />
            </span>
          )}
        </span>
      </TD>
      <TD className="text-right">
        <Button
          variant={needsSlip || hasNext ? "primary" : "outline"}
          size="sm"
          onClick={onView}
        >
          <Eye className="h-4 w-4" />
          ดู
        </Button>
      </TD>
    </TR>
  );
}
