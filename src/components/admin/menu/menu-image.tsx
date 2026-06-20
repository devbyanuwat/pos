"use client";

import Image from "next/image";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

/** Menu item thumbnail with a graceful coffee-cup fallback. Uses next/image (unoptimized). */
export function MenuImage({
  src,
  alt,
  size = 44,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-xl bg-slate-500/10 text-slate-400",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Coffee className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-xl bg-slate-500/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill unoptimized sizes={`${size}px`} className="object-cover" />
    </span>
  );
}
