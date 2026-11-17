"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { CACHE_TAGS } from "@/lib/data/public";
import { parseWeightInput } from "@/lib/format";
import { Constants } from "@/lib/supabase/database.types";
import { createServerSupabase } from "@/lib/supabase/server";
import { warmPaths } from "@/lib/warm";

export type ProductFormState = {
  status: "idle" | "saved" | "error";
  message: string;
  errors: Partial<Record<"name" | "weight" | "karat" | "fee" | "slug" | "video" | "detail", string>>;
};

const OCCASIONS = Object.keys(getDictionary().catalog.occasions);

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseAmount(text: string): number | null {
  const number = Number(text.trim().replace(/\./g, "").replace(",", "."));
  return text.trim() !== "" && Number.isFinite(number) && number >= 0 ? number : null;
}

const idSchema = z.number().int().positive();

/** Create (productId null) or update a product. Bound to the id with `.bind`. */
export async function saveProduct(
  productId: number | null,
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const t = getDictionary().admin.products;
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const errors: ProductFormState["errors"] = {};
  const name = text("name").slice(0, 200);
  if (!name) errors.name = t.validation.name;

  const weight = parseWeightInput(text("weight"));
  if (weight === null) errors.weight = t.validation.weight;

  const karatId = Number(text("karatId"));
  if (!idSchema.safeParse(karatId).success) errors.karat = t.validation.karat;

  const feeType = z.enum(Constants.public.Enums.labour_fee_type).safeParse(text("feeType"));
  const feeValue = parseAmount(text("feeValue") || "0");
  if (!feeType.success || feeValue === null || (feeType.data === "percent" && feeValue > 100)) errors.fee = t.validation.fee;

  const rawSlug = text("slug");
  if (rawSlug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawSlug)) errors.slug = t.validation.slug;

  const videoUrl = text("videoUrl");
  if (videoUrl && !z.url({ protocol: /^https$/ }).safeParse(videoUrl).success) errors.video = t.validation.video;

  // Optional details: blank means "not set". Any that is filled in must be a sensible number.
  const grossWeight = text("grossWeight") ? parseWeightInput(text("grossWeight")) : null;
  const materialCost = parseAmount(text("materialCost") || "0");
  const markupPercent = text("markupPercent") ? parseAmount(text("markupPercent")) : null;
  const manualPrice = text("manualPrice") ? parseAmount(text("manualPrice")) : null;
  if (
    (text("grossWeight") && (grossWeight === null || (weight !== null && grossWeight < weight))) ||
    materialCost === null ||
    !Number.isInteger(materialCost) ||
    (text("markupPercent") && (markupPercent === null || markupPercent > 100)) ||
    (text("manualPrice") && (manualPrice === null || manualPrice <= 0 || !Number.isInteger(manualPrice)))
  ) {
    errors.detail = t.validation.detail;
  }

  const status = z.enum(Constants.public.Enums.product_status).safeParse(text("status"));

  if (
    Object.keys(errors).length > 0 ||
    !feeType.success ||
    weight === null ||
    feeValue === null ||
    materialCost === null ||
    !status.success
  ) {
    return { status: "error", message: t.failed, errors };
  }

  const supabase = await createServerSupabase();
  const categoryId = Number(text("categoryId"));

  // A blank slug is generated from the name and made unique.
  let slug = rawSlug || slugify(name) || "produk";
  if (!rawSlug) {
    const { data: taken } = await supabase.from("products").select("id, slug").like("slug", `${slug}%`);
    const others = new Set((taken ?? []).filter((row) => row.id !== productId).map((row) => row.slug));
    let suffix = 2;
    const base = slug;
    while (others.has(slug)) slug = `${base}-${suffix++}`;
  }

  const row = {
    name,
    slug,
    description: text("description").slice(0, 4000) || null,
    category_id: idSchema.safeParse(categoryId).success ? categoryId : null,
    karat_id: karatId,
    weight_g: weight,
    size_options: text("sizes").split(",").map((size) => size.trim()).filter(Boolean).slice(0, 30),
    occasions: formData.getAll("occasions").map(String).filter((value) => OCCASIONS.includes(value)),
    labour_fee_type: feeType.data,
    labour_fee_value: feeValue,
    price_on_request: formData.get("priceOnRequest") === "on",
    status: status.data,
    is_featured: formData.get("featured") === "on",
    is_demo: formData.get("demo") === "on",
    video_url: videoUrl || null,
    sku: text("sku").slice(0, 40) || null,
    name_en: text("nameEn").slice(0, 200) || null,
    description_en: text("descriptionEn").slice(0, 4000) || null,
    gross_weight_g: grossWeight,
    gemstone_details: text("gemstone").slice(0, 300) || null,
    gemstone_details_en: text("gemstoneEn").slice(0, 300) || null,
    material_cost_idr: materialCost,
    markup_percent: markupPercent,
    manual_price_idr: manualPrice,
  };

  if (productId === null) {
    const { data, error } = await supabase
      .from("products")
      .insert({ ...row, published_at: row.status === "draft" ? null : new Date().toISOString() })
      .select("id")
      .single();
    if (error) {
      return error.code === "23505"
        ? { status: "error", message: t.failed, errors: { slug: t.slugTaken } }
        : { status: "error", message: t.failed, errors: {} };
    }
    updateTag(CACHE_TAGS.products);
    redirect(`/admin/produk/${data.id}`);
  }

  const { data: before } = await supabase.from("products").select("published_at").eq("id", productId).single();
  const { error } = await supabase
    .from("products")
    .update({
      ...row,
      ...(row.status !== "draft" && !before?.published_at ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", productId);
  if (error) {
    return error.code === "23505"
      ? { status: "error", message: t.failed, errors: { slug: t.slugTaken } }
      : { status: "error", message: t.failed, errors: {} };
  }

  updateTag(CACHE_TAGS.products);
  await warmPaths([`/katalog/${slug}`]);
  return { status: "saved", message: t.saved, errors: {} };
}

export async function duplicateProduct(productId: number): Promise<{ ok: boolean; id?: number }> {
  await requireAdmin();
  if (!idSchema.safeParse(productId).success) return { ok: false };
  const supabase = await createServerSupabase();

  const { data: source } = await supabase.from("products").select("*").eq("id", productId).single();
  if (!source) return { ok: false };

  // Photos and 3D files stay with the original; a copy starts as a clean draft.
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: `${source.name} (salinan)`.slice(0, 200),
      slug: `${source.slug.slice(0, 60)}-salinan-${Date.now().toString(36)}`,
      description: source.description,
      category_id: source.category_id,
      karat_id: source.karat_id,
      weight_g: source.weight_g,
      size_options: source.size_options,
      occasions: source.occasions,
      labour_fee_type: source.labour_fee_type,
      labour_fee_value: source.labour_fee_value,
      price_on_request: source.price_on_request,
      is_demo: source.is_demo,
      video_url: source.video_url,
      // The SKU is unique, so a copy starts without one.
      name_en: source.name_en,
      description_en: source.description_en,
      gross_weight_g: source.gross_weight_g,
      gemstone_details: source.gemstone_details,
      gemstone_details_en: source.gemstone_details_en,
      material_cost_idr: source.material_cost_idr,
      markup_percent: source.markup_percent,
      manual_price_idr: source.manual_price_idr,
      specs: source.specs,
      status: "draft",
      is_featured: false,
    })
    .select("id")
    .single();
  if (error) return { ok: false };

  updateTag(CACHE_TAGS.products);
  return { ok: true, id: data.id };
}

