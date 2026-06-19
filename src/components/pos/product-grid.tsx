"use client";

import { useMemo, useState } from "react";
import { Search, PackageX, Plus } from "lucide-react";
import { Input, Badge, EmptyState } from "@/components/ui";
import { cn, formatTHB, formatNumber } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";

/**
 * Searchable + category-filterable product grid for the POS sale screen.
 * Clicking a product calls onPick(product) to add it to the local sale.
 * `priceFor` resolves the price shown per the selected customer's tier.
 */
export function ProductGrid({
  products,
  categories,
  priceFor,
  onPick,
}: {
  products: Product[];
  categories: Category[];
  priceFor: (p: Product) => number;
  onPick: (p: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.active)
      .filter((p) => (categoryId === "all" ? true : p.categoryId === categoryId))
      .filter((p) =>
        q === "" ? true : p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );
  }, [products, query, categoryId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาสินค้า / รหัส SKU"
          className="pl-10"
          aria-label="ค้นหาสินค้า"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <CategoryChip
          label="ทั้งหมด"
          active={categoryId === "all"}
          onClick={() => setCategoryId("all")}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            label={c.name}
            active={categoryId === c.id}
            onClick={() => setCategoryId(c.id)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="ไม่พบสินค้า"
          description="ลองเปลี่ยนคำค้นหรือหมวดหมู่"
          className="glass-strong"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductTile key={p.id} product={p} price={priceFor(p)} onPick={onPick} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white shadow-md shadow-primary/25"
          : "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 dark:text-slate-300 dark:hover:bg-white/10",
      )}
    >
      {label}
    </button>
  );
}

function ProductTile({
  product,
  price,
  onPick,
}: {
  product: Product;
  price: number;
  onPick: (p: Product) => void;
}) {
  const out = product.stock <= 0;
  const low = !out && product.stock <= product.lowStockThreshold;

  return (
    <button
      type="button"
      onClick={() => !out && onPick(product)}
      disabled={out}
      className={cn(
        "group glass-strong flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-200",
        out
          ? "cursor-not-allowed opacity-60"
          : "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.99]",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-500/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2">
          {out ? (
            <Badge tone="danger">สินค้าหมด</Badge>
          ) : low ? (
            <Badge tone="warning">เหลือน้อย</Badge>
          ) : null}
        </span>
        {!out && (
          <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-lg shadow-primary/30 transition-opacity duration-200 group-hover:opacity-100">
            <Plus className="h-5 w-5" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-50">
          {product.name}
        </p>
        <p className="font-mono text-[11px] text-slate-400">{product.sku}</p>
        <div className="mt-auto flex items-end justify-between pt-1">
          <span className="font-mono text-base font-semibold text-primary">{formatTHB(price)}</span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            คงเหลือ {formatNumber(product.stock)}
          </span>
        </div>
      </div>
    </button>
  );
}
