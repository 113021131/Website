import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProductForm, type ProductFormValues } from "../product-form";

const dictionary = getDictionary();
const t = dictionary.admin.products;

export const metadata: Metadata = { title: t.newTitle };

export default function NewProductPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.newTitle}</h1>
      <p className="text-muted-foreground mt-1">{t.photosSaveFirst}</p>
      <Suspense fallback={<div className="mt-5 h-96 rounded-lg bg-background" />}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const [{ data: categories }, { data: karats }, { data: settings }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("karats").select("id, code").eq("is_active", true).order("sort_order"),
    supabase.from("site_settings").select("default_labour_fee_type, default_labour_fee_value").eq("id", 1).single(),
  ]);

  // New products start from the shop's default ongkos, as a draft.
  const values: ProductFormValues = {
    name: "",
    slug: "",
    description: "",
    categoryId: null,
    karatId: null,
    weight: "",
    sizes: "",
    occasions: [],
    feeType: settings?.default_labour_fee_type ?? "per_gram",
    feeValue: String(settings?.default_labour_fee_value ?? 0),
    priceOnRequest: false,
    status: "draft",
    featured: false,
    demo: false,
    videoUrl: "",
    sku: "",
    nameEn: "",
    descriptionEn: "",
    grossWeight: "",
    gemstone: "",
    gemstoneEn: "",
    materialCost: "0",
    markupPercent: "",
    manualPrice: "",
  };

  return (
    <div className="mt-5">
      <ProductForm
        productId={null}
        values={values}
        categories={(categories ?? []).map((category) => ({ id: category.id, label: category.name }))}
        karats={(karats ?? []).map((karat) => ({ id: karat.id, label: karat.code }))}
        occasionLabels={dictionary.catalog.occasions}
        t={t}
      />
    </div>
  );
}