export async function bulkSetStatus(productIds: number[], status: "published" | "draft"): Promise<{ ok: boolean; count: number }> {
  await requireAdmin();
  const ids = z.array(idSchema).min(1).max(500).safeParse(productIds);
  if (!ids.success) return { ok: false, count: 0 };
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.from("products").update({ status }).in("id", ids.data).select("id");
  if (error) return { ok: false, count: 0 };
  if (status === "published") {
    await supabase.from("products").update({ published_at: new Date().toISOString() }).in("id", ids.data).is("published_at", null);
  }

  updateTag(CACHE_TAGS.products);
  return { ok: true, count: data.length };
}

export async function deleteProduct(productId: number): Promise<void> {
  await requireAdmin();
  if (!idSchema.safeParse(productId).success) return;
  const supabase = await createServerSupabase();

  const { data: product } = await supabase
    .from("products")
    .select("model_glb_path, model_usdz_path, product_images(storage_path)")
    .eq("id", productId)
    .single();
  if (!product) return;

  const images = product.product_images.map((image) => image.storage_path);
  const models = [product.model_glb_path, product.model_usdz_path].filter((path): path is string => Boolean(path));
  if (images.length > 0) await supabase.storage.from("product-images").remove(images);
  if (models.length > 0) await supabase.storage.from("product-models").remove(models);
  await supabase.from("products").delete().eq("id", productId);

  updateTag(CACHE_TAGS.products);
  redirect("/admin/produk");
}

