"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { JewelArt, type JewelKind } from "./jewel-art";

/**
 * A product photo that never shows the browser's broken-image icon. With no
 * photo, or when the photo fails to load (file deleted, storage briefly down),
 * it shows the category's line drawing and "Foto belum tersedia" instead.
 * Fills its parent, which must be positioned and sized (e.g. relative + aspect ratio).
 */
export function ProductPhoto({
  src,
  alt,
  sizes,
  priority = false,
  className,
  kind,
  fallbackLabel,
  size = "card",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  kind: JewelKind;
  fallbackLabel: string;
  size?: "card" | "large";
}) {
  // Remembers which address failed, so a new photo for the same slot is tried again.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
        <JewelArt kind={kind} className={size === "large" ? "size-24" : "size-16"} />
        <span className={cn("text-muted-foreground", size === "large" ? "text-sm" : "text-xs")}>{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      // next/image re-checks images that failed before the page became interactive,
      // so this also catches a photo that broke while the page was still loading.
      onError={() => setFailedSrc(src)}
    />
  );
}
