"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  PackageX,
  PackageCheck,
  AlertTriangle,
  Tag,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  EmptyState,
  toast,
} from "@/components/ui";
import { QtyStepper } from "@/components/shop/qty-stepper";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { getPriceForCustomer } from "@/lib/selectors";
import { formatTHB } from "@/lib/utils";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const tiers = useStore((s) => s.tiers);
  const addToCart = useStore((s) => s.addToCart);
  const { customer } = useAuth();

  const [qty, setQty] = useState(1);

  const product = products.find((p) => p.id === id && p.active);

  if (!product) {
    return (
      <Card className="mt-6">
        <EmptyState
          icon={PackageX}
          title="ไม่พบสินค้านี้"
          description="สินค้าอาจถูกนำออกจากร้านแล้ว"
          action={
            <Link href="/shop">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                กลับไปหน้าร้าน
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ?? "ไม่ระบุหมวด";
  const price = getPriceForCustomer(product, customer, tiers);
  const hasDeal = price < product.basePrice;
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= product.lowStockThreshold;
  const maxQty = Math.max(1, product.stock);

  const handleAdd = () => {
    addToCart(product.id, qty);
    toast.success(`เพิ่ม "${product.name}" จำนวน ${qty} ชิ้น ลงตะกร้าแล้ว`);
  };

  return (
    <div>
      <Link
        href="/shop"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าร้าน
      </Link>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-square bg-slate-500/5">
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            {soldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/45 backdrop-blur-[1px]">
                <Badge tone="danger" className="gap-1.5 px-3 py-1 text-sm">
                  <PackageX className="h-4 w-4" />
                  สินค้าหมด
                </Badge>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col">
          <Card strong className="flex-1">
            <CardContent className="flex h-full flex-col gap-5 p-6">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="primary">{categoryName}</Badge>
                  <span className="font-mono text-xs text-slate-400">
                    SKU: {product.sku}
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-semibold leading-snug text-slate-900 dark:text-slate-50">
                  {product.name}
                </h1>
              </div>

              <div>
                <div className="flex items-end gap-3">
                  <span className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {formatTHB(price)}
                  </span>
                  {hasDeal && (
                    <span className="mb-1 font-mono text-base text-slate-400 line-through">
                      {formatTHB(product.basePrice)}
                    </span>
                  )}
                </div>
                {hasDeal && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-emerald-500">
                    <Tag className="h-3.5 w-3.5" />
                    ราคาพิเศษสำหรับคุณ
                  </p>
                )}
              </div>

              {product.description && (
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {product.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm">
                {soldOut ? (
                  <span className="inline-flex items-center gap-1.5 text-red-500">
                    <PackageX className="h-4 w-4" />
                    สินค้าหมด
                  </span>
                ) : lowStock ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    เหลือเพียง {product.stock} ชิ้น รีบสั่งก่อนหมด
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-emerald-500">
                    <PackageCheck className="h-4 w-4" />
                    มีสินค้าพร้อมส่ง ({product.stock} ชิ้น)
                  </span>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    จำนวน
                  </span>
                  <QtyStepper
                    value={qty}
                    onChange={setQty}
                    min={1}
                    max={maxQty}
                  />
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={soldOut}
                  onClick={handleAdd}
                  className="flex-1"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {soldOut ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
