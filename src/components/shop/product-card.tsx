"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, PackageX } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { formatTHB } from "@/lib/utils";
import { getPriceForCustomer } from "@/lib/selectors";
import type { Customer, PricingTier, Product } from "@/lib/types";

export function ProductCard({
  product,
  categoryName,
  customer,
  tiers,
  onAdd,
}: {
  product: Product;
  categoryName: string;
  customer: Customer | null;
  tiers: PricingTier[];
  onAdd: (id: string) => void;
}) {
  const price = getPriceForCustomer(product, customer, tiers);
  const hasDeal = price < product.basePrice;
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= product.lowStockThreshold;

  return (
    <div className="glass group flex flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/shop/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-slate-500/5"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/45 backdrop-blur-[1px]">
            <Badge tone="danger" className="gap-1.5 px-3 py-1 text-sm">
              <PackageX className="h-3.5 w-3.5" />
              สินค้าหมด
            </Badge>
          </div>
        )}
        {!soldOut && hasDeal && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-md">
            ราคาพิเศษ
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <p className="text-xs text-slate-400">{categoryName}</p>
          <Link href={`/shop/${product.id}`}>
            <h3 className="mt-0.5 line-clamp-2 font-medium leading-snug text-slate-900 transition-colors hover:text-primary dark:text-slate-50">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-50">
              {formatTHB(price)}
            </p>
            {hasDeal && (
              <p className="font-mono text-xs text-slate-400 line-through">
                {formatTHB(product.basePrice)}
              </p>
            )}
          </div>
          {lowStock && (
            <Badge tone="warning" className="shrink-0">
              เหลือ {product.stock} ชิ้น
            </Badge>
          )}
        </div>

        <Button
          variant={soldOut ? "outline" : "primary"}
          size="sm"
          disabled={soldOut}
          onClick={() => onAdd(product.id)}
          className="w-full"
        >
          {soldOut ? (
            "สินค้าหมด"
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              เพิ่มลงตะกร้า
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
