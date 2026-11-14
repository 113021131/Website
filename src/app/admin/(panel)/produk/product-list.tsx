"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonSecondary } from "@/components/ui/styles";
import { fill, type Dictionary } from "@/i18n";
import { formatWeight } from "@/lib/format";
import { storageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { bulkSetStatus, duplicateProduct } from "./actions";

export type ListedProduct = {
  id: number;
  name: string;
  status: "draft" | "published" | "sold" | "out_of_stock";
  karatCode: string;
  weightG: number;
  imagePath: string | null;
};

export function ProductList({ products, t }: { products: ListedProduct[]; t: Dictionary["admin"]["products"] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggle(id: number) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulk(status: "published" | "draft") {
    if (selected.size === 0) {
      toast.info(t.bulkNone);
      return;
    }
    startTransition(async () => {
      const result = await bulkSetStatus([...selected], status);
      if (result.ok) {
        toast.success(fill(t.bulkDone, { count: String(result.count) }));
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(t.failed);
      }
    });
  }

  function duplicate(id: number) {
    startTransition(async () => {
      const result = await duplicateProduct(id);
      if (result.ok && result.id) {
        toast.success(t.duplicated);
        router.push(`/admin/produk/${result.id}`);
      } else {
        toast.error(t.failed);
      }
    });
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => bulk("published")} className={buttonSecondary}>
          {t.bulkPublish}
        </button>
        <button type="button" disabled={pending} onClick={() => bulk("draft")} className={buttonSecondary}>
          {t.bulkUnpublish}
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {products.map((product) => (
          <li key={product.id} className="flex items-center gap-3 rounded-lg border bg-background p-2">
            <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
              <input
                type="checkbox"
                checked={selected.has(product.id)}
                onChange={() => toggle(product.id)}
                aria-label={fill(t.select, { name: product.name })}
                className="accent-brand size-5"
              />
            </label>
            <div className="bg-surface-tint relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-sm">
              {product.imagePath ? (
                <Image src={storageUrl("product-images", product.imagePath)} alt="" fill sizes="48px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/produk/${product.id}`}
                className="line-clamp-2 font-semibold break-words underline-offset-4 hover:underline"
              >
                {product.name}
              </Link>
              <p className="price text-muted-foreground text-sm">
                {product.karatCode}, {formatWeight(product.weightG)}
              </p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  product.status === "published" ? "text-success" : "text-muted-foreground",
                )}
              >
                {t.status[product.status]}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => duplicate(product.id)}
              className="hover:bg-surface-muted min-h-11 shrink-0 rounded-md border px-3 text-sm font-semibold"
            >
              {t.duplicate}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