/** Called after the browser has uploaded a resized photo straight to storage. */
export async function addImage(productId: number, path: string, width: number, height: number): Promise<{ ok: boolean }> {
  await requireAdmin();
  const input = z
    .object({
      productId: idSchema,
      path: z.string().regex(/^p\/\d+\/[a-z0-9-]+\.(webp|jpg)$/),
      width: z.number().int().positive().max(10_000),
      height: z.number().int().positive().max(10_000),
    })
    .safeParse({ productId, path, width, height });
  if (!input.success || !path.startsWith(`p/${productId}/`)) return { ok: false };

  const supabase = await createServerSupabase();
  const { data: last } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    width,
    height,
    sort_order: (last?.[0]?.sort_order ?? -1) + 1,
  });
  if (error) return { ok: false };

  updateTag(CACHE_TAGS.products);
  return { ok: true };
}

export async function updateImageAlt(imageId: number, alt: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!idSchema.safeParse(imageId).success) return { ok: false };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("product_images").update({ alt: alt.trim().slice(0, 200) }).eq("id", imageId);
  if (!error) updateTag(CACHE_TAGS.products);
  return { ok: !error };
}

export async function moveImage(imageId: number, direction: "up" | "down"): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!idSchema.safeParse(imageId).success) return { ok: false };
  const supabase = await createServerSupabase();

  const { data: image } = await supabase.from("product_images").select("product_id").eq("id", imageId).single();
  if (!image) return { ok: false };
  const { data: all } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", image.product_id)
    .order("sort_order")
    .order("id");
  if (!all) return { ok: false };

  const order = all.map((entry) => entry.id);
  const from = order.indexOf(imageId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= order.length) return { ok: true };
  [order[from], order[to]] = [order[to], order[from]];

  await Promise.all(order.map((id, index) => supabase.from("product_images").update({ sort_order: index }).eq("id", id)));
  updateTag(CACHE_TAGS.products);
  return { ok: true };
}

export async function removeImage(imageId: number): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!idSchema.safeParse(imageId).success) return { ok: false };
  const supabase = await createServerSupabase();

  const { data: image } = await supabase.from("product_images").select("storage_path").eq("id", imageId).single();
  if (!image) return { ok: false };
  await supabase.storage.from("product-images").remove([image.storage_path]);
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (!error) updateTag(CACHE_TAGS.products);
  return { ok: !error };
}

export async function setModel(productId: number, kind: "glb" | "usdz", path: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const valid =
    idSchema.safeParse(productId).success &&
    new RegExp(`^p/${productId}/[a-z0-9-]+\\.${kind}$`).test(path);
  if (!valid) return { ok: false };

  const supabase = await createServerSupabase();
  const column = kind === "glb" ? "model_glb_path" : "model_usdz_path";
  const { data: before } = await supabase.from("products").select("model_glb_path, model_usdz_path").eq("id", productId).single();
  const { error } = await supabase
    .from("products")
    .update(kind === "glb" ? { model_glb_path: path } : { model_usdz_path: path })
    .eq("id", productId);
  if (error) return { ok: false };

  const previous = before?.[column];
  if (previous && previous !== path) await supabase.storage.from("product-models").remove([previous]);
  updateTag(CACHE_TAGS.products);
  return { ok: true };
}
