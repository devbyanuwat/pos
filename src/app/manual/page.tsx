"use client";

import Link from "next/link";
import {
  ShoppingBag,
  CreditCard,
  Boxes,
  Wallet,
  ShieldCheck,
  LogIn,
  ArrowRight,
  KeyRound,
  Database,
  Tag,
  ChevronRight,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PRESET_LOGINS, TIERS } from "@/lib/seed";
import { ROLE_LABELS, ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus, Role } from "@/lib/types";

const ROLE_ACCESS: Record<Role, string> = {
  owner: "เข้าถึงทุกหน้า รวมการเงิน รายจ่าย ผู้ใช้/สิทธิ์ และตั้งค่า",
  manager: "สินค้า สต๊อก ซื้อเข้า รายงาน ลูกค้า ส่วนลด และ POS",
  staff: "ขายหน้าร้าน (POS) ออเดอร์ และคิวแพ็ก",
  customer: "เลือกซื้อสินค้า ตะกร้า และบัญชี/บิลของตัวเอง",
};

const MODULES = [
  {
    icon: ShoppingBag,
    title: "หน้าร้านลูกค้า",
    href: "/shop",
    items: [
      "ลูกค้าเลือกซื้อสินค้าด้วยตัวเอง + ค้นหาเร็ว",
      "ราคาแสดงตามโปรไฟล์ของลูกค้าแต่ละคน",
      "ตะกร้า + ชำระเงิน + แนบสลิปโอนเงิน",
      "ดูบัญชีและประวัติบิลของตัวเอง",
    ],
  },
  {
    icon: CreditCard,
    title: "POS ขายหน้าร้าน",
    href: "/pos",
    items: [
      "ค้นหาสินค้าเร็ว ยิงเข้าบิล คิดเงิน",
      "ส่วนลดท้ายบิล + เลือกลูกค้าเพื่อใช้ราคาเฉพาะ",
      "บอร์ดออเดอร์ + ตรวจสอบสลิปของลูกค้า",
      "คิวแพ็ก ส่งต่อทีมแพ็กของ",
    ],
  },
  {
    icon: Boxes,
    title: "สินค้า & สต๊อก",
    href: "/admin/products",
    items: [
      "เพิ่ม/แก้ไขสินค้า + อัพโหลดรูป",
      "ระบุต้นทุนและราคาขาย คำนวณกำไรอัตโนมัติ",
      "ตรวจสต๊อกคงเหลือ + แจ้งเตือนสินค้าใกล้หมด",
      "รับสินค้าเข้า (บันทึกเป็นค่าใช้จ่าย)",
    ],
  },
  {
    icon: Wallet,
    title: "บัญชี & การเงิน",
    href: "/admin/finance",
    items: [
      "สรุปกำไรเรียลไทม์ รายวัน / รายเดือน",
      "รายจ่าย: เงินเดือน ค่าน้ำไฟ ค่าเช่า ถอนเงิน",
      "ยอดเงินสดคงเหลือ",
      "รายงานสินค้าขายดี / ขายไม่ดี",
    ],
  },
  {
    icon: ShieldCheck,
    title: "แอดมิน & สิทธิ์",
    href: "/admin/users",
    items: [
      "จัดการลูกค้า + ตั้งราคาเฉพาะแต่ละโปรไฟล์",
      "ส่วนลดท้ายบิล (เปิด/ปิด/แก้ไข)",
      "ผู้ใช้และสิทธิ์ตามลำดับชั้น",
      "ตั้งค่าร้าน + รีเซ็ตข้อมูลเดโม",
    ],
  },
];

const STATUS_FLOW: OrderStatus[] = ["pending_payment", "paid", "packing", "completed"];

