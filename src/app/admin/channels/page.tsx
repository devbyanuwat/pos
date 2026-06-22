"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Store, Percent, Signal, Search } from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Switch,
  EmptyState,
  StatCard,
  toast,
} from "@/components/ui";
import { ChannelFormDialog } from "@/components/admin/channels/channel-form-dialog";
import { useStore } from "@/lib/store";
import type { NewSalesChannel } from "@/lib/store";
import type { SalesChannel } from "@/lib/types";
import { getPriceForChannel, commissionFor } from "@/lib/selectors";
import { cn, formatTHB } from "@/lib/utils";

/** Map a color token name to a Badge tone. Best-effort; falls back to neutral. */
function colorToTone(
  color: string,
): "success" | "info" | "warning" | "primary" | "neutral" | "danger" {
  const map: Record<string, "success" | "info" | "warning" | "primary" | "neutral" | "danger"> = {
    emerald: "success",
    teal: "success",
    sky: "info",
    amber: "warning",
    pink: "danger",
    violet: "primary",
    rose: "danger",
    slate: "neutral",
  };
  return map[color] ?? "neutral";
}

export default function ChannelsPage() {
  const salesChannels = useStore((s) => s.salesChannels);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const addSalesChannel = useStore((s) => s.addSalesChannel);
  const updateSalesChannel = useStore((s) => s.updateSalesChannel);
  const toggleSalesChannel = useStore((s) => s.toggleSalesChannel);
  const setProductChannelPrice = useStore((s) => s.setProductChannelPrice);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SalesChannel | null>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: SalesChannel) {
    setEditing(c);
    setFormOpen(true);
  }

  function handleSubmit(data: NewSalesChannel) {
    if (editing) {
      updateSalesChannel(editing.id, data);
      toast.success("บันทึกการแก้ไขแพลตฟอร์มแล้ว");
    } else {
      addSalesChannel(data);
      toast.success("เพิ่มแพลตฟอร์มใหม่แล้ว");
    }
    setFormOpen(false);
    setEditing(null);
  }

  // ---------- Section A stats ----------
  const stats = useMemo(() => {
    const active = salesChannels.filter((c) => c.active);
    const avgGP =
      active.length > 0
        ? Math.round(active.reduce((a, c) => a + c.commission, 0) / active.length)
        : 0;
    return { activeCount: active.length, total: salesChannels.length, avgGP };
  }, [salesChannels]);

  // ---------- Section B: active channels + filtered products ----------
  const activeChannels = useMemo(
    () => salesChannels.filter((c) => c.active),
    [salesChannels],
  );

  const activeProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.active)
      .filter((p) => (categoryFilter === "all" ? true : p.categoryId === categoryFilter))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [products, query, categoryFilter]);

  return (
    <div>
      <PageHeader
        title="ช่องทาง & ราคา"
        description="จัดการแพลตฟอร์มเดลิเวอรีและกำหนดราคาขายแยกต่อช่องทาง"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> เพิ่มแพลตฟอร์ม
          </Button>
        }
      />

      {/* ---- Section A: Platform management ---- */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="แพลตฟอร์มที่เปิดใช้"
          value={stats.activeCount}
          icon={Store}
          tone="primary"
        />
        <StatCard
          label="แพลตฟอร์มทั้งหมด"
          value={stats.total}
          icon={Signal}
          tone="info"
        />
        <StatCard
          label="GP เฉลี่ย"
          value={`${stats.avgGP}%`}
          icon={Percent}
          tone="warning"
          hint="เฉพาะที่เปิดใช้งาน"
        />
      </div>

      <Card strong className="mb-6">
        <CardHeader>
          <CardTitle>แพลตฟอร์มเดลิเวอรี</CardTitle>
          <CardDescription>
            แพลตฟอร์มที่ร้านเชื่อมอยู่ — GP คือเปอร์เซ็นต์ที่แพลตฟอร์มหักจากยอดขาย
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {salesChannels.length === 0 ? (
            <EmptyState
              icon={Store}
              title="ยังไม่มีแพลตฟอร์ม"
              description="เพิ่มช่องทางเดลิเวอรีรายการแรก"
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> เพิ่มแพลตฟอร์ม
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>แพลตฟอร์ม</TH>
                  <TH className="text-right">GP %</TH>
                  <TH className="text-center">เปิดใช้</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {salesChannels.map((c) => (
                  <TR
                    key={c.id}
                    className={cn(
                      "transition-colors hover:bg-slate-500/5",
                      !c.active && "opacity-50",
                    )}
                  >
                    <TD>
                      <div className="flex items-center gap-2">
                        <Badge tone={colorToTone(c.color)} dot={false}>
                          {c.name}
                        </Badge>
                      </div>
                    </TD>
                    <TD className="text-right">
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {c.commission}%
                      </span>
                    </TD>
                    <TD>
                      <div className="flex justify-center">
                        <Switch
                          checked={c.active}
                          onChange={() => toggleSalesChannel(c.id)}
                        />
                      </div>
                    </TD>
                    <TD className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" /> แก้ไข
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ---- Section B: Price matrix ---- */}
      <Card strong>
        <CardHeader>
          <CardTitle>ตารางราคาต่อช่องทาง</CardTitle>
          <CardDescription>
            ตั้งราคาแยกต่อแพลตฟอร์ม — ถ้าไม่ตั้งจะใช้ราคาหน้าร้านเป็นค่าเริ่มต้น
          </CardDescription>
        </CardHeader>

        {activeChannels.length === 0 ? (
          <CardContent>
            <EmptyState
              icon={Store}
              title="ยังไม่มีแพลตฟอร์มที่เปิดใช้"
              description="เปิดใช้งานแพลตฟอร์มด้านบนก่อนเพื่อตั้งราคาต่อช่องทาง"
            />
          </CardContent>
        ) : (
          <>
            <CardContent className="pb-3 pt-0 sm:pb-3 sm:pt-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ค้นหาชื่อเมนู หรือ SKU"
                    className="pl-10"
                  />
                </div>
                <div className="sm:w-52">
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">ทุกหมวดหมู่</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>

            <CardContent className="p-0 sm:p-0">
              {activeProducts.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="ไม่พบเมนู"
                  description="ลองปรับคำค้นหาหรือเปลี่ยนหมวดหมู่"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR>
                        <TH className="min-w-[160px]">เมนู</TH>
                        <TH className="min-w-[110px] text-right">ราคาหน้าร้าน</TH>
                        {activeChannels.map((ch) => (
                          <TH key={ch.id} className="min-w-[140px] text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <Badge tone={colorToTone(ch.color)} dot={false}>
                                {ch.name}
                              </Badge>
                              <span className="font-normal text-slate-400">GP {ch.commission}%</span>
                            </div>
                          </TH>
                        ))}
                      </TR>
                    </THead>
                    <TBody>
                      {activeProducts.map((p) => (
                        <TR
                          key={p.id}
                          className="transition-colors hover:bg-slate-500/5"
                        >
                          <TD>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {p.name}
                            </div>
                            <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              {p.sku}
                            </div>
                          </TD>
                          <TD className="text-right font-mono text-slate-500 dark:text-slate-400">
                            {formatTHB(p.basePrice)}
                          </TD>
                          {activeChannels.map((ch) => {
                            const currentOverride = p.channelPrices?.[ch.id];
                            const displayPrice = getPriceForChannel(p, ch.id);
                            const net = displayPrice - commissionFor(displayPrice, ch);
                            return (
                              <TD key={ch.id} className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    className="h-9 w-28 text-center font-mono text-sm"
                                    defaultValue={currentOverride ?? ""}
                                    placeholder={String(p.basePrice)}
                                    onBlur={(e) => {
                                      const raw = e.target.value.trim();
                                      if (raw === "") {
                                        setProductChannelPrice(p.id, ch.id, null);
                                      } else {
                                        const val = Number(raw);
                                        if (!isNaN(val) && val >= 0) {
                                          setProductChannelPrice(p.id, ch.id, val);
                                        }
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    สุทธิ {formatTHB(net)}
                                  </span>
                                </div>
                              </TD>
                            );
                          })}
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>

      <ChannelFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        channel={editing}
      />
    </div>
  );
}
