"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small product thumbnail with graceful fallback. Uses next/image (unoptimized). */
export function ProductImage({
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
          "flex items-center justify-center rounded-lg bg-slate-500/10 text-slate-400",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <ImageOff className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-lg bg-slate-500/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill unoptimized sizes={`${size}px`} className="object-cover" />
    </span>
  );
}
