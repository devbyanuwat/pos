"use client";

import { useEffect, useState } from "react";
import { Coins, Save, Settings2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  toast,
} from "@/components/ui";
import type { Settings } from "@/lib/types";
import { formatTHB } from "@/lib/utils";

/**
 * Owner/manager card to tune the loyalty economy:
 *  - earnRate:    baht spent to earn 1 point
 *  - redeemValue: baht value of 1 point on redeem
 */
export function LoyaltySettingsCard({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (patch: { earnRate: number; redeemValue: number }) => void;
}) {
  const [earnRate, setEarnRate] = useState(String(settings.earnRate ?? 20));
  const [redeemValue, setRedeemValue] = useState(String(settings.redeemValue ?? 1));

  // Re-sync if settings change underneath (e.g. demo reset).
  useEffect(() => {
    setEarnRate(String(settings.earnRate ?? 20));
    setRedeemValue(String(settings.redeemValue ?? 1));
  }, [settings.earnRate, settings.redeemValue]);

  function save() {
    const rate = Math.max(1, Math.round(Number(earnRate) || 0));
    const value = Math.max(0, Number(redeemValue) || 0);
    onSave({ earnRate: rate, redeemValue: value });
    toast.success("บันทึกการตั้งค่าคะแนนสะสมแล้ว");
  }

  const previewRate = Math.max(1, Math.round(Number(earnRate) || 0));
  const previewValue = Math.max(0, Number(redeemValue) || 0);

  return (
    <Card strong>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          ตั้งค่าคะแนนสะสม
        </CardTitle>
        <CardDescription>กำหนดอัตราการสะสมและมูลค่าการใช้คะแนน</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ly-earn">อัตราสะสม (บาท / 1 คะแนน)</Label>
              <Input
                id="ly-earn"
                type="number"
                min={1}
                inputMode="numeric"
                value={earnRate}
                onChange={(e) => setEarnRate(e.target.value)}
                placeholder="20"
                className="font-mono"
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                ลูกค้าได้ 1 คะแนน ทุกการใช้จ่าย{" "}
                <span className="font-mono">{formatTHB(previewRate)}</span>
              </p>
            </div>
            <div>
              <Label htmlFor="ly-redeem">มูลค่าคะแนน (บาท / 1 คะแนน)</Label>
              <Input
                id="ly-redeem"
                type="number"
                min={0}
                step="0.5"
                inputMode="decimal"
                value={redeemValue}
                onChange={(e) => setRedeemValue(e.target.value)}
                placeholder="1"
                className="font-mono"
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                1 คะแนน ใช้เป็นส่วนลดได้{" "}
                <span className="font-mono">{formatTHB(previewValue)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-indigo-500/10 p-3 text-xs leading-relaxed text-indigo-700 dark:text-indigo-300">
            <Coins className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              ตัวอย่าง: ซื้อ {formatTHB(previewRate * 10)} ได้รับ 10 คะแนน · ใช้ 10 คะแนน
              ลดได้ {formatTHB(previewValue * 10)}
            </span>
          </div>

          <div>
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
