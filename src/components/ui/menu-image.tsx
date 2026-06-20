"use client";

import { useState } from "react";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Menu/product image (topic 6). Shows the real fetched image; on missing or
 * failed load it falls back to a branded default (tan/mocha gradient + cup),
 * never an emoji.
 */
export function MenuImage({
  src,
  alt,
  className,
  iconClassName,
}: {
  src?: string;
  alt?: string;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#f0c58f] to-[#a6815e]",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Coffee className={cn("h-2/5 w-2/5 text-white/85", iconClassName)} />
      )}
    </div>
  );
}
