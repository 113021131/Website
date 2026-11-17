"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { buttonPrimary, fieldError, fieldHint, fieldInput, fieldLabel } from "@/components/ui/styles";
import type { Dictionary } from "@/i18n";
import { saveProduct, type ProductFormState } from "./actions";

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  categoryId: number | null;
  karatId: number | null;
  weight: string;
  sizes: string;
  occasions: string[];
  feeType: "per_gram" | "fixed" | "percent";
  feeValue: string;
  priceOnRequest: boolean;
  status: "draft" | "published" | "sold" | "out_of_stock";
  featured: boolean;
  demo: boolean;
  videoUrl: string;
  sku: string;
  nameEn: string;
  descriptionEn: string;
  grossWeight: string;
  gemstone: string;
  gemstoneEn: string;
  materialCost: string;
  /** Empty = the site-wide default margin. */
  markupPercent: string;
  /** Empty = calculated from the gold price. */
  manualPrice: string;
};

type Option = { id: number; label: string };

const initialState: ProductFormState = { status: "idle", message: "", errors: {} };
const checkboxRow = "flex min-h-11 items-center gap-3";
const checkbox = "accent-brand size-5 shrink-0";

export function ProductForm({
  productId,
  values,
  categories,
  karats,
  occasionLabels,
  t,
}: {
  productId: number | null;
  values: ProductFormValues;
  categories: Option[];
  karats: Option[];
  occasionLabels: Record<string, string>;
  t: Dictionary["admin"]["products"];
}) {
  const [state, formAction, actionPending] = useActionState(saveProduct.bind(null, productId), initialState);
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;
  const formRef = useRef<HTMLFormElement>(null);
  const f = t.fields;

  // Submitted by hand rather than through the `action` prop: React resets an
  // uncontrolled form after an action, which would wipe every field on a
  // validation error. This keeps what the admin typed.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  useEffect(() => {
    if (state.status === "saved") toast.success(state.message);
    if (state.status === "error") {
      // Take the admin to the first field that needs fixing.
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state]);

  const error = (key: keyof ProductFormState["errors"]) =>
    state.errors[key] ? (
      <p id={`error-${key}`} className={fieldError}>
        {state.errors[key]}
      </p>
    ) : null;
  const invalid = (key: keyof ProductFormState["errors"]) =>
    state.errors[key] ? ({ "aria-invalid": true, "aria-describedby": `error-${key}` } as const) : {};

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4 rounded-lg border bg-background p-4">
      <div>
        <label htmlFor="product-name" className={fieldLabel}>
          {f.name}
        </label>
        <input id="product-name" name="name" defaultValue={values.name} maxLength={200} autoComplete="off" className={fieldInput} {...invalid("name")} />
        {error("name")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="product-category" className={fieldLabel}>
            {f.category}
          </label>
          <select id="product-category" name="categoryId" defaultValue={values.categoryId ?? ""} className={fieldInput}>
            <option value="">{f.noCategory}</option>
            {categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-karat" className={fieldLabel}>
            {f.karat}
          </label>
          <select id="product-karat" name="karatId" defaultValue={values.karatId ?? ""} className={fieldInput} {...invalid("karat")}>
            <option value="" disabled>
              {t.validation.karat}
            </option>
            {karats.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {error("karat")}
        </div>
        <div>
          <label htmlFor="product-weight" className={fieldLabel}>
            {f.weight}
          </label>
          <input id="product-weight" name="weight" inputMode="decimal" autoComplete="off" defaultValue={values.weight} className={`${fieldInput} price`} {...invalid("weight")} />
          {error("weight")}
        </div>
        <div>
          <label htmlFor="product-status" className={fieldLabel}>
            {f.status}
          </label>
          <select id="product-status" name="status" defaultValue={values.status} className={fieldInput}>
            {Object.entries(t.status).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-fee-type" className={fieldLabel}>
            {f.feeType}
          </label>
          <select id="product-fee-type" name="feeType" defaultValue={values.feeType} className={fieldInput}>
            {Object.entries(f.feeTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-fee-value" className={fieldLabel}>
            {f.feeValue}
          </label>
          <input id="product-fee-value" name="feeValue" inputMode="decimal" autoComplete="off" defaultValue={values.feeValue} className={`${fieldInput} price`} {...invalid("fee")} />
          {error("fee")}
        </div>
      </div>

      <div>
        <label htmlFor="product-description" className={fieldLabel}>
          {f.description}
        </label>
        <textarea id="product-description" name="description" rows={4} maxLength={4000} defaultValue={values.description} className={fieldInput} />
      </div>

      <div>
        <label htmlFor="product-sizes" className={fieldLabel}>
          {f.sizes}
        </label>
        <input id="product-sizes" name="sizes" defaultValue={values.sizes} autoComplete="off" aria-describedby="hint-sizes" className={fieldInput} />
        <p id="hint-sizes" className={fieldHint}>
          {f.sizesHint}
        </p>
      </div>

      {/* Everything the price breakdown and the English page need beyond the basics. */}
      <details
        className="bg-card rounded-md border"
        open={
          Boolean(
            values.sku ||
              values.nameEn ||
              values.descriptionEn ||
              values.grossWeight ||
              values.gemstone ||
              values.markupPercent ||
              values.manualPrice ||
              (values.materialCost && values.materialCost !== "0") ||
              state.errors.detail,
          ) || undefined
        }
      >
        <summary className="flex min-h-12 cursor-pointer items-center px-3 font-semibold">{f.detailsTitle}</summary>
        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
          <div>
            <label htmlFor="product-sku" className={fieldLabel}>
              {f.sku}
            </label>
            <input id="product-sku" name="sku" maxLength={40} autoComplete="off" defaultValue={values.sku} className={fieldInput} />
          </div>
          <div>
            <label htmlFor="product-gross-weight" className={fieldLabel}>
              {f.grossWeight}
            </label>
            <input id="product-gross-weight" name="grossWeight" inputMode="decimal" autoComplete="off" defaultValue={values.grossWeight} aria-describedby="hint-gross-weight" className={`${fieldInput} price`} />
            <p id="hint-gross-weight" className={fieldHint}>
              {f.grossWeightHint}
            </p>
          </div>
          <div>
            <label htmlFor="product-gemstone" className={fieldLabel}>
              {f.gemstone}
            </label>
            <input id="product-gemstone" name="gemstone" maxLength={300} autoComplete="off" defaultValue={values.gemstone} className={fieldInput} />
          </div>
          <div>
            <label htmlFor="product-material-cost" className={fieldLabel}>
              {f.materialCost}
            </label>
            <input id="product-material-cost" name="materialCost" inputMode="numeric" autoComplete="off" defaultValue={values.materialCost} className={`${fieldInput} price`} />
          </div>
          <div>
            <label htmlFor="product-markup" className={fieldLabel}>
              {f.markupPercent}
            </label>
            <input id="product-markup" name="markupPercent" inputMode="decimal" autoComplete="off" defaultValue={values.markupPercent} aria-describedby="hint-markup" className={fieldInput} />
            <p id="hint-markup" className={fieldHint}>
              {f.markupHint}
            </p>
          </div>
          <div>
            <label htmlFor="product-manual-price" className={fieldLabel}>
              {f.manualPrice}
            </label>
            <input id="product-manual-price" name="manualPrice" inputMode="numeric" autoComplete="off" defaultValue={values.manualPrice} aria-describedby="hint-manual-price" className={`${fieldInput} price`} />
            <p id="hint-manual-price" className={fieldHint}>
              {f.manualPriceHint}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="product-name-en" className={fieldLabel}>
              {f.nameEn}
            </label>
            <input id="product-name-en" name="nameEn" maxLength={200} autoComplete="off" lang="en" defaultValue={values.nameEn} className={fieldInput} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="product-description-en" className={fieldLabel}>
              {f.descriptionEn}
            </label>
            <textarea id="product-description-en" name="descriptionEn" rows={3} maxLength={4000} lang="en" defaultValue={values.descriptionEn} className={fieldInput} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="product-gemstone-en" className={fieldLabel}>
              {f.gemstoneEn}
            </label>
            <input id="product-gemstone-en" name="gemstoneEn" maxLength={300} autoComplete="off" lang="en" defaultValue={values.gemstoneEn} className={fieldInput} />
          </div>
          {state.errors.detail ? (
            <p role="alert" className={`${fieldError} sm:col-span-2`}>
              {state.errors.detail}
            </p>
          ) : null}
        </div>
      </details>

      <fieldset>
        <legend className={fieldLabel}>{f.occasions}</legend>
        <div className="mt-1 grid grid-cols-2 gap-x-4 sm:grid-cols-3">
          {Object.entries(occasionLabels).map(([value, label]) => (
            <label key={value} className={checkboxRow}>
              <input type="checkbox" name="occasions" value={value} defaultChecked={values.occasions.includes(value)} className={checkbox} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={checkboxRow}>
          <input type="checkbox" name="priceOnRequest" defaultChecked={values.priceOnRequest} className={checkbox} />
          {f.priceOnRequest}
        </label>
        <label className={checkboxRow}>
          <input type="checkbox" name="featured" defaultChecked={values.featured} className={checkbox} />
          {f.featured}
        </label>
        <label className={checkboxRow}>
          <input type="checkbox" name="demo" defaultChecked={values.demo} className={checkbox} />
          {f.demo}
        </label>
      </div>

      <div>
        <label htmlFor="product-video" className={fieldLabel}>
          {f.video}
        </label>
        <input id="product-video" name="videoUrl" type="url" inputMode="url" autoComplete="off" defaultValue={values.videoUrl} className={fieldInput} {...invalid("video")} />
        {error("video")}
      </div>

      <div>
        <label htmlFor="product-slug" className={fieldLabel}>
          {f.slug}
        </label>
        <input id="product-slug" name="slug" defaultValue={values.slug} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby="hint-slug" className={fieldInput} {...invalid("slug")} />
        {error("slug") ?? (
          <p id="hint-slug" className={fieldHint}>
            {f.slugHint}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className={`${buttonPrimary} w-full sm:w-auto`}>
        {pending ? t.saving : t.save}
      </button>
      <p role="status" className={state.status === "error" ? "text-destructive text-sm" : "sr-only"}>
        {state.message}
      </p>
    </form>
  );
}
