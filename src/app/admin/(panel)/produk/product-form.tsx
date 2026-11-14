"use client";

import { useActionState, useEffect, useRef } from "react";
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
  const [state, formAction, pending] = useActionState(saveProduct.bind(null, productId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const f = t.fields;

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
    <form ref={formRef} action={formAction} noValidate className="space-y-4 rounded-lg border bg-background p-4">
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
