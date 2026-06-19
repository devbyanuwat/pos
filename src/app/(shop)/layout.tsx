import { ShopShell } from "@/components/layout/shop-shell";

export default function ShopGroupLayout({ children }: { children: React.ReactNode }) {
  return <ShopShell>{children}</ShopShell>;
}
