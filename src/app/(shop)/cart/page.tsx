"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingCart, ArrowRight, Tag, ShoppingBag } from "lucide-react";
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  EmptyState,
} from "@/components/ui";
import { QtyStepper } from "@/components/shop/qty-stepper";
import { useHydrated } from "@/components/shop/use-hydrated";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { getPriceForCustomer, bestDiscount } from "@/lib/selectors";
import { formatTHB } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const hydrated = useHydrated();

  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const tiers = useStore((s) => s.tiers);
  const discounts = useStore((s) => s.discounts);
  const setCartQty = useStore((s) => s.setCartQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const { customer } = useAuth();

  const lines = useMemo(
    () =>
      cart
        .map((c) => {
          const product = products.find((p) => p.id === c.productId);
          if (!product) return null;
          const unitPrice = getPriceForCustomer(product, customer, tiers);
          return { product, qty: c.qty, unitPrice, lineTotal: unitPrice * c.qty };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [cart, products, customer, tiers],
  );

  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  const discount = bestDiscount(subtotal, customer, discounts);
  const total = subtotal - discount.amount;

  if (hydrated && lines.length === 0) {
    return (
      <div>
        <PageHeader title="ตะกร้าสินค้า" />
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title="ตะกร้าของคุณว่างเปล่า"
            description="เลือกสินค้าที่ถูกใจแล้วเพิ่มลงตะกร้าได้เลย"
            action={
              <Link href="/shop">
                <Button variant="primary" size="sm">
                  <ShoppingCart className="h-4 w-4" />
                  เลือกซื้อสินค้า
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="ตะกร้าสินค้า"
        description={hydrated ? `${lines.length} รายการในตะกร้า` : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          {!hydrated ? (
            <Card strong>
              <CardContent className="py-10 text-center text-sm text-slate-400">
                กำลังโหลดตะกร้า...
              </CardContent>
            </Card>
          ) : (
            lines.map((l) => (
              <Card key={l.product.id} strong>
                <CardContent className="flex gap-4 p-4">
                  <Link
                    href={`/shop/${l.product.id}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-500/5 sm:h-24 sm:w-24"
                  >
                    <Image
                      src={l.product.image}
                      alt={l.product.name}
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/shop/${l.product.id}`}
                        className="line-clamp-2 font-medium leading-snug text-slate-900 transition-colors hover:text-primary dark:text-slate-50"
                      >
                        {l.product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(l.product.id)}
                        aria-label="นำออกจากตะกร้า"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 font-mono text-sm text-slate-500 dark:text-slate-400">
                      {formatTHB(l.unitPrice)} / ชิ้น
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <QtyStepper
                        size="sm"
                        value={l.qty}
                        min={1}
                        max={Math.max(1, l.product.stock)}
                        onChange={(q) => setCartQty(l.product.id, q)}
                      />
                      <span className="font-mono text-base font-semibold text-slate-900 dark:text-slate-50">
                        {formatTHB(l.lineTotal)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Card strong>
            <CardContent className="flex flex-col gap-4 p-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                สรุปคำสั่งซื้อ
              </h2>

              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    ยอดรวมสินค้า
                  </span>
                  <span className="font-mono text-slate-900 dark:text-slate-50">
                    {formatTHB(subtotal)}
                  </span>
                </div>
                {discount.amount > 0 && (
                  <div className="flex items-center justify-between text-emerald-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      {discount.label ?? "ส่วนลด"}
                    </span>
                    <span className="font-mono">-{formatTHB(discount.amount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200/60 pt-4 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    ยอดชำระทั้งสิ้น
                  </span>
                  <span className="font-mono text-xl font-bold text-slate-900 dark:text-slate-50">
                    {formatTHB(total)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.push("/checkout")}
              >
                ดำเนินการชำระเงิน
                <ArrowRight className="h-5 w-5" />
              </Button>

              <Link
                href="/shop"
                className="text-center text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
              >
                เลือกซื้อสินค้าต่อ
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
