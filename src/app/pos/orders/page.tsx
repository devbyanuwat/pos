"use client";

import { useMemo, useState } from "react";
import { Search, ClipboardList } from "lucide-react";
import {
  PageHeader,
  Card,
  CardContent,
  Input,
  Select,
  Tabs,
  EmptyState,
  toast,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { ORDER_STATUS, CHANNEL_LABELS } from "@/lib/constants";
import { OrderTable } from "@/components/pos/board/order-table";
import { OrderDetailSheet } from "@/components/pos/board/order-detail-sheet";
import type { OrderStatus, OrderChannel } from "@/lib/types";

const STATUS_ORDER: OrderStatus[] = [
  "pending_payment",
  "paid",
  "packing",
  "completed",
  "cancelled",
];

const CHANNELS: OrderChannel[] = ["online", "pos", "qr"];

export default function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const tables = useStore((s) => s.tables);
  const verifySlip = useStore((s) => s.verifySlip);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  const cancelOrder = useStore((s) => s.cancelOrder);

  const [tab, setTab] = useState<string>("all");
  const [channel, setChannel] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const tableNames = useMemo(
    () => Object.fromEntries(tables.map((t) => [t.id, t.name])),
    [tables],
  );

  // Newest first.
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
      .filter((o) => (channel === "all" ? true : o.channel === channel))
      .filter((o) =>
        q === ""
          ? true
          : o.code.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q),
      );
  }, [sorted, tab, channel, query]);

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
    toast.success("ยืนยันสลิปและรับชำระเรียบร้อย");
  }

  function handleCounterPayment(id: string) {
    updateOrderStatus(id, "paid");
    toast.success("รับชำระที่เคาน์เตอร์แล้ว");
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
        title="ออเดอร์"
        description="ติดตามทุกบิล ตรวจสลิป รับชำระที่เคาน์เตอร์ และส่งเข้าคิวชง"
      />

      <Card strong>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <Tabs tabs={tabs} value={tab} onChange={setTab} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                aria-label="กรองตามช่องทาง"
                className="sm:w-40"
              >
                <option value="all">ทุกช่องทาง</option>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </option>
                ))}
              </Select>
              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหารหัสบิล / ชื่อลูกค้า"
                  className="pl-10"
                  aria-label="ค้นหาออเดอร์"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="ไม่พบออเดอร์"
              description="ยังไม่มีบิลที่ตรงกับเงื่อนไขนี้"
            />
          ) : (
            <OrderTable orders={filtered} tableNames={tableNames} onView={setOpenId} />
          )}
        </CardContent>
      </Card>

      <OrderDetailSheet
        order={openOrder}
        tableName={openOrder?.tableId ? tableNames[openOrder.tableId] : undefined}
        onClose={() => setOpenId(null)}
        onVerifySlip={handleVerify}
        onTakeCounterPayment={handleCounterPayment}
        onAdvance={handleAdvance}
        onCancel={handleCancel}
      />
    </div>
  );
}
