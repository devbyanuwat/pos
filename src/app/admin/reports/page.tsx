"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Trophy,
  TrendingDown,
  Package,
  Coins,
  BarChart3,
  Crown,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
  EmptyState,
} from "@/components/ui";
import { ProductImage } from "@/components/admin/catalog/product-image";
import { useStore } from "@/lib/store";
import {
  productSalesReport,
  salesByDay,
  rangeForPreset,
  type RangePreset,
} from "@/lib/selectors";
import { formatTHB, formatNumber } from "@/lib/utils";
import {
  RangeTabs,
  rangeLabel,
  ChartCard,
  CHART_COLORS,
  CurrencyTooltip,
  compactNumber,
} from "@/components/admin/finance";

export default function ReportsPage() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);

  const [preset, setPreset] = useState<RangePreset>("30d");
  const range = useMemo(() => rangeForPreset(preset), [preset]);

  const report = useMemo(
    () => productSalesReport(orders, products, range),
    [orders, products, range],
  );
  const series = useMemo(() => salesByDay(orders, range), [orders, range]);

  const top10 = useMemo(() => report.slice(0, 10), [report]);
  const worst = useMemo(
    () =>
      report
        .filter((r) => r.qtySold > 0)
        .slice(-5)
        .reverse(),
    [report],
  );

  const totals = useMemo(() => {
    const qty = report.reduce((a, r) => a + r.qtySold, 0);
    const revenue = report.reduce((a, r) => a + r.revenue, 0);
    const profit = report.reduce((a, r) => a + r.profit, 0);
    return { qty, revenue, profit, skuCount: report.length };
  }, [report]);

  // Horizontal bar data (recharts renders first item at bottom; reverse for top-down).
  const barData = useMemo(
    () =>
      [...top10]
        .reverse()
        .map((r) => ({ name: r.name, qtySold: r.qtySold, revenue: r.revenue })),
    [top10],
  );

  const best = report[0];

  return (
    <div>
      <PageHeader
        title="รายงานการขาย"
        description={`วิเคราะห์สินค้าขายดีและยอดขาย ${rangeLabel(preset)}`}
        actions={<RangeTabs value={preset} onChange={setPreset} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="จำนวนที่ขายได้"
          value={`${formatNumber(totals.qty)} ชิ้น`}
          icon={Package}
          tone="primary"
        />
        <StatCard
          label="รายได้รวม"
          value={formatTHB(totals.revenue)}
          icon={Coins}
          tone="success"
        />
        <StatCard
          label="กำไรรวม"
          value={formatTHB(totals.profit)}
          icon={TrendingDown}
          tone={totals.profit >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="สินค้าขายดีสุด"
          value={best ? `${formatNumber(best.qtySold)} ชิ้น` : "-"}
          icon={Crown}
          tone="warning"
          hint={best?.name ?? "ยังไม่มียอดขาย"}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="สินค้าขายดี 10 อันดับ"
          description={`เรียงตามจำนวนที่ขายได้ · ${rangeLabel(preset)}`}
          className="xl:col-span-2"
        >
          <div className="h-96 w-full">
            {barData.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="ยังไม่มียอดขาย"
                description={`ไม่มีข้อมูลการขายใน ${rangeLabel(preset)}`}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="#94a3b8"
                    strokeOpacity={0.18}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={compactNumber}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#94a3b8", fillOpacity: 0.08 }}
                    content={<CurrencyTooltip currencyKeys={["revenue"]} />}
                  />
                  <Bar dataKey="qtySold" name="ขายได้ (ชิ้น)" radius={[0, 6, 6, 0]}>
                    {barData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={i === barData.length - 1 ? CHART_COLORS.accent : CHART_COLORS.revenue}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>สินค้าขายช้า</CardTitle>
            <CardDescription className="mt-1">ขายได้น้อยสุด (ที่มียอดขาย)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {worst.length === 0 ? (
              <EmptyState icon={TrendingDown} title="ยังไม่มีข้อมูล" />
            ) : (
              <ul className="flex flex-col gap-2">
                {worst.map((r) => (
                  <li
                    key={r.productId}
                    className="glass-subtle flex items-center gap-3 rounded-xl p-2"
                  >
                    <ProductImage src={r.image} alt={r.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {r.name}
                      </p>
                      <p className="font-mono text-xs text-slate-400">{formatTHB(r.revenue)}</p>
                    </div>
                    <Badge tone="warning">
                      <span className="font-mono">{r.qtySold}</span> ชิ้น
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <ChartCard
          title="แนวโน้มรายได้"
          description={`ยอดขายรายวัน · ${rangeLabel(preset)}`}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="repRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="รายได้"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2}
                  fill="url(#repRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-4">
        <Card strong>
          <CardHeader>
            <CardTitle>ตารางสินค้าขายดี</CardTitle>
            <CardDescription>เรียงตามจำนวนที่ขายได้ · {rangeLabel(preset)}</CardDescription>
          </CardHeader>
          <CardContent>
            {report.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="ยังไม่มียอดขาย"
                description={`ไม่มีข้อมูลการขายใน ${rangeLabel(preset)}`}
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH className="w-10 text-center">#</TH>
                    <TH>สินค้า</TH>
                    <TH className="text-right">ขายได้</TH>
                    <TH className="text-right">รายได้</TH>
                    <TH className="text-right">กำไร</TH>
                  </TR>
                </THead>
                <TBody>
                  {report.slice(0, 10).map((r, i) => (
                    <TR key={r.productId}>
                      <TD className="text-center font-mono text-slate-400">{i + 1}</TD>
                      <TD>
                        <div className="flex items-center gap-3">
                          <ProductImage src={r.image} alt={r.name} size={40} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                              {r.name}
                            </p>
                            <p className="font-mono text-xs text-slate-400">{r.sku}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-right font-mono font-medium">
                        {formatNumber(r.qtySold)}
                      </TD>
                      <TD className="text-right font-mono">{formatTHB(r.revenue)}</TD>
                      <TD className="text-right font-mono text-emerald-500">
                        {formatTHB(r.profit)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
