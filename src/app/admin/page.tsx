"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  PackageSearch,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Badge,
  buttonVariants,
  EmptyState,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import {
  financeSummary,
  salesByDay,
  lowStockProducts,
  expiringIngredients,
  daysToExpiry,
  rangeForPreset,
  type RangePreset,
} from "@/lib/selectors";
import { expiryCountdownLabel } from "@/components/admin/ingredients";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS } from "@/lib/constants";
import { formatTHB, formatNumber, formatDateTime } from "@/lib/utils";
import {
  RangeTabs,
  rangeLabel,
  ChartCard,
  CHART_COLORS,
  CurrencyTooltip,
  compactNumber,
} from "@/components/admin/finance";

export default function AdminOverviewPage() {
  const orders = useStore((s) => s.orders);
  const expenses = useStore((s) => s.expenses);
  const purchases = useStore((s) => s.purchases);
  const products = useStore((s) => s.products);
  const ingredients = useStore((s) => s.ingredients);
  const settings = useStore((s) => s.settings);

  const [preset, setPreset] = useState<RangePreset>("30d");
  const range = useMemo(() => rangeForPreset(preset), [preset]);

  const summary = useMemo(
    () => financeSummary(orders, expenses, purchases, settings, range),
    [orders, expenses, purchases, settings, range],
  );

  // Revenue + profit trend is always shown over the last 30 days for context.
  const series = useMemo(() => salesByDay(orders, rangeForPreset("30d")), [orders]);

  const lowStock = useMemo(() => lowStockProducts(products), [products]);

  const expiringSoon = useMemo(() => expiringIngredients(ingredients, 7), [ingredients]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [orders],
  );

  const marginPct = summary.revenue
    ? Math.round((summary.netProfit / summary.revenue) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="ภาพรวมร้าน"
        description={`สรุปผลการดำเนินงาน ${rangeLabel(preset)}`}
        actions={<RangeTabs value={preset} onChange={setPreset} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="รายได้"
          value={formatTHB(summary.revenue)}
          icon={Wallet}
          tone="success"
          hint={rangeLabel(preset)}
        />
        <StatCard
          label="กำไรสุทธิ"
          value={formatTHB(summary.netProfit)}
          icon={TrendingUp}
          tone={summary.netProfit >= 0 ? "success" : "danger"}
          hint={`มาร์จิน ${marginPct}%`}
        />
        <StatCard
          label="ออเดอร์"
          value={formatNumber(summary.orderCount)}
          icon={ShoppingCart}
          tone="primary"
          hint="ที่ชำระแล้ว"
        />
        <StatCard
          label="เฉลี่ย / บิล"
          value={formatTHB(summary.avgOrder)}
          icon={Receipt}
          tone="info"
        />
        <StatCard
          label="เงินสดคงเหลือ"
          value={formatTHB(summary.cashBalance)}
          icon={Banknote}
          tone={summary.cashBalance >= 0 ? "neutral" : "danger"}
          hint="ยอดสะสมทั้งหมด"
        />
        <StatCard
          label="สินค้าใกล้หมด"
          value={formatNumber(lowStock.length)}
          icon={AlertTriangle}
          tone={lowStock.length > 0 ? "warning" : "neutral"}
          hint="ต่ำกว่าจุดสั่งซื้อ"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="รายได้ และ กำไร"
          description="แนวโน้มรายวัน 30 วันล่าสุด"
          className="xl:col-span-2"
          action={
            <Link href="/admin/finance" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              การเงิน
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ovRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ovProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.profit} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS.profit} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.18} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={compactNumber}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="รายได้"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2}
                  fill="url(#ovRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="กำไร"
                  stroke={CHART_COLORS.profit}
                  strokeWidth={2}
                  fill="url(#ovProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>สินค้าใกล้หมด</CardTitle>
              <CardDescription className="mt-1">ควรเติมสต็อกโดยด่วน</CardDescription>
            </div>
            <Link href="/admin/products" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              ทั้งหมด
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {lowStock.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="สต็อกเพียงพอ"
                description="ยังไม่มีสินค้าที่ต่ำกว่าจุดสั่งซื้อ"
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {lowStock.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="glass-subtle flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {p.name}
                      </p>
                      <p className="font-mono text-xs text-slate-400">{p.sku}</p>
                    </div>
                    <Badge tone={p.stock === 0 ? "danger" : "warning"}>
                      <span className="font-mono">{p.stock}</span> ชิ้น
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-amber-500" /> วัตถุดิบใกล้หมดอายุ
              </CardTitle>
              <CardDescription className="mt-1">ภายใน 7 วัน — ใช้ก่อนหรือสั่งล็อตใหม่</CardDescription>
            </div>
            <Link href="/admin/stock" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              จัดการวัตถุดิบ
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {expiringSoon.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="ยังไม่มีวัตถุดิบใกล้หมดอายุ"
                description="ทุกวัตถุดิบยังอยู่ในช่วงใช้งานได้"
              />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {expiringSoon.slice(0, 6).map((ing) => {
                  const days = daysToExpiry(ing.expiryDate);
                  return (
                    <li
                      key={ing.id}
                      className="glass-subtle flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {ing.name}
                        </p>
                        <p className="font-mono text-xs text-slate-400">{formatDate(ing.expiryDate)}</p>
                      </div>
                      <Badge tone={days < 0 ? "danger" : "warning"}>
                        {expiryCountdownLabel(days)}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card strong>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>ออเดอร์ล่าสุด</CardTitle>
              <CardDescription className="mt-1">5 รายการล่าสุด</CardDescription>
            </div>
            <Link href="/pos/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              ดูทั้งหมด
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="ยังไม่มีออเดอร์" />
            ) : (
              <ul className="flex flex-col divide-y divide-slate-200/60 dark:divide-white/10">
                {recentOrders.map((o) => {
                  const st = ORDER_STATUS[o.status];
                  return (
                    <li
                      key={o.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-medium text-slate-800 dark:text-slate-100">
                          {o.code}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {o.customerName} · {formatDateTime(o.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge tone={st.tone}>{st.label}</Badge>
                        <span className="w-24 text-right font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {formatTHB(o.total)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
