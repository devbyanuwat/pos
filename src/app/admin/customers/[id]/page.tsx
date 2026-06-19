"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ReceiptText, Save, UserX } from "lucide-react";
import { useStore } from "@/lib/store";
import { PAID_STATUSES } from "@/lib/selectors";
import type { NewUser } from "@/lib/store";
import type { TierId } from "@/lib/types";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  Badge,
  StatCard,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
  toast,
} from "@/components/ui";
import { ORDER_STATUS } from "@/lib/constants";
import { formatTHB, formatDate } from "@/lib/utils";
import { CustomerPricingTable } from "@/components/admin/people/customer-pricing-table";
import { CustomerAccountCard } from "@/components/admin/people/customer-account-card";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const tiers = useStore((s) => s.tiers);
  const orders = useStore((s) => s.orders);
  const users = useStore((s) => s.users);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const setCustomerTier = useStore((s) => s.setCustomerTier);
  const setCustomerCustomPrice = useStore((s) => s.setCustomerCustomPrice);
  const addUser = useStore((s) => s.addUser);

  const customer = customers.find((c) => c.id === id) ?? null;

  // Profile edit local state. Re-seed whenever the customer reference changes.
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  useEffect(() => {
    if (!customer) return;
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      note: customer.note ?? "",
    });
  }, [customer]);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const customerOrders = useMemo(
    () =>
      orders
        .filter((o) => o.customerId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, id],
  );

  const totals = useMemo(() => {
    const spent = customerOrders
      .filter((o) => PAID_STATUSES.includes(o.status))
      .reduce((a, o) => a + o.total, 0);
    return { count: customerOrders.length, spent };
  }, [customerOrders]);

  const account = useMemo(() => users.find((u) => u.customerId === id) ?? null, [users, id]);

  if (!customer) {
    return (
      <div>
        <PageHeader title="ลูกค้า" />
        <Card strong>
          <CardContent className="py-4">
            <EmptyState
              icon={UserX}
              title="ไม่พบลูกค้า"
              description="ลูกค้ารายนี้อาจถูกลบไปแล้ว"
              action={
                <Link href="/admin/customers">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4" />
                    กลับไปรายชื่อลูกค้า
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  function saveProfile() {
    updateCustomer(id, {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      note: form.note.trim() || undefined,
    });
    toast.success("บันทึกข้อมูลลูกค้าแล้ว");
  }

  function changeTier(tierId: TierId) {
    setCustomerTier(id, tierId);
    toast.success("เปลี่ยนระดับราคาแล้ว");
  }

  function savePrice(productId: string, price: number) {
    setCustomerCustomPrice(id, productId, price);
    toast.success("บันทึกราคาเฉพาะลูกค้าแล้ว");
  }

  function clearPrice(productId: string) {
    setCustomerCustomPrice(id, productId, null);
    toast.info("ล้างราคาพิเศษแล้ว ใช้ราคาตามระดับแทน");
  }

  function createAccount(data: NewUser) {
    addUser(data);
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={customer.email}
        actions={
          <Link href="/admin/customers">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="จำนวนออเดอร์"
          value={totals.count}
          icon={ReceiptText}
          tone="info"
        />
        <StatCard
          label="ยอดซื้อสะสม"
          value={formatTHB(totals.spent)}
          tone="success"
          hint="เฉพาะออเดอร์ที่ชำระแล้ว"
        />
        <StatCard
          label="ราคาเฉพาะลูกค้า"
          value={`${Object.keys(customer.customPrices ?? {}).length} รายการ`}
          tone="primary"
        />
      </div>

      <div className="grid gap-4">
        {/* (a) Profile + tier */}
        <Card strong>
          <CardHeader>
            <CardTitle>ข้อมูลลูกค้า</CardTitle>
            <CardDescription>แก้ไขรายละเอียดและกำหนดระดับราคา</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cd-name">ชื่อลูกค้า</Label>
                  <Input
                    id="cd-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cd-email">อีเมล</Label>
                  <Input
                    id="cd-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cd-phone">เบอร์โทร</Label>
                  <Input
                    id="cd-phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="cd-tier">ระดับราคา</Label>
                  <Select
                    id="cd-tier"
                    value={customer.tierId}
                    onChange={(e) => changeTier(e.target.value)}
                  >
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (x{t.multiplier})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="cd-note">หมายเหตุ</Label>
                <Textarea
                  id="cd-note"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)"
                />
              </div>
              <div>
                <Button onClick={saveProfile}>
                  <Save className="h-4 w-4" />
                  บันทึกข้อมูล
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* (b) Per-product pricing */}
        <CustomerPricingTable
          customer={customer}
          products={activeProducts}
          tiers={tiers}
          onSave={savePrice}
          onClear={clearPrice}
        />

        {/* (c) Login account */}
        <CustomerAccountCard customer={customer} account={account} onCreate={createAccount} />

        {/* (d) Order history */}
        <Card strong>
          <CardHeader>
            <CardTitle>ประวัติการสั่งซื้อ</CardTitle>
            <CardDescription>ออเดอร์ทั้งหมดของลูกค้ารายนี้</CardDescription>
          </CardHeader>
          <CardContent>
            {customerOrders.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="ยังไม่มีออเดอร์"
                description="ลูกค้ารายนี้ยังไม่เคยสั่งซื้อ"
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>รหัสออเดอร์</TH>
                    <TH>วันที่</TH>
                    <TH className="text-right">รายการ</TH>
                    <TH className="text-right">ยอดรวม</TH>
                    <TH>สถานะ</TH>
                  </TR>
                </THead>
                <TBody>
                  {customerOrders.map((o) => {
                    const st = ORDER_STATUS[o.status];
                    const qty = o.items.reduce((a, i) => a + i.qty, 0);
                    return (
                      <TR key={o.id}>
                        <TD className="font-mono text-slate-900 dark:text-slate-50">{o.code}</TD>
                        <TD className="text-slate-500 dark:text-slate-400">
                          {formatDate(o.createdAt)}
                        </TD>
                        <TD className="text-right font-mono">{qty}</TD>
                        <TD className="text-right font-mono font-medium text-slate-900 dark:text-slate-50">
                          {formatTHB(o.total)}
                        </TD>
                        <TD>
                          <Badge tone={st.tone}>{st.label}</Badge>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
