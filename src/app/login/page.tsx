"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useStore } from "@/lib/store";
import { PRESET_LOGINS } from "@/lib/seed";
import { homeForRole } from "@/lib/constants";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const users = useStore((s) => s.users);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = (em: string, pw: string) => {
    setLoading(true);
    const ok = login(em, pw);
    if (ok) {
      const u = users.find((x) => x.email.toLowerCase() === em.toLowerCase());
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.replace(u ? homeForRole(u.role) : "/");
    } else {
      setLoading(false);
      toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Brand />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">ยินดีต้อนรับ</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              เข้าสู่ระบบ POS และร้านค้าออนไลน์
            </p>
          </div>
        </div>

        <Card strong className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doLogin(email, password);
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@demo.pos"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="1234"
                required
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              <LogIn className="h-4 w-4" /> เข้าสู่ระบบ
            </Button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-center text-xs text-slate-400">หรือเข้าใช้งานด่วน (เดโม)</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_LOGINS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => doLogin(p.email, p.password)}
                  className="rounded-xl border border-slate-200/70 bg-white/40 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">รหัสผ่านเดโมทุกบัญชี: 1234</p>
        <p className="mt-2 text-center text-xs">
          <Link href="/manual" className="font-medium text-primary hover:underline">
            ดูคู่มือการใช้งานและบัญชีทดลอง
          </Link>
        </p>
      </div>
    </div>
  );
}
