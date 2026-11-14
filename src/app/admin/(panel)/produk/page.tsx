import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buttonPrimary } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProductList, type ListedProduct } from "./product-list";

const t = getDictionary().admin.products;

export const metadata: Metadata = { title: t.title };

export default function AdminProductsPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <Link href="/admin/produk/baru" className={buttonPrimary}>
          {t.add}
        </Link>
      </div>
      <Suspense fallback={<div className="mt-5 h-96 rounded-lg bg-background" />}>
        <Products />
      </Suspense>
    </>
  );
}

async function Products() {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("products")
    .select("id, name, status, weight_g, karats(code), product_images(storage_path, sort_order)")
    .order("updated_at", { ascending: false })
    .limit(500);

  const products: ListedProduct[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    karatCode: row.karats?.code ?? "",
    weightG: Number(row.weight_g),
    imagePath: [...row.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path ?? null,
  }));

  if (products.length === 0) return <p className="text-muted-foreground mt-6">{t.empty}</p>;
  return <ProductList products={products} t={t} />;
}
