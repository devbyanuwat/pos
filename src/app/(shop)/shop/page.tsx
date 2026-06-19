"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingBag, PackageSearch } from "lucide-react";
import { PageHeader, Input, Select, EmptyState, Badge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui";
import { ProductCard } from "@/components/shop/product-card";

const ALL = "all";

export default function ShopCatalogPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const tiers = useStore((s) => s.tiers);
  const addToCart = useStore((s) => s.addToCart);
  const { customer } = useAuth();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? "ไม่ระบุหมวด";
  }, [categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.active)
      .filter((p) => (category === ALL ? true : p.categoryId === category))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
  }, [products, category, query]);

  const handleAdd = (id: string) => {
    addToCart(id);
    const p = products.find((pr) => pr.id === id);
    toast.success(`เพิ่ม "${p?.name ?? "สินค้า"}" ลงตะกร้าแล้ว`);
  };

  return (
    <div>
      <PageHeader
        title="ร้านค้า"
        description="เลือกซื้อสินค้าคุณภาพในราคาสำหรับคุณโดยเฉพาะ"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาสินค้า หรือรหัส SKU"
            className="pl-10"
            aria-label="ค้นหาสินค้า"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="กรองตามหมวดหมู่"
          >
            <option value={ALL}>ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Badge tone="neutral" className="font-mono">
          {visible.length}
        </Badge>
        รายการสินค้า
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="ไม่พบสินค้าที่ค้นหา"
          description="ลองปรับคำค้นหา หรือเลือกหมวดหมู่อื่น"
          className="glass"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              categoryName={categoryName(p.categoryId)}
              customer={customer}
              tiers={tiers}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}

      {products.filter((p) => p.active).length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="ยังไม่มีสินค้าในร้าน"
          className="glass mt-4"
        />
      )}
    </div>
  );
}
