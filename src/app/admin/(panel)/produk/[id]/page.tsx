import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { createServerSupabase } from "@/lib/supabase/server";
import { ModelManager, PhotoManager } from "../media-manager";
import { ProductForm, type ProductFormValues } from "../product-form";
import { DeleteProductButton } from "./delete-button";

const dictionary = getDictionary();
const t = dictionary.admin.products;

export const metadata: Metadata = { title: t.editTitle };

type Props = PageProps<"/admin/produk/[id]">;

export default function EditProductPage({ params }: Props) {
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.editTitle}</h1>
      <Suspense fallback={<div className="mt-5 h-96 rounded-lg bg-background" />}>
        <EditProduct params={params} />
      </Suspense>
    </>
  );
}

async function EditProduct({ params }: Pick<Props, "params">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supabase = await createServerSupabase();
  const [{ data: product }, { data: categories }, { data: karats }] = await Promise.all([
    supabase.from("products").select("*, product_images(id, storage_path, alt, sort_order)").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("karats").select("id, code").order("sort_order"),
  ]);
  if (!product) notFound();

  const values: ProductFormValues = {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    categoryId: product.category_id,
    karatId: product.karat_id,
    weight: String(Number(product.weight_g)).replace(".", ","),
    sizes: product.size_options.join(", "),
    occasions: product.occasions,
    feeType: product.labour_fee_type,
    feeValue: String(Number(product.labour_fee_value)).replace(".", ","),
    priceOnRequest: product.price_on_request,
    status: product.status,
    featured: product.is_featured,
    demo: product.is_demo,
    videoUrl: product.video_url ?? "",
  };

  const images = [...product.product_images]
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((image) => ({ id: image.id, path: image.storage_path, alt: image.alt }));

  return (
    <div className="mt-5 space-y-5">
      {product.status !== "draft" ? (
        <p>
          <Link href={`/katalog/${product.slug}`} className="text-brand font-semibold underline-offset-4 hover:underline">
            /katalog/{product.slug}
          </Link>
        </p>
      ) : null}
      {/* Keyed on updated_at so the form shows what was saved after a refresh. */}
      <ProductForm
        key={product.updated_at}
        productId={product.id}
        values={values}
        categories={(categories ?? []).map((category) => ({ id: category.id, label: category.name }))}
        karats={(karats ?? []).map((karat) => ({ id: karat.id, label: karat.code }))}
        occasionLabels={dictionary.catalog.occasions}
        t={t}
      />
      <PhotoManager productId={product.id} images={images} t={t} />
      <ModelManager
        productId={product.id}
        hasGlb={Boolean(product.model_glb_path)}
        hasUsdz={Boolean(product.model_usdz_path)}
        t={t}
      />
      <DeleteProductButton productId={product.id} t={t} />
    </div>
  );
}