export default function ManualPage() {
  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link href="/" aria-label="หน้าหลัก">
            <Brand />
          </Link>
          <span className="ml-1 hidden text-sm font-medium text-slate-400 sm:inline">
            คู่มือการใช้งาน
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm">
                <LogIn className="h-4 w-4" /> เข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            คู่มือระบบ POS + ร้านค้าออนไลน์
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
            เดโมระบบขายหน้าร้านและร้านค้าออนไลน์ครบวงจร — ลูกค้าสั่งซื้อเอง, จัดการสินค้า/สต๊อก,
            สรุปกำไรและบัญชีเรียลไทม์ พร้อมสิทธิ์ผู้ใช้ตามลำดับชั้น
          </p>
        </section>

        {/* Demo accounts */}
        <section>
          <SectionTitle icon={KeyRound} title="บัญชีทดลอง" hint="รหัสผ่านทุกบัญชี: 1234" />
          <Card strong className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>บทบาท</TH>
                  <TH>อีเมล</TH>
                  <TH>รหัสผ่าน</TH>
                  <TH className="hidden sm:table-cell">เข้าถึงอะไรได้บ้าง</TH>
                </TR>
              </THead>
              <TBody>
                {PRESET_LOGINS.map((acc) => (
                  <TR key={acc.email}>
                    <TD>
                      <Badge tone="primary">{ROLE_LABELS[acc.role]}</Badge>
                    </TD>
                    <TD className="font-mono text-slate-700 dark:text-slate-200">{acc.email}</TD>
                    <TD className="font-mono">{acc.password}</TD>
                    <TD className="hidden text-slate-500 sm:table-cell dark:text-slate-400">
                      {ROLE_ACCESS[acc.role]}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
          <p className="mt-2 text-xs text-slate-400">
            หรือกดปุ่ม &quot;เข้าใช้งานด่วน&quot; ที่หน้าเข้าสู่ระบบเพื่อล็อกอินทันที
          </p>
        </section>

        {/* Modules */}
        <section>
          <SectionTitle icon={Boxes} title="โมดูลทั้งหมด" />
          <div className="grid gap-4 sm:grid-cols-2">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.href} className="transition-shadow hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">{m.title}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {m.items.map((it) => (
                        <li
                          key={it}
                          className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={m.href}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      เปิดหน้านี้ <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            เมนูที่แสดงจะต่างกันตามสิทธิ์ของผู้ใช้ที่ล็อกอิน
          </p>
        </section>

        {/* Pricing tiers */}
        <section>
          <SectionTitle icon={Tag} title="ระบบราคาตามโปรไฟล์" />
          <Card>
            <CardContent className="p-5">
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                ลูกค้าแต่ละคนถูกจัดอยู่ใน &quot;ระดับราคา&quot; ทำให้เห็นราคาต่างกัน
                และแอดมินยังตั้ง <span className="font-medium text-slate-800 dark:text-slate-100">ราคาเฉพาะรายสินค้าต่อลูกค้าแต่ละคน</span> ได้อีกด้วย
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {TIERS.map((t) => (
                  <div
                    key={t.id}
                    className="glass-subtle rounded-xl p-4 text-center"
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{t.name}</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-primary">
                      {Math.round(t.multiplier * 100)}%
                    </p>
                    <p className="mt-1 text-xs text-slate-400">ของราคาตั้งต้น</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Order flow */}
        <section>
          <SectionTitle icon={CreditCard} title="ขั้นตอนสถานะบิล" />
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_FLOW.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <Badge tone={ORDER_STATUS[s].tone}>{ORDER_STATUS[s].label}</Badge>
                    {i < STATUS_FLOW.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                ลูกค้าสั่งซื้อออนไลน์และแนบสลิป → พนักงานตรวจสลิปแล้วกด
                <Badge tone={ORDER_STATUS.paid.tone} className="mx-1">
                  {ORDER_STATUS.paid.label}
                </Badge>
                → ส่งเข้าคิวแพ็ก → เมื่อแพ็กเสร็จเป็น
                <Badge tone={ORDER_STATUS.completed.tone} className="mx-1">
                  {ORDER_STATUS.completed.label}
                </Badge>
                บิลที่ยกเลิกจะคืนสต๊อกอัตโนมัติ
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Permissions */}
        <section>
          <SectionTitle icon={ShieldCheck} title="ลำดับชั้นสิทธิ์การเข้าถึง" />
          <Card strong className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>บทบาท</TH>
                  <TH>สิทธิ์การเข้าถึง</TH>
                </TR>
              </THead>
              <TBody>
                {(["owner", "manager", "staff", "customer"] as Role[]).map((r) => (
                  <TR key={r}>
                    <TD>
                      <Badge tone="primary">{ROLE_LABELS[r]}</Badge>
                    </TD>
                    <TD className="text-slate-600 dark:text-slate-300">{ROLE_ACCESS[r]}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </section>

        {/* Demo data note */}
        <section>
          <SectionTitle icon={Database} title="เกี่ยวกับข้อมูลเดโม" />
          <Card>
            <CardContent className="space-y-2 p-5 text-sm text-slate-600 dark:text-slate-300">
              <p>
                ข้อมูลทั้งหมดเป็นข้อมูลตัวอย่าง เก็บไว้ในเบราว์เซอร์ของคุณ (localStorage) —
                การเพิ่มสินค้า สร้างบิล ตัดสต๊อก หรือบันทึกรายจ่าย จะค้างจริงตลอดการใช้งาน
              </p>
              <p>
                ต้องการเริ่มใหม่? ไปที่
                <span className="font-medium text-slate-800 dark:text-slate-100"> ตั้งค่า </span>
                (เฉพาะเจ้าของร้าน) แล้วกด &quot;รีเซ็ตข้อมูลเดโม&quot; เพื่อคืนค่าข้อมูลตั้งต้น
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="flex flex-col items-center gap-3 py-4 text-center">
          <Link href="/login">
            <Button size="lg">
              <LogIn className="h-4 w-4" /> เริ่มใช้งาน
            </Button>
          </Link>
          <p className="text-xs text-slate-400">
            Next.js 16 · React 19 · Tailwind v4 · Zustand · Recharts
          </p>
        </section>
      </main>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof KeyRound;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
      {hint && <span className="ml-auto text-xs text-slate-400">{hint}</span>}
    </div>
  );
}
